/**
 * 支付 API 路由
 * 处理支付订单创建、状态查询、回调处理
 * 使用 Supabase 持久化存储
 */

import { Hono } from 'hono'
import { createBepusdtClient, BepusdtError } from '../../adapters/payment/bepusdt/client'
import { createAlimpayClient, AlimpayError } from '../../adapters/payment/alimpay/client'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createOrderRepository } from '../../domains/order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../../domains/order/order.schema'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { PaymentStatus, type CreatePaymentRequest, type CreatePaymentResponse } from '../../adapters/payment/types'
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

    // 参数验证
    if (!body.order_id || !body.amount || !body.payment_method) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '缺少必要参数：order_id, amount, payment_method',
        },
        400
      )
    }

    if (!body.product_info) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '缺少产品信息：product_info',
        },
        400
      )
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)
    const baseUrl = new URL(c.req.url).origin

    // ========== 支付宝支付 ==========
    if (body.payment_method === 'alipay') {
      // 检查 AliMPay 配置
      if (!c.env.ALIMPAY_API_URL || !c.env.ALIMPAY_PID || !c.env.ALIMPAY_KEY) {
        return c.json<ApiResponse>(
          {
            success: false,
            message: '支付宝支付未配置',
          },
          400
        )
      }

      const alimpayClient = createAlimpayClient({
        apiUrl: c.env.ALIMPAY_API_URL,
        pid: c.env.ALIMPAY_PID,
        key: c.env.ALIMPAY_KEY,
      })

      const notifyUrl = `${baseUrl}/api/payment/callback/alipay`
      const returnUrl = `${baseUrl}/success`

      // 创建 AliMPay 订单
      const payment = await alimpayClient.createPayment({
        orderId: body.order_id,
        amount: body.amount,
        name: body.product_info.title,
        notifyUrl,
        returnUrl,
      })

      // 验证必要字段
      if (!payment.trade_no) {
        console.error('[Payment] AliMPay 响应缺少 trade_no:', payment)
        return c.json<ApiResponse>(
          {
            success: false,
            message: '支付平台返回数据异常：缺少订单号',
          },
          500
        )
      }

      // 存储订单到 Supabase
      await orderRepo.create({
        trade_id: payment.trade_no,
        order_id: body.order_id,
        payment_method: 'alipay',
        amount: body.amount,
        actual_amount: payment.payment_amount || body.amount,
        status: PaymentOrderStatus.PENDING,
        product_info: body.product_info as ProductSnapshot,
        token: payment.qr_code_url || payment.qr_code || undefined,
        trade_type: 'alipay',
        expiration_time: 300, // 5 分钟超时
      })

      // 构建响应
      const response: CreatePaymentResponse = {
        trade_id: payment.trade_no,
        order_id: body.order_id,
        payment_method: 'alipay',
        status: PaymentStatus.PENDING,
        expiration_time: 300,
        token: payment.qr_code_url || payment.qr_code,
        actual_amount: String(payment.payment_amount || body.amount),
        payment_url: payment.payment_url,
        qr_code: payment.qr_code, // base64 二维码
        qr_code_url: payment.qr_code_url, // 二维码链接
      }

      return c.json<ApiResponse<CreatePaymentResponse>>({
        success: true,
        message: '支付订单创建成功',
        data: response,
      })
    }

    // ========== USDT 支付 ==========
    if (body.payment_method !== 'usdt') {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '暂不支持该支付方式',
        },
        400
      )
    }

    const bepusdtClient = createBepusdtClient(c.env)

    // 构建回调地址
    const notifyUrl = c.env.BEPUSDT_NOTIFY_URL || `${baseUrl}/api/payment/callback`
    const redirectUrl = `${baseUrl}/success`

    // 创建 BEpusdt 交易
    const transaction = await bepusdtClient.createTransaction({
      orderId: body.order_id,
      amount: body.amount,
      notifyUrl,
      redirectUrl,
      tradeType: body.trade_type as 'usdt.trc20' | undefined,
      name: body.product_info.title,
      timeout: 600, // 10 分钟超时
    })

    // 存储订单到 Supabase
    await orderRepo.create({
      trade_id: transaction.trade_id,
      order_id: body.order_id,
      payment_method: 'usdt',
      amount: body.amount,
      actual_amount: parseFloat(transaction.actual_amount),
      status: PaymentOrderStatus.PENDING,
      product_info: body.product_info as ProductSnapshot,
      token: transaction.token,
      trade_type: body.trade_type,
      expiration_time: transaction.expiration_time,
    })

    // 构建响应
    const response: CreatePaymentResponse = {
      trade_id: transaction.trade_id,
      order_id: body.order_id,
      payment_method: 'usdt',
      status: PaymentStatus.PENDING,
      expiration_time: transaction.expiration_time,
      token: transaction.token,
      actual_amount: transaction.actual_amount,
      payment_url: transaction.payment_url,
      fiat: transaction.fiat,
    }

    return c.json<ApiResponse<CreatePaymentResponse>>({
      success: true,
      message: '支付订单创建成功',
      data: response,
    })
  } catch (error) {
    if (error instanceof BepusdtError) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: error.message,
        },
        error.statusCode as 400 | 500
      )
    }
    if (error instanceof AlimpayError) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: error.message,
        },
        error.statusCode as 400 | 500
      )
    }
    console.error('创建支付订单失败:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '创建支付订单失败，请稍后重试',
      },
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
      return c.json<ApiResponse>(
        {
          success: false,
          message: '缺少参数：trade_id',
        },
        400
      )
    }

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
        message: '查询成功',
        data: {
          trade_id: order.trade_id,
          order_id: order.order_id,
          status: order.status as number,
          paid_at: order.paid_at,
          actual_amount: order.actual_amount?.toString(),
          block_transaction_id: order.block_transaction_id,
        },
      },
      200
    )
  } catch (error) {
    console.error('查询支付状态失败:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '查询支付状态失败',
      },
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