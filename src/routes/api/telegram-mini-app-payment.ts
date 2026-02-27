/**
 * Telegram Mini App 支付回调处理
 * 处理支付成功后的订单更新
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import type { ApiResponse } from '@/types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /mini-app/api/payment/callback
 * 支付成功回调处理
 */
app.post('/callback', async (c) => {
  try {
    const body = await c.req.json()
    const { trade_id, order_id, status } = body

    if (!trade_id || !order_id) {
      return c.json<ApiResponse>(
        { success: false, message: '缺少必要参数' },
        400
      )
    }

    // 验证支付状态
    if (status !== 'paid' && status !== 2) {
      return c.json<ApiResponse>(
        { success: false, message: '支付未完成' },
        400
      )
    }

    // 这里可以添加订单状态更新逻辑
    // 例如：更新数据库中的订单状态、发送通知等

    return c.json<ApiResponse>({
      success: true,
      message: '支付回调处理成功',
      data: {
        trade_id,
        order_id,
        status: 'completed',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '处理支付回调失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * GET /mini-app/api/payment/status
 * 查询支付状态
 */
app.get('/status', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const trade_id = c.req.query('trade_id')

    if (!trade_id) {
      return c.json<ApiResponse>(
        { success: false, message: '缺少参数：trade_id' },
        400
      )
    }

    // 这里应该调用支付 API 查询状态
    // 暂时返回模拟数据

    return c.json<ApiResponse>({
      success: true,
      message: '查询成功',
      data: {
        trade_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询支付状态失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

export default app
