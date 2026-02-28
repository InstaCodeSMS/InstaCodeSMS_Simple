/**
 * Stripe 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createStripeClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class StripeStrategy implements PaymentStrategy {
  name = 'stripe'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.STRIPE_SECRET_KEY || !this.env.STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Stripe支付未配置')
    }

    const stripeClient = createStripeClient({
      secretKey: this.env.STRIPE_SECRET_KEY,
      publishableKey: this.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: this.env.STRIPE_WEBHOOK_SECRET || '',
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/stripe`
    const returnUrl = `${baseUrl}/success`

    const payment = await stripeClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      returnUrl,
      currency: 'usd',
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_id!,
      order_id: input.order_id,
      payment_method: PaymentMethod.STRIPE,
      amount: input.amount,
      actual_amount: payment.actual_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.payment_url,
      trade_type: 'stripe',
      expiration_time: PAYMENT_TIMEOUT.ALIPAY,
    })

    return {
      trade_id: payment.trade_id!,
      payment_url: payment.payment_url,
      actual_amount: String(payment.actual_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    // Stripe webhook verification is done differently (via signature header)
    // This is a placeholder for basic validation
    const webhook = data as any
    return !!(webhook.id && webhook.type && webhook.data)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerStripeStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('stripe', new StripeStrategy(env, db))
}
