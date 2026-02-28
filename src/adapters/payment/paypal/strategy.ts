/**
 * PayPal 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createPayPalClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class PayPalStrategy implements PaymentStrategy {
  name = 'paypal'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.PAYPAL_CLIENT_ID || !this.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal支付未配置')
    }

    const paypalClient = createPayPalClient({
      clientId: this.env.PAYPAL_CLIENT_ID,
      clientSecret: this.env.PAYPAL_CLIENT_SECRET,
      mode: (this.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/paypal`
    const returnUrl = `${baseUrl}/success`

    const payment = await paypalClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      returnUrl,
      currency: 'USD',
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_id!,
      order_id: input.order_id,
      payment_method: PaymentMethod.PAYPAL,
      amount: input.amount,
      actual_amount: payment.actual_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.payment_url,
      trade_type: 'paypal',
      expiration_time: PAYMENT_TIMEOUT.ALIPAY,
    })

    return {
      trade_id: payment.trade_id!,
      payment_url: payment.payment_url,
      actual_amount: String(payment.actual_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    if (!this.env.PAYPAL_CLIENT_ID || !this.env.PAYPAL_CLIENT_SECRET) {
      return false
    }

    const paypalClient = createPayPalClient({
      clientId: this.env.PAYPAL_CLIENT_ID,
      clientSecret: this.env.PAYPAL_CLIENT_SECRET,
      mode: (this.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
    })

    return paypalClient.verifyWebhook(data)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerPayPalStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('paypal', new PayPalStrategy(env, db))
}
