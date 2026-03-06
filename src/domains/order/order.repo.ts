/**
 * 订单仓库层
 * 处理支付订单的数据库操作
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PaymentOrderStatus,
  type PaymentOrderRecord,
  type CreatePaymentOrderParams,
  type UpdatePaymentOrderParams,
  type ProductSnapshot,
  PaymentOrderRecordSchema,
} from './order.schema'

/**
 * 订单仓库
 */
export class OrderRepository {
  private client: SupabaseClient
  private tableName = 'payment_orders'

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * 创建支付订单
   */
  async create(params: CreatePaymentOrderParams): Promise<PaymentOrderRecord> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        trade_id: params.trade_id,
        order_id: params.order_id,
        payment_method: params.payment_method,
        amount: params.amount,
        actual_amount: params.actual_amount ?? null,
        status: params.status,
        product_info: params.product_info,
        token: params.token ?? null,
        trade_type: params.trade_type ?? null,
        expiration_time: params.expiration_time,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`创建支付订单失败: ${error.message}`)
    }

    return this.mapRecord(data)
  }

  /**
   * 根据交易 ID 获取订单
   */
  async findByTradeId(tradeId: string): Promise<PaymentOrderRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq('trade_id', tradeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`查询订单失败: ${error.message}`)
    }

    return this.mapRecord(data)
  }

  /**
   * 根据商户订单号获取订单
   */
  async findByOrderId(orderId: string): Promise<PaymentOrderRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq('order_id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`查询订单失败: ${error.message}`)
    }

    return this.mapRecord(data)
  }

  /**
   * 更新订单状态
   */
  async update(tradeId: string, params: UpdatePaymentOrderParams): Promise<PaymentOrderRecord> {
    const updateData: Record<string, unknown> = {}

    if (params.status !== undefined) updateData.status = params.status
    if (params.actual_amount !== undefined) updateData.actual_amount = params.actual_amount
    if (params.paid_at !== undefined) updateData.paid_at = params.paid_at
    if (params.block_transaction_id !== undefined) {
      updateData.block_transaction_id = params.block_transaction_id
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('trade_id', tradeId)
      .select()
      .single()

    if (error) {
      throw new Error(`更新订单失败: ${error.message}`)
    }

    return this.mapRecord(data)
  }

  /**
   * 标记订单为已支付
   */
  async markAsPaid(
    tradeId: string,
    actualAmount: number,
    blockTransactionId: string
  ): Promise<PaymentOrderRecord> {
    return this.update(tradeId, {
      status: PaymentOrderStatus.PAID,
      actual_amount: actualAmount,
      paid_at: new Date().toISOString(),
      block_transaction_id: blockTransactionId,
    })
  }

  /**
   * 标记订单为超时
   */
  async markAsTimeout(tradeId: string): Promise<PaymentOrderRecord> {
    return this.update(tradeId, {
      status: PaymentOrderStatus.TIMEOUT,
    })
  }

  /**
   * 获取待支付的订单列表
   */
  async findPendingOrders(): Promise<PaymentOrderRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq('status', PaymentOrderStatus.PENDING)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`查询待支付订单失败: ${error.message}`)
    }

    return data.map((item) => this.mapRecord(item))
  }

  /**
   * 获取已过期的订单列表
   */
  async findExpiredOrders(): Promise<PaymentOrderRecord[]> {
    const now = new Date()

    // 在数据库中计算过期时间，避免加载全表
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq('status', PaymentOrderStatus.PENDING)
      .lt('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    if (error) {
      throw new Error(`查询过期订单失败: ${error.message}`)
    }

    // 在应用层再次验证过期时间
    const expiredOrders = data.filter((item) => {
      const createdAt = new Date(item.created_at)
      const expiresAt = new Date(createdAt.getTime() + item.expiration_time * 1000)
      return expiresAt < now
    })

    return expiredOrders.map((item) => this.mapRecord(item))
  }

  /**
   * 映射数据库记录到类型
   */
  private mapRecord(data: Record<string, unknown>): PaymentOrderRecord {
    return PaymentOrderRecordSchema.parse({
      trade_id: data.trade_id,
      order_id: data.order_id,
      payment_method: data.payment_method,
      amount: Number(data.amount),
      actual_amount: data.actual_amount != null ? Number(data.actual_amount) : null,
      status: Number(data.status),
      product_info: data.product_info,
      token: data.token || null,
      trade_type: data.trade_type || null,
      expiration_time: Number(data.expiration_time),
      created_at: data.created_at,
      updated_at: data.updated_at,
      paid_at: data.paid_at || null,
      block_transaction_id: data.block_transaction_id || null,
      // 上游购买结果字段
      tel: data.tel || null,
      sms_token: data.sms_token || null,
      upstream_order_id: data.upstream_order_id || null,
      api_url: data.api_url || null,
    })
  }
}

/**
 * 创建订单仓库实例
 */
export function createOrderRepository(client: SupabaseClient): OrderRepository {
  return new OrderRepository(client)
}