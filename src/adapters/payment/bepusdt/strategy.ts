/**
 * BEpusdt 支付策略
 */

import type { CreatePaymentInput } from '../../../domains/payment/payment.schema'
import type { PaymentStrategy, PaymentResult } from '../strategy'
import { createBepusdtClient } from './client'
import { paymentRegistry } from '../registry'
import type { Env } from '../../../types/env'
import { OrderRepository } from '../../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../../domains/order/order.schema'
import { PaymentMethod } from '../../../domains/payment/payment.schema'
import { PAYMENT_TIMEOUT } from '../../../constants/business'
import type { SupabaseClient } from '@supabase/supabase-js'

export class UsdtStrategy implements PaymentStrategy {
  name = 'usdt'
  private env: Env
  private db: SupabaseClient

  constructor(env: Env, db: SupabaseClient) {
    this.env = env
    this.db = db
  }

  async createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult> {
    if (!this.env.BEPUSDT_API_URL || !this.env.BEPUSDT_API_TOKEN) {
      throw new Error('USDT支付未配置')
    }

    const bepusdtClient = createBepusdtClient(this.env)
    const notifyUrl = this.env.BEPUSDT_NOTIFY_URL || `${baseUrl}/api/payment/callback`
    const redirectUrl = `${baseUrl}/success`

    const transaction = await bepusdtClient.createTransaction({
      orderId: input.order_id,
      amount: input.amount,
      notifyUrl,
      redirectUrl,
      tradeType: input.trade_type as 'usdt.trc20' | undefined,
      name: input.product_info.title,
      timeout: 600,
    })

    const orderRepo = new OrderRepository(this.db)
    await orderRepo.create({
      trade_id: transaction.trade_id,
      order_id: input.order_id,
      payment_method: PaymentMethod.USDT,
      amount: input.amount,
      actual_amount: parseFloat(transaction.actual_amount),
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as ProductSnapshot,
      token: transaction.token,
      trade_type: input.trade_type,
      expiration_time: PAYMENT_TIMEOUT.USDT,
    })

    return {
      trade_id: transaction.trade_id,
      payment_url: transaction.payment_url,
      actual_amount: transaction.actual_amount,
    }
  }

  verifyCallback(data: unknown): boolean {
    if (!this.env.BEPUSDT_API_URL || !this.env.BEPUSDT_API_TOKEN) {
      return false
    }

    const bepusdtClient = createBepusdtClient(this.env)
    return bepusdtClient.verifyCallback(data as any)
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const orderRepo = new OrderRepository(this.db)
    await orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }
}

// 自动注册
export function registerUsdtStrategy(env: Env, db: SupabaseClient): void {
  paymentRegistry.register('usdt', new UsdtStrategy(env, db))
}
