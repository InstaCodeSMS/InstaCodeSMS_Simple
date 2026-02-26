/**
 * 支付回调处理工具
 * 处理来自支付网关的回调通知
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { OrderRepository } from '../domains/order/order.repo'

/**
 * 支付回调处理器
 */
export class PaymentCallbackHandler {
  private orderRepo: OrderRepository

  constructor(db: SupabaseClient) {
    this.orderRepo = new OrderRepository(db)
  }

  /**
   * 处理 USDT 支付回调
   */
  async handleUsdtCallback(data: {
    trade_id: string
    order_id: string
    status: number
    amount: number
    actual_amount?: number
    block_transaction_id?: string
  }): Promise<void> {
    // 验证订单存在
    const order = await this.orderRepo.findByTradeId(data.trade_id)
    if (!order) {
      throw new Error(`订单不存在: ${data.trade_id}`)
    }

    // 处理支付成功
    if (data.status === 2) {
      await this.orderRepo.markAsPaid(
        data.trade_id,
        data.actual_amount || data.amount,
        data.block_transaction_id || ''
      )

      console.log('USDT 支付成功:', {
        trade_id: data.trade_id,
        order_id: data.order_id,
        amount: data.actual_amount || data.amount,
      })
    }
    // 处理支付超时
    else if (data.status === 3) {
      await this.orderRepo.markAsTimeout(data.trade_id)

      console.log('USDT 支付超时:', {
        trade_id: data.trade_id,
        order_id: data.order_id,
      })
    }
  }

  /**
   * 处理支付宝回调
   */
  async handleAlipayCallback(data: {
    trade_no: string
    out_trade_no: string
    trade_status: string
    money: string
  }): Promise<void> {
    // 验证交易状态
    if (data.trade_status !== 'TRADE_SUCCESS') {
      console.log('支付宝交易状态非成功:', data.trade_status)
      return
    }

    // 验证订单存在
    const order = await this.orderRepo.findByTradeId(data.trade_no)
    if (!order) {
      throw new Error(`订单不存在: ${data.trade_no}`)
    }

    // 标记为已支付
    await this.orderRepo.markAsPaid(
      data.trade_no,
      parseFloat(data.money),
      data.trade_no
    )

    console.log('支付宝支付成功:', {
      trade_id: data.trade_no,
      order_id: data.out_trade_no,
      money: data.money,
    })
  }

  /**
   * 验证回调签名
   * 防止伪造回调
   */
  verifyCallbackSignature(
    data: Record<string, unknown>,
    signature: string,
    secret: string
  ): boolean {
    // TODO: 实现签名验证逻辑
    // 1. 按照支付网关的规则生成签名
    // 2. 比较签名是否匹配
    // 3. 返回验证结果

    // 临时实现：始终返回 true
    return true
  }
}

/**
 * 创建支付回调处理器
 */
export function createPaymentCallbackHandler(db: SupabaseClient): PaymentCallbackHandler {
  return new PaymentCallbackHandler(db)
}
