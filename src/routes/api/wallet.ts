/**
 * 钱包 API 路由
 * 
 * Why: 提供钱包相关的 API 端点，供前端调用
 * 包含：获取钱包信息、交易记录、充值等
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createWalletService } from '../../domains/wallet/wallet.service'
import { GetTransactionsParamsSchema, yuanToMilli } from '../../domains/wallet/wallet.schema'
import { createUpstreamClient } from '../../adapters/upstream'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { requireAuth } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/wallet
 * 获取钱包信息
 */
app.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const supabase = createSupabaseServiceClient(c.env)
    const walletService = createWalletService(supabase)
    
    const walletInfo = await walletService.getWalletInfo(user.id)

    return c.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: walletInfo
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '获取钱包信息失败'
    }, 500)
  }
})

/**
 * GET /api/wallet/transactions
 * 获取交易记录列表
 */
app.get('/transactions', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const page = parseInt(c.req.query('page') || '1')
    const pageSize = parseInt(c.req.query('pageSize') || '20')
    const type = c.req.query('type') || undefined
    const startDate = c.req.query('startDate') || undefined
    const endDate = c.req.query('endDate') || undefined

    const params = GetTransactionsParamsSchema.parse({
      page,
      pageSize,
      type,
      startDate,
      endDate,
    })

    const supabase = createSupabaseServiceClient(c.env)
    const walletService = createWalletService(supabase)
    
    const result = await walletService.getTransactions(user.id, params)

    return c.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: result
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '获取交易记录失败'
    }, 500)
  }
})

/**
 * GET /api/wallet/recent
 * 获取最近交易记录
 */
app.get('/recent', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const limit = parseInt(c.req.query('limit') || '5')

    const supabase = createSupabaseServiceClient(c.env)
    const walletService = createWalletService(supabase)
    
    const transactions = await walletService.getRecentTransactions(user.id, limit)

    return c.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: transactions
    })
  } catch (error) {
    console.error('Get recent transactions error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '获取最近交易记录失败'
    }, 500)
  }
})

/**
 * POST /api/wallet/recharge
 * 发起充值
 */
app.post('/recharge', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const body = await c.req.json()
    const { amount, paymentMethod } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return c.json<ApiResponse>({
        success: false,
        message: '请输入有效的充值金额'
      }, 400)
    }

    if (amount < 10) {
      return c.json<ApiResponse>({
        success: false,
        message: '最小充值金额为 10 元'
      }, 400)
    }

    if (amount > 10000) {
      return c.json<ApiResponse>({
        success: false,
        message: '最大充值金额为 10000 元'
      }, 400)
    }

    const validMethods = ['usdt', 'alipay']
    if (!validMethods.includes(paymentMethod)) {
      return c.json<ApiResponse>({
        success: false,
        message: '不支持的支付方式'
      }, 400)
    }

    const supabase = createSupabaseServiceClient(c.env)
    
    const tradeId = 'R' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        trade_id: tradeId,
        order_id: tradeId,
        payment_method: paymentMethod === 'usdt' ? 'bepusdt' : 'epay',
        amount: amount,
        status: 1,
        product_info: {
          type: 'recharge',
          title: '账户充值',
        },
        expiration_time: 900,
        user_id: user.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Create recharge order error:', orderError)
      return c.json<ApiResponse>({
        success: false,
        message: '创建充值订单失败'
      }, 500)
    }

    return c.json<ApiResponse>({
      success: true,
      message: '充值订单创建成功',
      data: {
        tradeId: order.trade_id,
        amount: amount,
        paymentMethod: paymentMethod,
        checkoutUrl: '/checkout?trade_id=' + order.trade_id + '&type=recharge',
      }
    })
  } catch (error) {
    console.error('Create recharge error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '创建充值订单失败'
    }, 500)
  }
})

/**
 * POST /api/wallet/recharge/callback
 * 充值成功回调
 */
app.post('/recharge/callback', async (c) => {
  try {
    const body = await c.req.json()
    const { tradeId, userId, amount, metadata } = body

    if (!tradeId || !userId || !amount) {
      return c.json<ApiResponse>({
        success: false,
        message: '参数不完整'
      }, 400)
    }

    const supabase = createSupabaseServiceClient(c.env)
    const walletService = createWalletService(supabase)
    
    const result = await walletService.handleRechargeSuccess(
      userId,
      amount,
      tradeId,
      metadata || {}
    )

    if (!result.success) {
      return c.json<ApiResponse>({
        success: false,
        message: result.error || '充值失败'
      }, 500)
    }

    await supabase
      .from('payment_orders')
      .update({
        status: 2,
        paid_at: new Date().toISOString(),
      })
      .eq('trade_id', tradeId)

    return c.json<ApiResponse>({
      success: true,
      message: '充值成功'
    })
  } catch (error) {
    console.error('Recharge callback error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '充值回调处理失败'
    }, 500)
  }
})

/**
 * POST /api/wallet/consume
 * 使用余额购买商品
 */
app.post('/consume', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json<ApiResponse>({ success: false, message: '未登录' }, 401)
    }
    const userId = user.id

    const body = await c.req.json<{ amount: number; product_info: any }>()
    const { amount, product_info } = body

    if (!amount || amount <= 0) {
      return c.json<ApiResponse>({ success: false, message: '无效的金额' }, 400)
    }

    const supabase = createSupabaseServiceClient(c.env)
    const walletService = createWalletService(supabase)

    // 转换为毫单位
    const amountMilli = yuanToMilli(amount)

    // 扣除余额
    const result = await walletService.handleConsume(
      userId,
      amountMilli,
      `order_${Date.now()}`,
      `购买: ${product_info?.title || '商品'}`,
      {
        product_info,
        quantity: product_info?.quantity || 1,
      }
    )

    if (!result.success) {
      return c.json<ApiResponse>({ success: false, message: result.error || '余额不足' }, 400)
    }

    // 调用上游 API 购买商品
    try {
      const upstreamClient = createUpstreamClient({
        UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
      })

      const upstreamOrder = await upstreamClient.createOrder({
        app_id: product_info.service_id,
        type: 1,
        num: product_info.quantity || 1,
        expiry: product_info.expiry || 0,
      })

      const firstOrder = upstreamOrder.list[0]

      // 获取最新余额
      const walletInfo = await walletService.getWalletInfo(userId)

      return c.json<ApiResponse>({
        success: true,
        message: '购买成功',
        data: {
          ordernum: upstreamOrder.ordernum,
          tel: firstOrder?.tel || '',
          token: firstOrder?.token || '',
          balance_after: walletInfo.balance,
        },
      })
    } catch (upstreamError) {
      // 上游购买失败，退款
      console.error('[Wallet] Upstream order failed, refunding:', upstreamError)
      await walletService.handleRefund(
        userId,
        amountMilli,
        `refund_${Date.now()}`,
        '上游购买失败，自动退款'
      )
      
      return c.json<ApiResponse>({
        success: false,
        message: '购买失败，已自动退款',
      }, 500)
    }
  } catch (error) {
    console.error('[Wallet] Consume error:', error)
    return c.json<ApiResponse>({ success: false, message: '服务器错误' }, 500)
  }
})

export default app
