/**
 * Telegram Mini App 结算页面
 * 显示购物车商品和支付方式选择
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import { getOrCreateCart, getCartTotal, getCartItemCount } from '@/middleware/cart'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /mini-app/api/checkout/view
 * 获取结算页面 HTML
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
        (item) => `
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-semibold text-gray-800">${item.name}</div>
            <div class="text-sm text-gray-500 mt-1">数量: ${item.quantity}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">¥${item.price}</div>
            <div class="text-lg font-bold text-blue-600">¥${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
          </div>
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

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-600">商品总数:</span>
            <span class="font-bold">${itemCount}</span>
          </div>
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-semibold">总计:</span>
            <span class="font-bold text-blue-600">¥${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">选择支付方式</h3>
          <div class="space-y-2">
            <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50">
              <input type="radio" name="payment_method" value="alipay" checked class="mr-3">
              <span class="font-semibold text-gray-800">支付宝</span>
            </label>
            <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50">
              <input type="radio" name="payment_method" value="usdt" class="mr-3">
              <span class="font-semibold text-gray-800">USDT (TRC20)</span>
            </label>
          </div>
        </div>

        <button hx-post="/mini-app/api/checkout/confirm"
                hx-target="#checkout-container"
                hx-swap="innerHTML"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition">
          确认订单
        </button>
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载结算页面失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

/**
 * POST /mini-app/api/checkout/confirm
 * 确认订单并创建支付
 */
app.post('/confirm', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const body = await c.req.json()
    const { payment_method } = body

    if (!payment_method) {
      return c.html('<div class="text-center text-red-500 p-4">请选择支付方式</div>')
    }

    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.html(`
        <div class="p-4 text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">🛒</div>
          <p class="text-lg mb-4">购物车是空的</p>
        </div>
      `)
    }

    const total = getCartTotal(cart)

    // 返回支付页面
    return c.html(`
      <div class="p-4 space-y-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div class="text-4xl mb-2">💳</div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">订单确认</h2>
          <div class="text-3xl font-bold text-blue-600 mb-4">¥${total.toFixed(2)}</div>
          <p class="text-gray-600 mb-4">支付方式: ${payment_method === 'alipay' ? '支付宝' : 'USDT'}</p>
          <button hx-post="/mini-app/api/checkout/pay"
                  hx-vals='{"payment_method": "${payment_method}"}'
                  hx-target="#checkout-container"
                  hx-swap="innerHTML"
                  class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition">
            立即支付
          </button>
        </div>
      </div>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '确认订单失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

/**
 * POST /mini-app/api/checkout/pay
 * 创建支付订单
 */
app.post('/pay', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.html('<div class="text-center text-red-500">未认证</div>')
    }

    const body = await c.req.json()
    const { payment_method } = body

    const cart = getOrCreateCart(user)

    if (!cart.items || cart.items.length === 0) {
      return c.html('<div class="text-center text-red-500 p-4">购物车为空</div>')
    }

    const total = getCartTotal(cart)

    // 返回支付处理中的页面
    return c.html(`
      <div class="p-4 space-y-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div class="text-4xl mb-2 animate-spin">⏳</div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">处理支付中...</h2>
          <p class="text-gray-600">请稍候，正在创建支付订单</p>
        </div>
      </div>
      <script>
        // 模拟支付流程（实际应该调用后端 API）
        setTimeout(() => {
          document.getElementById('checkout-container').innerHTML = \`
            <div class="p-4 space-y-4">
              <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div class="text-5xl mb-2">✅</div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">支付成功</h2>
                <p class="text-gray-600 mb-4">订单已创建，卡密已发送</p>
                <a href="/mini-app/orders" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                  查看订单
                </a>
              </div>
            </div>
          \`;
        }, 2000);
      </script>
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : '支付失败'
    return c.html(`<div class="text-center text-red-500 p-4">${message}</div>`)
  }
})

export default app
