/**
 * E-pay 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createEpayClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class EpayStrategy implements PaymentStrategy {
  name = 'epay'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.EPAY_API_URL || !this.env.EPAY_PID || !this.env.EPAY_KEY) {
      throw new Error('E-pay支付未配置')
    }

    const epayClient = createEpayClient({
      apiUrl: this.env.EPAY_API_URL,
      pid: this.env.EPAY_PID,
      key: this.env.EPAY_KEY,
      signType: (this.env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/epay`
    const returnUrl = `${baseUrl}/success`

    const payment = await epayClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      returnUrl,
      channel: (input.trade_type as 'wechat' | 'alipay' | 'qq') || 'alipay',
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_no!,
      order_id: input.order_id,
      payment_method: PaymentMethod.EPAY,
      amount: input.amount,
      actual_amount: payment.payment_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.payment_url,
      trade_type: input.trade_type,
      expiration_time: PAYMENT_TIMEOUT.ALIPAY,
    })

    return {
      trade_id: payment.trade_no!,
      payment_url: payment.payment_url,
      actual_amount: String(payment.payment_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    if (!this.env.EPAY_API_URL || !this.env.EPAY_PID || !this.env.EPAY_KEY) {
      return false
    }

    const epayClient = createEpayClient({
      apiUrl: this.env.EPAY_API_URL,
      pid: this.env.EPAY_PID,
      key: this.env.EPAY_KEY,
    })

    return epayClient.verifyCallback(data)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerEpayStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('epay', new EpayStrategy(env, db))
}
