/**
 * Token Pay 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createTokenPayClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class TokenPayStrategy implements PaymentStrategy {
  name = 'tokenpay'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.TOKENPAY_API_URL || !this.env.TOKENPAY_MERCHANT_ID || !this.env.TOKENPAY_API_KEY) {
      throw new Error('Token Pay支付未配置')
    }

    const tokenPayClient = createTokenPayClient({
      apiUrl: this.env.TOKENPAY_API_URL,
      merchantId: this.env.TOKENPAY_MERCHANT_ID,
      apiKey: this.env.TOKENPAY_API_KEY,
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/tokenpay`
    const redirectUrl = `${baseUrl}/success`

    const payment = await tokenPayClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      redirectUrl,
      currency: (input.trade_type as 'USDT' | 'TRX') || 'USDT',
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_id!,
      order_id: input.order_id,
      payment_method: PaymentMethod.TOKENPAY,
      amount: input.amount,
      actual_amount: payment.actual_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.payment_url,
      trade_type: input.trade_type,
      expiration_time: PAYMENT_TIMEOUT.USDT,
    })

    return {
      trade_id: payment.trade_id!,
      payment_url: payment.payment_url,
      actual_amount: String(payment.actual_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    if (!this.env.TOKENPAY_API_URL || !this.env.TOKENPAY_MERCHANT_ID || !this.env.TOKENPAY_API_KEY) {
      return false
    }

    const tokenPayClient = createTokenPayClient({
      apiUrl: this.env.TOKENPAY_API_URL,
      merchantId: this.env.TOKENPAY_MERCHANT_ID,
      apiKey: this.env.TOKENPAY_API_KEY,
    })

    return tokenPayClient.verifyCallback(data)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerTokenPayStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('tokenpay', new TokenPayStrategy(env, db))
}
