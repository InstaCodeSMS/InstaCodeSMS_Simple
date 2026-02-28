/**
 * 支付 API 路由
 * 处理支付订单创建、状态查询、回调处理
 * 使用 Supabase 持久化存储
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { PaymentService } from '../../domains/payment/payment.service'
import { createBepusdtClient, createAlimpayClient, paymentRegistry } from '../../adapters/payment'
import { createOrderRepository } from '../../domains/order/order.repo'
import { PaymentStatus } from '../../domains/payment/payment.schema'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { type CreatePaymentRequest, type CreatePaymentResponse } from '../../adapters/payment/types'
import type { BepusdtCallbackData } from '../../adapters/payment/bepusdt/types'
import type { CallbackParams as AlimpayCallbackParams } from '../../adapters/payment/alimpay/types'
import type { EpayCallbackData } from '../../adapters/payment/epay/types'
import type { TokenPayCallbackData } from '../../adapters/payment/tokenpay/types'
import type { PayPalWebhookData } from '../../adapters/payment/paypal/types'
import type { StripeWebhookData } from '../../adapters/payment/stripe/types'
import type { WeChatPayWebhookData } from '../../adapters/payment/wechatpay/types'

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

    if (!c.env.API_BASE_URL) {
      return c.json<ApiResponse>(
        { success: false, message: '服务器配置错误：缺少 API_BASE_URL' },
        500
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
    const body = await c.req.json()

    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(body.trade_id)
    if (!order) {
      console.warn('支付回调订单不存在:', body.trade_id)
      return c.text('order not found', 404)
    }

    // 验证签名
    const strategy = paymentRegistry.get('usdt')
    if (!strategy.verifyCallback(body)) {
      console.warn('支付回调签名验证失败:', body)
      return c.text('invalid signature', 400)
    }

    // 更新订单状态
    if (body.status === 2) {
      await strategy.markAsPaid(body.trade_id, parseFloat(String(body.actual_amount)), body.block_transaction_id || '')
    } else if (body.status === 3) {
      await orderRepo.markAsTimeout(body.trade_id)
    }

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
  try {
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

    // 验证交易状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[AliMPay Callback] 交易状态非成功:', params.trade_status)
      return c.text('fail', 400)
    }

    // 验证签名
    const strategy = paymentRegistry.get('alipay')
    if (!strategy.verifyCallback(params)) {
      console.error('[AliMPay Callback] 签名验证失败:', { received_sign: params.sign, params })
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

    // 更新订单状态
    await strategy.markAsPaid(params.trade_no, parseFloat(params.money), params.trade_no)

    return c.text('success')
  } catch (error) {
    console.error('[AliMPay Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * GET /api/payment/callback/epay
 * E-pay 支付回调
 */
