/**
 * 订单 API 路由
 * 
 * Why: 提供订单查询和统计接口
 */

import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import { requireAuth } from '../../middleware/auth'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/orders
 * 获取用户订单列表
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

    // 查询 payment_orders 表获取订单
    // Security: 按 user_id 过滤，确保用户只能看到自己的订单
    const { data: orders, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Failed to fetch orders:', error)
      // 返回空数据而不是错误，让页面可以正常渲染
      return c.json({
        success: true,
        data: {
          orders: []
        }
      })
    }

    // 转换订单数据格式
    const formattedOrders = (orders || []).map((order: Record<string, unknown>) => ({
      id: order.trade_id,
      order_no: order.order_id || order.trade_id?.toString().slice(-8).toUpperCase(),
      trade_id: order.trade_id,
      service_name: (order.product_info as Record<string, unknown>)?.title || 'Virtual Number',
      region: 'US', // 默认区域
      phone_number: (order.upstream_result as Record<string, unknown>)?.tel || null,
      sms_token: (order.upstream_result as Record<string, unknown>)?.token || null,
      verification_code: null, // 需要从短信记录中获取
      amount: Number(order.amount) * 1000, // 转换为毫单位
      status: mapOrderStatus(Number(order.status)),
      duration: (order.product_info as Record<string, unknown>)?.expiry || 20,
      created_at: order.created_at,
      expires_at: calculateExpiry(order.created_at as string, (order.product_info as Record<string, unknown>)?.expiry as number),
      paid_at: order.paid_at
    }))

    return c.json({
      success: true,
      data: {
        orders: formattedOrders
      }
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return c.json({
      success: true,
      data: {
        orders: []
      }
    })
  }
})

/**
 * GET /api/orders/stats
 * 获取订单统计信息
 */
app.get('/stats', requireAuth, async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const supabase = createSupabaseServiceClient(c.env)

    // 查询订单统计 - Security: 按 user_id 过滤
    const { data: orders, error } = await supabase
      .from('payment_orders')
      .select('status, amount')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch order stats:', error)
      return c.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          completed: 0,
          totalSpent: 0
        }
      })
    }

    // 计算统计数据
    const stats = {
      total: orders?.length || 0,
      active: orders?.filter((o: Record<string, unknown>) => Number(o.status) === 2).length || 0, // PAID = 2
      completed: orders?.filter((o: Record<string, unknown>) => Number(o.status) === 2).length || 0,
      totalSpent: orders?.reduce((sum: number, o: Record<string, unknown>) => {
        if (Number(o.status) === 2) { // 只计算已支付的
          return sum + Number(o.amount) * 1000
        }
        return sum
      }, 0) || 0
    }

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Order stats API error:', error)
    return c.json({
      success: true,
      data: {
        total: 0,
        active: 0,
        completed: 0,
        totalSpent: 0
      }
    })
  }
})

/**
 * GET /api/orders/:id
 * 获取单个订单详情
 */
app.get('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const orderId = c.req.param('id')
  
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const supabase = createSupabaseServiceClient(c.env)

    // Security: 同时验证 trade_id 和 user_id，确保用户只能访问自己的订单
    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('trade_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) {
      return c.json({ success: false, error: 'Order not found' }, 404)
    }

    return c.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Order detail API error:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

/**
 * 映射订单状态
 * 
 * 现有状态：
 * 1 = Pending
 * 2 = Paid
 * 3 = Timeout
 * 4 = Cancelled
 * 
 * 新状态：
 * pending, active, completed, expired, cancelled
 */
function mapOrderStatus(status: number): string {
  switch (status) {
    case 1:
      return 'pending'
    case 2:
      return 'active' // 已支付，等待接码
    case 3:
      return 'expired'
    case 4:
      return 'cancelled'
    default:
      return 'pending'
  }
}

/**
 * 计算过期时间
 */
function calculateExpiry(createdAt: string, durationMinutes: number = 20): string {
  if (!createdAt) return ''
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + durationMinutes * 60 * 1000)
  return expires.toISOString()
}

export default app