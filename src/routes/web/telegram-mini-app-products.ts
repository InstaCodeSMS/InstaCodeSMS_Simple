/**
 * Telegram Mini App 商品列表 HTML 端点
 * 返回 HTML 片段供 HTMX 使用
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { createUpstreamClient } from '@/adapters/upstream'
import { getCurrentUser } from '@/middleware/mini-app-auth'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /mini-app/api/products/list
 * 获取商品列表 HTML
 */
app.get('/list', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getAppList()

    if (!data.list || data.list.length === 0) {
      return c.html(`
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">📭</div>
          <p>暂无商品</p>
        </div>
      `)
    }

    const html = `
      <div class="grid grid-cols-2 gap-3">
        ${data.list
          .map(
            (product) => `
          <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition cursor-pointer"
               hx-get="/mini-app/api/products/detail?id=${product.id}"
               hx-target="body"
               hx-swap="beforeend"
               onclick="showProductDetail(${product.id})">
            <div class="text-sm font-semibold text-gray-800 truncate">${product.name}</div>
            <div class="text-xs text-gray-500 mt-1">库存: ${product.num}</div>
            <div class="text-lg font-bold text-blue-600 mt-2">¥${product.price}</div>
            <button class="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-2 rounded transition"
                    hx-post="/api/telegram-mini-app/cart/add"
                    hx-vals='{"app_id": ${product.id}, "name": "${product.name}", "price": "${product.price}", "quantity": 1}'
                    hx-swap="none"
                    onclick="event.stopPropagation(); addToCart(event)">
              加入购物车
            </button>
          </div>
        `
          )
          .join('')}
      </div>
    `

    return c.html(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载商品失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

/**
 * GET /mini-app/api/products/search
 * 搜索商品 HTML
 */
app.get('/search', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const name = c.req.query('q') || ''

    if (!name || name.length < 1) {
      return c.html(`
        <div class="text-center py-8 text-gray-500">
          <p>请输入搜索关键词</p>
        </div>
      `)
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getAppList({ name })

    if (!data.list || data.list.length === 0) {
      return c.html(`
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🔍</div>
          <p>未找到匹配的商品</p>
        </div>
      `)
    }

    const html = `
      <div class="grid grid-cols-2 gap-3">
        ${data.list
          .map(
            (product) => `
          <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition cursor-pointer"
               hx-get="/mini-app/api/products/detail?id=${product.id}"
               hx-target="body"
               hx-swap="beforeend"
               onclick="showProductDetail(${product.id})">
            <div class="text-sm font-semibold text-gray-800 truncate">${product.name}</div>
            <div class="text-xs text-gray-500 mt-1">库存: ${product.num}</div>
            <div class="text-lg font-bold text-blue-600 mt-2">¥${product.price}</div>
            <button class="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-2 rounded transition"
                    hx-post="/api/telegram-mini-app/cart/add"
                    hx-vals='{"app_id": ${product.id}, "name": "${product.name}", "price": "${product.price}", "quantity": 1}'
                    hx-swap="none"
                    onclick="event.stopPropagation(); addToCart(event)">
              加入购物车
            </button>
          </div>
        `
          )
          .join('')}
      </div>
    `

    return c.html(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : '搜索失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

export default app
