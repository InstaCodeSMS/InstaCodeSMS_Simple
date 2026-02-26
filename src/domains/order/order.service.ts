/**
 * 订单领域 - 业务逻辑层
 * 处理订单的创建、查询、状态管理等业务逻辑
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createUpstreamClient, UpstreamError } from '../../adapters/upstream'
import { OrderRepository } from './order.repo'
import { PaymentOrderStatus } from './order.schema'
import type { Env } from '../../types/env'

/**
 * 订单服务
 * 处理订单相关的业务逻辑
 */
export class OrderService {
  private orderRepo: OrderRepository
  private env: Env

  constructor(db: SupabaseClient, env: Env) {
    this.orderRepo = new OrderRepository(db)
    this.env = env
  }

  /**
   * 创建订单
   * 调用上游 API 创建订单
   */
  async createOrder(appId: number, num: number, options?: {
    type?: number
    expiry?: number
    prefix?: string
    exclude_prefix?: string
  }) {
    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      // 创建订单
      const data = await client.createOrder({
        app_id: appId,
        type: options?.type ?? 1,
        num,
        expiry: options?.expiry ?? 0,
        prefix: options?.prefix,
        exclude_prefix: options?.exclude_prefix,
      })

      return {
        ordernum: data.ordernum,
        api_count: data.api_count,
        items: data.list.map((item) => ({
          tel: item.tel,
          end_time: item.end_time,
          token: item.token,
        })),
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw new Error(`创建订单失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 获取订单列表
   */
  async getOrderList(options?: {
    page?: number
    limit?: number
    ordernum?: string
    cate_id?: number
    app_id?: number
    type?: number
  }) {
    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      const data = await client.getOrderList({
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        ordernum: options?.ordernum,
        cate_id: options?.cate_id,
        app_id: options?.app_id,
        type: options?.type,
      })

      return {
        list: data.list.map((item) => ({
          id: item.id,
          ordernum: item.ordernum,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          num: item.num,
          remark: item.remark,
          status: item.status,
          create_time: item.create_time,
          app_name: item.smsApp?.name || '',
        })),
        total: data.total,
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw new Error(`获取订单列表失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(ordernum: string) {
    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      const data = await client.getOrderDetail({ ordernum })

      return {
        url_list: data.url_list,
        list: data.list.map((item) => ({
          id: item.id,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          tel: item.tel,
          token: item.token,
          end_time: item.end_time,
          sms_count: item.sms_count,
          voice_count: item.voice_count,
          remark: item.remark,
          status: item.status,
          api: item.api,
        })),
        total: data.total,
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw new Error(`获取订单详情失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 查询支付订单状态
   */
  async queryPaymentOrderStatus(tradeId: string) {
    const order = await this.orderRepo.findByTradeId(tradeId)

    if (!order) {
      throw new Error(`订单不存在: ${tradeId}`)
    }

    return {
      trade_id: order.trade_id,
      order_id: order.order_id,
      status: order.status,
      amount: order.amount,
      actual_amount: order.actual_amount,
      paid_at: order.paid_at,
      block_transaction_id: order.block_transaction_id,
    }
  }

  /**
   * 获取订单统计信息
   */
  async getOrderStats() {
    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      const profile = await client.getProfile()

      return {
        username: profile.username,
        balance: profile.money,
      }
    } catch (error) {
      throw new Error(`获取统计信息失败`)
    }
  }
}
