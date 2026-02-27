/**
 * Telegram Mini App 订单 API
 * 处理订单创建、查询等
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { createUpstreamClient } from '@/adapters/upstream'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import { getOrCreateCart, clearCart } from '@/middleware/cart'
import type { ApiResponse } from '@/types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/telegram-mini-app/orders/create
 * 从购物车创建订单
 */
app.post('/create', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.json<ApiResponse>(
        { success: false, message: '购物车为空' },
        400
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 创建订单（暂时只支持单个商品，实际应该支持批量）
    const firstItem = cart.items[0]
    const data = await client.createOrder({
      app_id: firstItem.app_id,
      type: firstItem.type ?? 1,
      num: firstItem.quantity,
      expiry: firstItem.expiry ?? 0,
    })

    // 清空购物车
    clearCart(user)

    return c.json<ApiResponse>({
      success: true,
      message: '订单创建成功',
      data: {
        ordernum: data.ordernum,
        api_count: data.api_count,
        items: data.list.map((item) => ({
          tel: item.tel,
          end_time: item.end_time,
          token: item.token,
        })),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建订单失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/orders/list
 * 获取订单列表
 */
app.get('/list', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getOrderList({
      page,
      limit,
    })

    return c.json<ApiResponse>({
      success: true,
      message: '获取订单列表成功',
      data: {
        list: data.list.map((item) => ({
          id: item.id,
          ordernum: item.ordernum,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          num: item.num,
          remark: item.remark,
          status: item.status,
          create_time: item.create_time,
          app_name: item.smsApp?.name || '',
        })),
        total: data.total,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取订单列表失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/orders/:ordernum
 * 获取订单详情
 */
app.get('/:ordernum', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const ordernum = c.req.param('ordernum')

    if (!ordernum) {
      return c.json<ApiResponse>(
        { success: false, message: '订单号不能为空' },
        400
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getOrderDetail({ ordernum })

    return c.json<ApiResponse>({
      success: true,
      message: '获取订单详情成功',
      data: {
        url_list: data.url_list,
        list: data.list.map((item) => ({
          id: item.id,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          tel: item.tel,
          token: item.token,
          end_time: item.end_time,
          sms_count: item.sms_count,
          voice_count: item.voice_count,
          remark: item.remark,
          status: item.status,
          api: item.api,
        })),
        total: data.total,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取订单详情失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

export default app
