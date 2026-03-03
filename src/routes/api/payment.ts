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

    const epayClient = createEpayClient({
      apiUrl: env.EPAY_API_URL,
      pid: env.EPAY_PID,
      key: env.EPAY_KEY,
      signType: (env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
      publicKey: env.EPAY_PUBLIC_KEY,
      privateKey: env.EPAY_PRIVATE_KEY,
    })

    if (!(await epayClient.verifyCallback(params))) {
      console.error('[E-pay Callback] 签名验证失败')
      return c.text('success')
    }

    // 初始化仓库
    const supabase = createSupabaseServiceClient(env)
    const orderRepo = createOrderRepository(supabase)

    // 查找订单
    const order = await orderRepo.findByTradeId(params.out_trade_no)
    if (!order) {
      console.warn('[E-pay Callback] 订单不存在:', params.out_trade_no)
      return c.text('success')
    }

    // 检查幂等性
    if (order.status === PaymentOrderStatus.PAID) {
      console.log('[E-pay Callback] 订单已支付，忽略重复回调:', params.out_trade_no)
      return c.text('success')
    }

    // 更新订单状态
    console.log('[E-pay Callback] 标记订单为已支付:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      money: params.money,
    })
    await orderRepo.markAsPaid(params.out_trade_no, parseFloat(params.money), params.trade_no)

      // 调用上游API购买商品
      try {
        console.log('[E-pay Callback] 开始调用上游API购买商品')
        
        const productInfo = order.product_info as any
        if (!productInfo?.service_id) {
          console.error('[E-pay Callback] 订单缺少产品信息')
          return c.text('success')
        }

        // 查询产品信息
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productInfo.service_id)
          .single()

      if (productError || !product) {
        console.error('[E-pay Callback] 查询产品失败:', productError)
        return c.text('success')
      }

      // 调用上游API
      const upstreamClient = createUpstreamClient(env)
      const upstreamOrder = await upstreamClient.createOrder({
        app_id: product.app_id,
        type: product.type,
        num: 1,
        expiry: product.expiry,
        prefix: '',
      }) as any

      console.log('[E-pay Callback] 上游API调用成功:', {
        tel: upstreamOrder.tel,
        ordernum: upstreamOrder.ordernum,
      })

      // 更新订单信息
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          tel: upstreamOrder.tel,
          token: upstreamOrder.token,
          api_url: upstreamOrder.api,
        } as any)
        .eq('order_id', params.out_trade_no)

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
