/**
 * Telegram Mini App 订单列表 HTML 端点
 * 返回订单列表 HTML 片段
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { createUpstreamClient } from '@/adapters/upstream'
import { getCurrentUser } from '@/middleware/mini-app-auth'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /mini-app/api/orders/view
 * 获取订单列表视图 HTML
 */
app.get('/view', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getOrderList({
      page: 1,
      limit: 20,
    })

    if (!data.list || data.list.length === 0) {
      return c.html(`
        <div class="p-4 text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">📭</div>
          <p class="text-lg mb-4">暂无订单</p>
          <a href="/mini-app/products" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            去购物
          </a>
        </div>
      `)
    }

    const ordersHtml = data.list
      .map(
        (order) => `
      <div class="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
           hx-get="/mini-app/api/orders/detail?ordernum=${order.ordernum}"
           hx-target="body"
           hx-swap="beforeend"
           onclick="showOrderDetail('${order.ordernum}')">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="font-semibold text-gray-800">${order.smsApp?.name || '未知商品'}</div>
            <div class="text-xs text-gray-500 mt-1">订单号: ${order.ordernum}</div>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold ${
              order.status === 1
                ? 'text-green-600'
                : order.status === 2
                  ? 'text-yellow-600'
                  : 'text-gray-600'
            }">
              ${order.status === 1 ? '已完成' : order.status === 2 ? '进行中' : '已过期'}
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">数量: ${order.num}</span>
          <span class="text-gray-500">${new Date(order.create_time).toLocaleDateString()}</span>
        </div>
      </div>
    `
      )
      .join('')

    return c.html(`
      <div class="p-4 space-y-3">
        ${ordersHtml}
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载订单列表失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

export default app
