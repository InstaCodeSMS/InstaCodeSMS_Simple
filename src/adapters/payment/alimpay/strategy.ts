/**
 * AliMPay 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createAlimpayClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class AlipayStrategy implements PaymentStrategy {
  name = 'alipay'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.ALIMPAY_API_URL || !this.env.ALIMPAY_PID || !this.env.ALIMPAY_KEY) {
      throw new Error('支付宝支付未配置')
    }

    const alimpayClient = createAlimpayClient({
      apiUrl: this.env.ALIMPAY_API_URL,
      pid: this.env.ALIMPAY_PID,
      key: this.env.ALIMPAY_KEY,
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/alipay`
    const returnUrl = `${baseUrl}/success`

    const payment = await alimpayClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      returnUrl,
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_no!,
      order_id: input.order_id,
      payment_method: PaymentMethod.ALIPAY,
      amount: input.amount,
      actual_amount: payment.payment_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.qr_code_url || payment.qr_code,
      trade_type: 'alipay',
      expiration_time: PAYMENT_TIMEOUT.ALIPAY,
    })

    return {
      trade_id: payment.trade_no!,
      payment_url: payment.payment_url,
      qr_code: payment.qr_code,
      qr_code_url: payment.qr_code_url,
      actual_amount: String(payment.payment_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    if (!this.env.ALIMPAY_API_URL || !this.env.ALIMPAY_PID || !this.env.ALIMPAY_KEY) {
      return false
    }

    const alimpayClient = createAlimpayClient({
      apiUrl: this.env.ALIMPAY_API_URL,
      pid: this.env.ALIMPAY_PID,
      key: this.env.ALIMPAY_KEY,
    })

    return alimpayClient.verifyCallback(data as any)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerAlipayStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('alipay', new AlipayStrategy(env, db))
}
