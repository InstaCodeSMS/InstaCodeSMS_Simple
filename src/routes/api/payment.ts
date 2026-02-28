/**
 * 支付 API 路由
 * 处理支付订单创建、状态查询、回调处理
 * 使用 Supabase 持久化存储
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { PaymentService } from '../../domains/payment/payment.service'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { type CreatePaymentRequest, type CreatePaymentResponse } from '../../adapters/payment/types'
import type { BepusdtCallbackData } from '../../adapters/payment/bepusdt/types'
import type { CallbackParams as AlimpayCallbackParams } from '../../adapters/payment/alimpay/types'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/payment/create
 * 创建支付订单
 */
app.post('/create', async (c) => {
  try {
    const body = await c.req.json<CreatePaymentRequest>()

    if (!body.amount || !body.payment_method || !body.product_info) {
      return c.json<ApiResponse>(
        { success: false, message: '缺少必要参数' },
        400
      )
    }

    // 服务端生成订单ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const supabase = createSupabaseServiceClient(c.env)
    const paymentService = new PaymentService(supabase, c.env)

    const result = await paymentService.createPayment({
      order_id: orderId,
      amount: body.amount,
      payment_method: body.payment_method as any,
      product_info: body.product_info,
      trade_type: body.trade_type,
    })

    const response: CreatePaymentResponse = {
      trade_id: result.trade_id,
      order_id: orderId,
      payment_method: body.payment_method,
      status: 0,
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
    console.error('创建支付订单失败:', error)
    return c.json<ApiResponse>(
      { success: false, message: error instanceof Error ? error.message : '创建支付订单失败' },
      500
    )
  }
})

/**
 * GET /api/payment/status
 * 查询支付状态
 */
app.get('/status', async (c) => {
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
    return c.json<ApiResponse>(
      { success: false, message: error instanceof Error ? error.message : '查询失败' },
      500
    )
  }
})

/**
 * POST /api/payment/callback
 * BEpusdt 支付回调
 */
app.post('/callback', async (c) => {
  try {
    const body = await c.req.json<BepusdtCallbackData>()

    // 验证签名
    const client = createBepusdtClient(c.env)
    if (!client.verifyCallback(body)) {
      console.warn('支付回调签名验证失败:', body)
      return c.text('invalid signature', 400)
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(body.trade_id)
    if (!order) {
      console.warn('支付回调订单不存在:', body.trade_id)
      return c.text('order not found', 404)
    }

    // 更新订单状态
    if (body.status === 2) {
      // 支付成功
      await orderRepo.markAsPaid(
        body.trade_id,
        parseFloat(String(body.actual_amount)),
        body.block_transaction_id || ''
      )

      console.log('支付成功:', {
        trade_id: body.trade_id,
        order_id: body.order_id,
        amount: body.amount,
        actual_amount: body.actual_amount,
      })
    } else if (body.status === 3) {
      // 支付超时
      await orderRepo.markAsTimeout(body.trade_id)
    }

    // 返回成功响应
    return c.text('ok')
  } catch (error) {
    console.error('处理支付回调失败:', error)
    return c.text('error', 500)
  }
})

/**
 * GET /api/payment/callback/alipay
 * AliMPay 支付回调
 */
app.get('/callback/alipay', async (c) => {
  // 记录原始请求信息
  const rawUrl = c.req.url
  const rawQuery = Object.fromEntries(new URL(rawUrl).searchParams)
  
  console.log('[AliMPay Callback] 收到回调请求:', {
    url: rawUrl,
    query: rawQuery,
    timestamp: new Date().toISOString()
  })

  try {
    // AliMPay 使用 GET 方式回调
    const params: AlimpayCallbackParams = {
      pid: c.req.query('pid') || '',
      trade_no: c.req.query('trade_no') || '',
      out_trade_no: c.req.query('out_trade_no') || '',
      type: c.req.query('type') || '',
      name: c.req.query('name') || '',
      money: c.req.query('money') || '',
      trade_status: c.req.query('trade_status') as 'TRADE_SUCCESS' | 'TRADE_CLOSED' | 'WAIT_BUYER_PAY',
      sign: c.req.query('sign') || '',
      sign_type: (c.req.query('sign_type') as 'MD5') || 'MD5',
    }

    console.log('[AliMPay Callback] 解析后的参数:', JSON.stringify(params, null, 2))

    // 验证签名
    if (!c.env.ALIMPAY_API_URL || !c.env.ALIMPAY_PID || !c.env.ALIMPAY_KEY) {
      console.error('[AliMPay Callback] 环境变量未配置')
      return c.text('fail', 400)
    }

    const alimpayClient = createAlimpayClient({
      apiUrl: c.env.ALIMPAY_API_URL,
      pid: c.env.ALIMPAY_PID,
      key: c.env.ALIMPAY_KEY,
    })

    const isValidSign = alimpayClient.verifyCallback(params)
    console.log('[AliMPay Callback] 签名验证结果:', isValidSign)

    if (!isValidSign) {
      console.error('[AliMPay Callback] 签名验证失败:', {
        received_sign: params.sign,
        params: params
      })
      return c.text('fail', 400)
    }

    // 验证交易状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[AliMPay Callback] 交易状态非成功:', params.trade_status)
      return c.text('fail', 400)
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(params.trade_no)
    if (!order) {
      console.error('[AliMPay Callback] 订单不存在:', params.trade_no)
      return c.text('fail', 404)
    }

    console.log('[AliMPay Callback] 找到订单:', {
      trade_id: order.trade_id,
      order_id: order.order_id,
      current_status: order.status
    })

    // 更新订单状态
    const updatedOrder = await orderRepo.markAsPaid(
      params.trade_no,
      parseFloat(params.money),
      params.trade_no // 使用平台订单号作为交易ID
    )

    console.log('[AliMPay Callback] 订单状态已更新:', {
      trade_id: updatedOrder.trade_id,
      status: updatedOrder.status,
      paid_at: updatedOrder.paid_at
    })

    return c.text('success')
  } catch (error) {
    console.error('[AliMPay Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * GET /api/payment/order/:trade_id
 * 获取支付订单详情（包含产品信息）
 */
app.get('/order/:trade_id', async (c) => {
  try {
    const tradeId = c.req.param('trade_id')

    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    const order = await orderRepo.findByTradeId(tradeId)

    if (!order) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '订单不存在',
        },
        404
      )
    }

    return c.json<ApiResponse>(
      {
        success: true,
        message: '获取成功',
        data: order,
      },
      200
    )
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取订单详情失败',
      },
      500
    )
  }
})

export default app