/**
 * 支付回调处理
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { PaymentGatewayService } from '../../domains/payment/payment-gateway.service'
import { OrderService } from '../../domains/order/order.service'
import { TelegramUserService } from '../../domains/telegram/user.service'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createWalletService } from '../../domains/wallet/wallet.service'
import { yuanToMilli } from '../../domains/wallet/wallet.schema'

const app = new Hono<{ Bindings: Env }>()

/**
 * EPay 支付回调
 */
app.post('/epay/callback', async (c) => {
  try {
    const params = await c.req.parseBody()
    console.log('[Payment] Callback received:', params)

    // 验证签名
    const paymentService = new PaymentGatewayService(c.env)
    const isValid = await paymentService.verifyCallback(params as Record<string, any>)

    if (!isValid) {
      console.error('[Payment] Invalid signature')
      return c.text('FAIL')
    }

    // 获取订单号
    const ordernum = params.out_trade_no as string
    if (!ordernum) {
      console.error('[Payment] Missing ordernum')
      return c.text('FAIL')
    }

    // 获取实际支付金额
    const actualAmount = parseFloat(params.money as string) || 0

    // 获取订单信息
    const supabase = createSupabaseServiceClient(c.env)
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('trade_id', ordernum)
      .single()

    if (orderError || !order) {
      console.error('[Payment] Order not found:', ordernum)
      return c.text('FAIL')
    }

    // 检查订单类型
    const productInfo = order.product_info as any
    const isRecharge = productInfo?.type === 'recharge'

    // 更新订单状态
    await supabase
      .from('payment_orders')
      .update({
        status: 2, // 已支付
        actual_amount: actualAmount,
        paid_at: new Date().toISOString(),
      })
      .eq('trade_id', ordernum)

    // 如果是充值订单，更新钱包余额
    if (isRecharge && order.user_id) {
      try {
        const walletService = createWalletService(supabase)
        const amountMilli = yuanToMilli(actualAmount)
        
        const result = await walletService.handleRechargeSuccess(
          order.user_id,
          amountMilli,
          ordernum,
          {
            payment_method: order.payment_method,
            product_type: 'recharge',
          }
        )

        if (!result.success) {
          console.error('[Payment] Wallet recharge failed:', result.error)
          // 充值失败但订单已更新，记录错误供后续处理
        } else {
          console.log('[Payment] Wallet recharged successfully:', {
            userId: order.user_id,
            amount: amountMilli,
            tradeId: ordernum,
          })
        }
      } catch (error) {
        console.error('[Payment] Wallet service error:', error)
      }
    }

    // 发送 Telegram 通知
    try {
      if (order.user_id) {
        // TODO: 发送 Telegram 通知
        console.log('[Payment] Order paid, user:', order.user_id)
      }
    } catch (error) {
      console.error('[Payment] Notification error:', error)
    }

    return c.text('SUCCESS')
  } catch (error) {
    console.error('[Payment] Callback error:', error)
    return c.text('FAIL')
  }
})

/**
 * 支付返回页面
 */
app.get('/return', async (c) => {
  const ordernum = c.req.query('ordernum')
  
  if (!ordernum) {
    return c.redirect('/purchase')
  }

  // 重定向到订单详情页
  return c.redirect(`/purchase?order=${ordernum}`)
})

export default app