app.get('/callback/epay', async (c) => {
  try {
    const params: EpayCallbackData = {
      pid: c.req.query('pid') || '',
      trade_no: c.req.query('trade_no') || '',
      out_trade_no: c.req.query('out_trade_no') || '',
      type: c.req.query('type') || '',
      name: c.req.query('name') || '',
      money: c.req.query('money') || '',
      trade_status: c.req.query('trade_status') || '',
      sign: c.req.query('sign') || '',
      sign_type: c.req.query('sign_type') || 'MD5',
    }

    // 验证签名
    const strategy = paymentRegistry.get('epay')
    if (!strategy.verifyCallback(params)) {
      console.error('[E-pay Callback] 签名验证失败:', params)
      return c.text('fail', 400)
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(params.trade_no)
    if (!order) {
      console.error('[E-pay Callback] 订单不存在:', params.trade_no)
      return c.text('fail', 404)
    }

    // 更新订单状态
    await strategy.markAsPaid(params.trade_no, parseFloat(params.money), params.trade_no)

    return c.text('success')
  } catch (error) {
    console.error('[E-pay Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * POST /api/payment/callback/tokenpay
 * Token Pay 支付回调
 */
app.post('/callback/tokenpay', async (c) => {
  try {
    const body = await c.req.json<TokenPayCallbackData>()

    // 验证签名
    const strategy = paymentRegistry.get('tokenpay')
    if (!strategy.verifyCallback(body)) {
      console.error('[Token Pay Callback] 签名验证失败:', body)
      return c.text('fail', 400)
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(body.trade_id)
    if (!order) {
      console.error('[Token Pay Callback] 订单不存在:', body.trade_id)
      return c.text('fail', 404)
    }

    // 更新订单状态
    if (body.status === 'completed') {
      await strategy.markAsPaid(body.trade_id, parseFloat(body.amount), body.trade_id)
    }

    return c.text('success')
  } catch (error) {
    console.error('[Token Pay Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * POST /api/payment/callback/paypal
 * PayPal 支付回调
 */
app.post('/callback/paypal', async (c) => {
  try {
    const body = await c.req.json<PayPalWebhookData>()

    // 验证webhook
    const strategy = paymentRegistry.get('paypal')
    if (!strategy.verifyCallback(body)) {
      console.error('[PayPal Callback] Webhook验证失败:', body)
      return c.text('fail', 400)
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(body.resource.id)
    if (!order) {
      console.error('[PayPal Callback] 订单不存在:', body.resource.id)
      return c.text('fail', 404)
    }

    // 更新订单状态
    if (body.event_type === 'CHECKOUT.ORDER.COMPLETED' && body.resource.status === 'COMPLETED') {
      const amount = body.resource.amount?.value ? parseFloat(body.resource.amount.value) : order.amount
      await strategy.markAsPaid(body.resource.id, amount, body.resource.id)
    }

    return c.text('success')
  } catch (error) {
    console.error('[PayPal Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * POST /api/payment/callback/stripe
 * Stripe 支付回调
 */
app.post('/callback/stripe', async (c) => {
  try {
    const body = await c.req.text()
    const signature = c.req.header('stripe-signature') || ''

    // 验证webhook签名
    const strategy = paymentRegistry.get('stripe')
    if (!strategy.verifyCallback({ body, signature })) {
      console.error('[Stripe Callback] 签名验证失败')
      return c.text('fail', 400)
    }

    const event = JSON.parse(body) as StripeWebhookData

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(event.data.object.id)
    if (!order) {
      console.error('[Stripe Callback] 订单不存在:', event.data.object.id)
      return c.text('fail', 404)
    }

    // 更新订单状态
    if (event.type === 'checkout.session.completed' && event.data.object.status === 'complete') {
      const amount = event.data.object.amount_total ? event.data.object.amount_total / 100 : order.amount
      await strategy.markAsPaid(event.data.object.id, amount, event.data.object.id)
    }

    return c.text('success')
  } catch (error) {
    console.error('[Stripe Callback] 处理失败:', error)
    return c.text('fail', 500)
  }
})

/**
 * POST /api/payment/callback/wechatpay
 * WeChat Pay 支付回调
 */
app.post('/callback/wechatpay', async (c) => {
  try {
    const body = await c.req.text()
    const signature = c.req.header('wechatpay-signature') || ''
    const timestamp = c.req.header('wechatpay-timestamp') || ''
    const nonce = c.req.header('wechatpay-nonce') || ''

    // 验证webhook签名
    const strategy = paymentRegistry.get('wechatpay')
    if (!strategy.verifyCallback({ body, signature, timestamp, nonce })) {
      console.error('[WeChat Pay Callback] 签名验证失败')
      return c.text('fail', 400)
    }

    const event = JSON.parse(body) as WeChatPayWebhookData

    // 初始化仓库
    const supabase = createSupabaseServiceClient(c.env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(event.id)
    if (!order) {
      console.error('[WeChat Pay Callback] 订单不存在:', event.id)
      return c.text('fail', 404)
    }

    // 更新订单状态
    if (event.event_type === 'TRANSACTION.SUCCESS') {
      await strategy.markAsPaid(event.id, order.amount, event.id)
    }

    return c.text('success')
  } catch (error) {
    console.error('[WeChat Pay Callback] 处理失败:', error)
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