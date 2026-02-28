/**
 * WeChat Pay 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createWeChatPayClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class WeChatPayStrategy implements PaymentStrategy {
  name = 'wechatpay'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.WECHATPAY_MERCHANT_ID || !this.env.WECHATPAY_API_V3_KEY || !this.env.WECHATPAY_PRIVATE_KEY) {
      throw new Error('WeChat Pay支付未配置')
    }

    const wechatPayClient = createWeChatPayClient({
      merchantId: this.env.WECHATPAY_MERCHANT_ID,
      apiV3Key: this.env.WECHATPAY_API_V3_KEY,
      privateKey: this.env.WECHATPAY_PRIVATE_KEY,
      certificate: this.env.WECHATPAY_CERTIFICATE || '',
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/wechatpay`
    const redirectUrl = `${baseUrl}/success`

    const payment = await wechatPayClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl,
      redirectUrl,
      tradeType: (input.trade_type as 'NATIVE' | 'H5') || 'NATIVE',
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: payment.trade_id!,
      order_id: input.order_id,
      payment_method: PaymentMethod.WECHATPAY,
      amount: input.amount,
      actual_amount: payment.actual_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: payment.qr_code || payment.payment_url,
      trade_type: input.trade_type,
      expiration_time: PAYMENT_TIMEOUT.ALIPAY,
    })

    return {
      trade_id: payment.trade_id!,
      payment_url: payment.payment_url,
      qr_code: payment.qr_code,
      actual_amount: String(payment.actual_amount || input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    // WeChat Pay webhook verification is done via signature header
    // This is a placeholder for basic validation
    const webhook = data as any
    return !!(webhook.id && webhook.event_type && webhook.resource)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerWeChatPayStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('wechatpay', new WeChatPayStrategy(env, db))
}
