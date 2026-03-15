/**
 * EPay 支付回调 Webhook 路由
 * 
 * 路径: GET /api/webhooks/payment/epay
 * 安全机制：签名验证 (MD5/RSA)
 */

import { Hono } from 'hono'
import type { Env } from '../../../../types/env'
import { createSupabaseServiceClient } from '../../../../adapters/database/supabase'
import { createOrderRepository } from '../../../../domains/order/order.repo'
import { PaymentOrderStatus } from '../../../../domains/order/order.schema'
import { createEpayClient } from '../../../../adapters/payment/epay/client'
import { createUpstreamClient } from '../../../../adapters/upstream'
import type { EpayCallbackData } from '../../../../adapters/payment/epay/types'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/webhooks/payment/epay
 * EPay 支付回调处理
 * 
 * 安全层级：
 * 1. 签名验证 - MD5 或 RSA 签名确保请求来自支付平台
 * 2. 幂等性检查 - 数据库状态检查防止重复处理
 */
app.get('/', async (c) => {
  const startTime = Date.now()
  const logContext = {
    timestamp: new Date().toISOString(),
    ip: c.req.header('cf-connecting-ip'),
    country: c.req.header('cf-ipcountry'),
  }

  try {
    // 获取所有查询参数，用于签名验证
    const allParams = Object.fromEntries(new URL(c.req.url).searchParams)
    
    // 提取固定字段用于业务逻辑
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

    console.log('[Webhook/EPay] 收到回调', {
      ...logContext,
      trade_no: params.trade_no,
      out_trade_no: params.out_trade_no,
      trade_status: params.trade_status,
      money: params.money,
    })

    // 验证交易状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[Webhook/EPay] 交易状态非成功，忽略', { 
        ...logContext,
        trade_status: params.trade_status 
      })
      return c.text('success')
    }

    // 环境变量检查
    const env = c.env as Env
    if (!env.EPAY_API_URL || !env.EPAY_PID || !env.EPAY_KEY) {
      console.error('[Webhook/EPay] 易支付未配置', logContext)
      return c.text('success')
    }

    // 创建 EPay 客户端
    const epayClient = createEpayClient({
      apiUrl: env.EPAY_API_URL,
      pid: env.EPAY_PID,
      key: env.EPAY_KEY,
      signType: (env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
      publicKey: env.EPAY_PUBLIC_KEY,
      privateKey: env.EPAY_PRIVATE_KEY,
    })

    // 第一道防线：签名验证
    if (!(await epayClient.verifyCallback(allParams))) {
      console.error('[Webhook/EPay] 签名验证失败', logContext)
      return c.text('success')
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单 - 易支付 trade_no 对应数据库的 trade_id
    const order = await orderRepo.findByTradeId(params.trade_no)
    if (!order) {
      console.warn('[Webhook/EPay] 订单不存在', {
        ...logContext,
        trade_no: params.trade_no,
        out_trade_no: params.out_trade_no,
      })
      return c.text('success')
    }

    // 第二道防线：幂等性检查
    if (order.status === PaymentOrderStatus.PAID) {
      console.log('[Webhook/EPay] 订单已支付，忽略重复回调', {
        ...logContext,
        trade_no: params.trade_no,
      })
      return c.text('success')
    }

    // 更新订单状态 - 使用 trade_id (params.trade_no) 作为主键
    console.log('[Webhook/EPay] 标记订单为已支付', {
      ...logContext,
      trade_id: params.trade_no,
      order_id: order.order_id,
      money: params.money,
    })
    await orderRepo.markAsPaid(params.trade_no, parseFloat(params.money), params.trade_no)

    // 调用上游API购买商品
    try {
      console.log('[Webhook/EPay] 开始调用上游API购买商品')
      
      const productInfo = order.product_info as any
      if (!productInfo?.service_id) {
        console.error('[Webhook/EPay] 订单缺少产品信息', logContext)
        return c.text('success')
      }

      const upstreamClient = createUpstreamClient(env)
      const upstreamOrder = await upstreamClient.createOrder({
        app_id: productInfo.service_id,
        type: 1,
        num: productInfo.quantity || 1,
        expiry: productInfo.expiry || 0,
        prefix: '',
      })

      const firstOrder = upstreamOrder.list[0]
      
      console.log('[Webhook/EPay] 上游API调用成功', {
        ...logContext,
        tel: firstOrder?.tel,
        ordernum: upstreamOrder.ordernum,
      })

      // 更新订单信息
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          upstream_result: {
            ordernum: upstreamOrder.ordernum,
            tel: firstOrder?.tel,
            token: firstOrder?.token,
            api: firstOrder?.api,
            end_time: firstOrder?.end_time,
            api_count: upstreamOrder.api_count,
          },
          upstream_order_id: upstreamOrder.ordernum,
        })
        .eq('trade_id', params.trade_no)

      if (updateError) {
        console.error('[Webhook/EPay] 更新订单信息失败', {
          ...logContext,
          error: updateError,
        })
      } else {
        console.log('[Webhook/EPay] 订单信息更新成功', logContext)
      }
    } catch (upstreamError) {
      console.error('[Webhook/EPay] 上游API调用失败', {
        ...logContext,
        error: upstreamError instanceof Error ? upstreamError.message : String(upstreamError),
      })
    }

    console.log('[Webhook/EPay] 处理成功', {
      ...logContext,
      duration: Date.now() - startTime,
    })

    return c.text('success')
  } catch (error) {
    console.error('[Webhook/EPay] 处理失败', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    })
    return c.text('success')
  }
})

export default app