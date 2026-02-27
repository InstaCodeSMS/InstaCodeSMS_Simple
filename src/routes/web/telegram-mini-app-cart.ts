/**
 * Telegram Mini App 购物车 HTML 端点
 * 返回购物车 HTML 片段
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import { getOrCreateCart, getCartTotal, getCartItemCount, removeFromCart, updateCartItemQuantity } from '@/middleware/cart'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /mini-app/api/cart/view
 * 获取购物车视图 HTML
 */
app.get('/view', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.html(`
        <div class="p-4 text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">🛒</div>
          <p class="text-lg mb-4">购物车是空的</p>
          <a href="/mini-app/products" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            继续购物
          </a>
        </div>
      `)
    }

    const total = getCartTotal(cart)
    const itemCount = getCartItemCount(cart)

    const itemsHtml = cart.items
      .map(
        (item, index) => `
      <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <div class="flex-1">
          <div class="font-semibold text-gray-800">${item.name}</div>
          <div class="text-sm text-gray-500">¥${item.price} × ${item.quantity}</div>
          <div class="text-lg font-bold text-blue-600 mt-1">¥${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity - 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            −
          </button>
          <span class="w-8 text-center">${item.quantity}</span>
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity + 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            +
          </button>
          <button hx-post="/mini-app/api/cart/remove"
                  hx-vals='{"app_id": ${item.app_id}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm">
            删除
          </button>
        </div>
      </div>
    `
      )
      .join('')

    return c.html(`
      <div class="p-4 space-y-4">
        <div class="space-y-3">
          ${itemsHtml}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 sticky bottom-20">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-600">商品总数:</span>
            <span class="font-bold">${itemCount}</span>
          </div>
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-semibold">总计:</span>
            <span class="font-bold text-blue-600">¥${total.toFixed(2)}</span>
          </div>
          <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition">
            去结算
          </button>
        </div>
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载购物车失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

/**
 * POST /mini-app/api/cart/remove
 * 从购物车移除商品
 */
app.post('/remove', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const body = await c.req.json()
    const { app_id, type, expiry } = body

    removeFromCart(user, app_id, type, expiry)
    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.html(`
        <div class="p-4 text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">🛒</div>
          <p class="text-lg mb-4">购物车是空的</p>
          <a href="/mini-app/products" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            继续购物
          </a>
        </div>
      `)
    }

    const total = getCartTotal(cart)
    const itemCount = getCartItemCount(cart)

    const itemsHtml = cart.items
      .map(
        (item) => `
      <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <div class="flex-1">
          <div class="font-semibold text-gray-800">${item.name}</div>
          <div class="text-sm text-gray-500">¥${item.price} × ${item.quantity}</div>
          <div class="text-lg font-bold text-blue-600 mt-1">¥${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity - 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            −
          </button>
          <span class="w-8 text-center">${item.quantity}</span>
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity + 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            +
          </button>
          <button hx-post="/mini-app/api/cart/remove"
                  hx-vals='{"app_id": ${item.app_id}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm">
            删除
          </button>
        </div>
      </div>
    `
      )
      .join('')

    return c.html(`
      <div class="p-4 space-y-4">
        <div class="space-y-3">
          ${itemsHtml}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 sticky bottom-20">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-600">商品总数:</span>
            <span class="font-bold">${itemCount}</span>
          </div>
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-semibold">总计:</span>
            <span class="font-bold text-blue-600">¥${total.toFixed(2)}</span>
          </div>
          <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition">
            去结算
          </button>
        </div>
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

/**
 * POST /mini-app/api/cart/update
 * 更新购物车商品数量
 */
app.post('/update', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const body = await c.req.json()
    const { app_id, quantity, type, expiry } = body

    updateCartItemQuantity(user, app_id, quantity, type, expiry)
    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.html(`
        <div class="p-4 text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">🛒</div>
          <p class="text-lg mb-4">购物车是空的</p>
          <a href="/mini-app/products" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
            继续购物
          </a>
        </div>
      `)
    }

    const total = getCartTotal(cart)
    const itemCount = getCartItemCount(cart)

    const itemsHtml = cart.items
      .map(
        (item) => `
      <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <div class="flex-1">
          <div class="font-semibold text-gray-800">${item.name}</div>
          <div class="text-sm text-gray-500">¥${item.price} × ${item.quantity}</div>
          <div class="text-lg font-bold text-blue-600 mt-1">¥${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity - 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            −
          </button>
          <span class="w-8 text-center">${item.quantity}</span>
          <button hx-post="/mini-app/api/cart/update"
                  hx-vals='{"app_id": ${item.app_id}, "quantity": ${item.quantity + 1}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded">
            +
          </button>
          <button hx-post="/mini-app/api/cart/remove"
                  hx-vals='{"app_id": ${item.app_id}, "type": ${item.type || 1}, "expiry": ${item.expiry || 0}}'
                  hx-target="#cart-container"
                  hx-swap="innerHTML"
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm">
            删除
          </button>
        </div>
      </div>
    `
      )
      .join('')

    return c.html(`
      <div class="p-4 space-y-4">
        <div class="space-y-3">
          ${itemsHtml}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 sticky bottom-20">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-600">商品总数:</span>
            <span class="font-bold">${itemCount}</span>
          </div>
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-semibold">总计:</span>
            <span class="font-bold text-blue-600">¥${total.toFixed(2)}</span>
          </div>
          <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition">
            去结算
          </button>
        </div>
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

export default app
