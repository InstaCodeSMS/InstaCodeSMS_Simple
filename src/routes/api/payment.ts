/**
 * 支付 API 路由 - 最小MVP版本
 * 仅处理易支付回调
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createOrderRepository } from '../../domains/order/order.repo'
import { PaymentOrderStatus } from '../../domains/order/order.schema'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import type { EpayCallbackData } from '../../adapters/payment/epay/types'
import { createEpayClient } from '../../adapters/payment/epay/client'
import { createUpstreamClient } from '../../adapters/upstream'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/payment/callback/epay
 * 易支付回调处理
 */
app.get('/callback/epay', async (c) => {
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

    console.log('[E-pay Callback] 收到回调:', {
      trade_no: params.trade_no,
      out_trade_no: params.out_trade_no,
      trade_status: params.trade_status,
      money: params.money,
    })

    // 验证交易状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[E-pay Callback] 交易状态非成功:', params.trade_status)
      return c.text('success')
    }

    // 验证签名
    const env = c.env as Env
    if (!env.EPAY_API_URL || !env.EPAY_PID || !env.EPAY_KEY) {
      console.error('[E-pay Callback] 易支付未配置')
      return c.text('success')
    }

    // 调试日志：检查环境变量状态
    console.log('[E-pay Debug] 环境变量检查:', {
      hasPrivateKey: !!env.EPAY_PRIVATE_KEY,
      privateKeyLength: env.EPAY_PRIVATE_KEY?.length || 0,
      hasPublicKey: !!env.EPAY_PUBLIC_KEY,
      publicKeyLength: env.EPAY_PUBLIC_KEY?.length || 0,
      signType: env.EPAY_SIGN_TYPE,
    })

    const epayClient = createEpayClient({
      apiUrl: env.EPAY_API_URL,
      pid: env.EPAY_PID,
      key: env.EPAY_KEY,
      signType: (env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
      publicKey: env.EPAY_PUBLIC_KEY,
      privateKey: env.EPAY_PRIVATE_KEY,
    })

    // 使用所有参数验证签名（不仅仅是固定字段）
    if (!(await epayClient.verifyCallback(allParams))) {
      console.error('[E-pay Callback] 签名验证失败')
      return c.text('success')
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单 - 易支付 trade_no 对应数据库的 trade_id
    const order = await orderRepo.findByTradeId(params.trade_no)
    if (!order) {
      console.warn('[E-pay Callback] 订单不存在:', params.out_trade_no)
      return c.text('success')
    }

    // 检查幂等性
    if (order.status === PaymentOrderStatus.PAID) {
      console.log('[E-pay Callback] 订单已支付，忽略重复回调:', params.out_trade_no)
      return c.text('success')
    }

    // 更新订单状态 - 使用 trade_id (params.trade_no) 作为主键
    console.log('[E-pay Callback] 标记订单为已支付:', {
      trade_id: params.trade_no,
      order_id: order.order_id,
      money: params.money,
    })
    await orderRepo.markAsPaid(params.trade_no, parseFloat(params.money), params.trade_no)

    // 调用上游API购买商品
    try {
      console.log('[E-pay Callback] 开始调用上游API购买商品')
      
      const productInfo = order.product_info as any
      if (!productInfo?.service_id) {
        console.error('[E-pay Callback] 订单缺少产品信息')
        return c.text('success')
      }

      // productInfo.service_id 就是 upstream_product_id (app_id)
      const upstreamClient = createUpstreamClient(env)
      const upstreamOrder = await upstreamClient.createOrder({
        app_id: productInfo.service_id,  // 使用 productInfo 中的 service_id
        type: 1,                          // 默认类型
        num: productInfo.quantity || 1,   // 数量
        expiry: productInfo.expiry || 0,  // 有效期类型
        prefix: '',
      })

    // 从返回的订单列表中获取第一个订单的信息
    const firstOrder = upstreamOrder.list[0]
    
    console.log('[E-pay Callback] 上游API调用成功:', {
      tel: firstOrder?.tel,
      ordernum: upstreamOrder.ordernum,
    })

    // 更新订单信息 - 使用 payment_orders 表和 trade_id
    // 存储上游 API 完整响应到 upstream_result JSONB 字段
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
        console.error('[E-pay Callback] 更新订单信息失败:', updateError)
      } else {
        console.log('[E-pay Callback] 订单信息更新成功')
      }
    } catch (upstreamError) {
      console.error('[E-pay Callback] 上游API调用失败:', upstreamError)
    }

    return c.text('success')
  } catch (error) {
    console.error('[E-pay Callback] 处理失败:', error)
    return c.text('success')
  }
})

export default app
