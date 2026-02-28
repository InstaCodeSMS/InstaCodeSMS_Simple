/**
 * Hono RPC 路由
 * 提供类型安全的 API 端点
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../adapters/database/supabase'
import { PaymentService } from '../domains/payment/payment.service'
import { OrderRepository } from '../domains/order/order.repo'
import type { Env } from '../types/env'
import type { ApiResponse, OrderCreateParams } from '../types/api'
import { type CreatePaymentRequest, type CreatePaymentResponse } from '../adapters/payment/types'
import { PaymentMethod, PaymentStatus } from '../domains/payment/payment.schema'
import { createUpstreamClient, UpstreamError } from '../adapters/upstream'

const app = new Hono<{ Bindings: Env }>()

// ========== 支付 RPC ==========

app.post('/payment/create', async (c) => {
  try {
    const body = await c.req.json<CreatePaymentRequest>()

    if (!body.amount || !body.payment_method || !body.product_info) {
      return c.json<ApiResponse>(
        { success: false, message: '缺少必要参数' },
        400
      )
    }

    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const supabase = createSupabaseServiceClient(c.env)
    const paymentService = new PaymentService(supabase, c.env)

    const result = await paymentService.createPayment({
      order_id: orderId,
      amount: body.amount,
      payment_method: body.payment_method as PaymentMethod,
      product_info: body.product_info,
      trade_type: body.trade_type,
    })

    const response: CreatePaymentResponse = {
      trade_id: result.trade_id,
      order_id: orderId,
      payment_method: body.payment_method,
      status: PaymentStatus.PENDING,
      expiration_time: body.payment_method === 'alipay' ? 300 : 600,
      token: result.qr_code_url || result.qr_code,
      actual_amount: result.actual_amount,
      payment_url: result.payment_url,
      qr_code: result.qr_code,
      qr_code_url: result.qr_code_url,
    }

    return c.json<ApiResponse<CreatePaymentResponse>>({
      success: true,
      message: '支付订单创建成功',
      data: response,
    })
  } catch (error) {
    console.error('Payment creation failed:', error)
    return c.json<ApiResponse>(
      { success: false, message: '创建支付订单失败' },
      500
    )
  }
})

app.get('/payment/status', async (c) => {
  try {
    const tradeId = c.req.query('trade_id')
    if (!tradeId) {
      return c.json<ApiResponse>({ success: false, message: '缺少参数：trade_id' }, 400)
    }

    const supabase = createSupabaseServiceClient(c.env)
    const paymentService = new PaymentService(supabase, c.env)
    const order = await paymentService.queryPaymentStatus(tradeId)

    return c.json<ApiResponse>({
      success: true,
      message: '查询成功',
      data: {
        trade_id: order.trade_id,
        order_id: order.order_id,
        status: order.status,
        paid_at: order.paid_at,
        actual_amount: order.actual_amount?.toString(),
        block_transaction_id: order.block_transaction_id,
      },
    })
  } catch (error) {
    console.error('Payment status query failed:', error)
    return c.json<ApiResponse>(
      { success: false, message: '查询失败' },
      500
    )
  }
})

app.get('/payment/order/:trade_id', async (c) => {
  try {
    const tradeId = c.req.param('trade_id')

    const supabase = createSupabaseServiceClient(c.env)
    const repo = new OrderRepository(supabase)

    const order = await repo.findByTradeId(tradeId)

    if (!order) {
      return c.json<ApiResponse>(
        { success: false, message: '订单不存在' },
        404
      )
    }

    return c.json<ApiResponse>(
      { success: true, message: '获取成功', data: order },
      200
    )
  } catch (error) {
    console.error('Order retrieval failed:', error)
    return c.json<ApiResponse>(
      { success: false, message: '获取订单详情失败' },
      500
    )
  }
})

// ========== 订单 RPC ==========

app.post('/orders/create', async (c) => {
  try {
    const body = await c.req.json<OrderCreateParams>()

    const appId = body.app_id
    const num = body.num

    if (!appId || typeof appId !== 'number') {
      return c.json<ApiResponse>(
        { success: false, message: '请选择服务项目' },
        400
      )
    }

    if (!num || typeof num !== 'number' || num < 1) {
      return c.json<ApiResponse>(
        { success: false, message: '请输入正确的数量' },
        400
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const result = await client.createOrder({
      app_id: appId,
      type: body.type,
      num,
      expiry: body.expiry,
      prefix: body.prefix,
      exclude_prefix: body.exclude_prefix,
    })

    return c.json<ApiResponse>({
      success: true,
      message: '订单创建成功',
      data: result,
    })
  } catch (error) {
    if (error instanceof UpstreamError) {
      return c.json<ApiResponse>(
        { success: false, message: error.message },
        400
      )
    }
    console.error('Order creation failed:', error)
    return c.json<ApiResponse>(
      { success: false, message: '订单创建失败' },
      500
    )
  }
})

export default app
