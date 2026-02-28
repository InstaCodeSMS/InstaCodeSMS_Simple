/**
 * 支付领域 - 业务逻辑层
 * 协调支付适配器和订单仓库，处理支付流程
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { OrderRepository } from '../order/order.repo'
import { PaymentStatus, type CreatePaymentInput, type PaymentOrderResponse } from './payment.schema'
import type { Env } from '../../types/env'
import { paymentRegistry } from '../../adapters/payment/registry'

/**
 * 支付服务
 * 处理支付订单的创建、查询、回调等业务逻辑
 */
export class PaymentService {
  private orderRepo: OrderRepository
  private env: Env

  constructor(db: SupabaseClient, env: Env) {
    this.orderRepo = new OrderRepository(db)
    this.env = env
  }

  /**
   * 创建支付订单
   * 根据支付方式调用相应的支付网关
   */
  async createPayment(input: CreatePaymentInput): Promise<{
    trade_id: string
    payment_url?: string
    qr_code?: string
    qr_code_url?: string
    actual_amount: string
  }> {
    if (!this.env.API_BASE_URL) {
      throw new Error('缺少环境变量：API_BASE_URL')
    }

    const baseUrl = this.env.API_BASE_URL
    const strategy = paymentRegistry.get(input.payment_method)
    return strategy.createPayment(input, baseUrl)
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(tradeId: string): Promise<PaymentOrderResponse> {
    const order = await this.orderRepo.findByTradeId(tradeId)

    if (!order) {
      throw new Error(`订单不存在: ${tradeId}`)
    }

    return {
      trade_id: order.trade_id,
      order_id: order.order_id,
      status: order.status as unknown as PaymentStatus,
      amount: order.amount,
      actual_amount: order.actual_amount,
      payment_method: order.payment_method as any,
      paid_at: order.paid_at,
      block_transaction_id: order.block_transaction_id,
    }
  }

  /**
   * 标记订单为已支付
   */
  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    const strategy = paymentRegistry.get('usdt') // 获取任意策略来调用markAsPaid
    await strategy.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }

  /**
   * 标记订单为已超时
   */
  async markAsTimeout(tradeId: string): Promise<void> {
    await this.orderRepo.markAsTimeout(tradeId)
  }
}
