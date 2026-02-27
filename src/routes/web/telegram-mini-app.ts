/**
 * Telegram Mini App 前端路由 - 使用 HTML 字符串
 * 简化版本，快速上线
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import { AuthPage } from '@/views/telegram-mini-app/auth'

const app = new Hono<{ Bindings: Env }>()

/**
 * 基础 HTML 模板
 */
function baseLayout(title: string, content: string, user?: any) {
  const userSection = user ? `
    <div class="flex items-center gap-3">
      <div class="text-right">
        <div class="text-sm font-semibold text-gray-800">${user.firstName}</div>
        <div class="text-xs text-gray-500">${user.username ? '@' + user.username : ''}</div>
      </div>
      <button hx-post="/mini-app/api/auth/logout" hx-confirm="确定要登出吗?" class="text-red-500 hover:text-red-700 text-sm font-semibold">
        登出
      </button>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .mini-app-container { max-width: 100%; height: 100vh; display: flex; flex-direction: column; }
    .mini-app-content { flex: 1; overflow-y: auto; padding-bottom: 60px; }
    .mini-app-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 60px; border-top: 1px solid #e5e7eb; background: white; z-index: 50; }
  </style>
</head>
<body>
  <div class="mini-app-container">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-bold">SimpleFaka</h1>
        ${userSection}
      </div>
    </header>

    <main class="mini-app-content">
      ${content}
    </main>

    <nav class="mini-app-nav">
      <div class="flex h-full items-center justify-around">
        <a href="/mini-app" class="flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4"></path></svg>
          <span class="text-xs mt-1">首页</span>
        </a>
        <a href="/mini-app/products" class="flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span class="text-xs mt-1">商品</span>
        </a>
        <a href="/mini-app/cart" class="flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span class="text-xs mt-1">购物车</span>
        </a>
        <a href="/mini-app/orders" class="flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="text-xs mt-1">订单</span>
        </a>
      </div>
    </nav>
  </div>
  <script>
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#ffffff');
      tg.setBackgroundColor('#ffffff');
    }

    // 添加到购物车
    function addToCart(event) {
      event.preventDefault();
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '添加中...';
      button.disabled = true;

      setTimeout(() => {
        button.textContent = '✓ 已添加';
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1500);
      }, 500);
    }

    // 显示商品详情
    function showProductDetail(productId) {
      console.log('Show product detail:', productId);
    }
  </script>
</body>
</html>`
}

/**
 * GET /mini-app/auth
 * 认证页面
 */
app.get('/auth', (c) => {
  return c.html(AuthPage())
})

/**
 * GET /mini-app
 * 首页 - 检查认证状态
 */
app.get('/', (c) => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.redirect('/mini-app/auth')
  }

  const content = `
    <div class="p-4 space-y-4">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 class="text-2xl font-bold mb-2">欢迎回来，${user.firstName}！</h2>
        <p class="text-blue-100">快速便捷的虚拟号码接码平台</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <a href="/mini-app/products" class="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition">
          <div class="text-3xl mb-2">🛍️</div>
          <div class="font-semibold text-gray-800">浏览商品</div>
          <div class="text-xs text-gray-500 mt-1">查看所有可用商品</div>
        </a>
        <a href="/mini-app/orders" class="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition">
          <div class="text-3xl mb-2">📋</div>
          <div class="font-semibold text-gray-800">我的订单</div>
          <div class="text-xs text-gray-500 mt-1">查看订单历史</div>
        </a>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-800 mb-3">✨ 特色功能</h3>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start gap-2"><span class="text-blue-500 mt-1">✓</span><span>即时交付 - 支付后立即获得卡密</span></li>
          <li class="flex items-start gap-2"><span class="text-blue-500 mt-1">✓</span><span>安全可靠 - 所有交易都经过验证</span></li>
          <li class="flex items-start gap-2"><span class="text-blue-500 mt-1">✓</span><span>多种支付 - 支持多种支付方式</span></li>
          <li class="flex items-start gap-2"><span class="text-blue-500 mt-1">✓</span><span>24/7 支持 - 随时获得帮助</span></li>
        </ul>
      </div>
    </div>
  `
  return c.html(baseLayout('SimpleFaka - 首页', content, user))
})

/**
 * GET /mini-app/products
 * 商品列表页面
 */
app.get('/products', (c) => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.redirect('/mini-app/auth')
  }

  const content = `
    <div class="p-4 space-y-4">
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <input
          type="text"
          placeholder="搜索商品..."
          hx-get="/mini-app/api/products/search"
          hx-trigger="keyup changed delay:500ms"
          hx-target="#products-list"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
      </div>
      <div id="products-list" hx-get="/mini-app/api/products/list" hx-trigger="load" hx-swap="innerHTML">
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">⏳</div>
          <p>加载商品中...</p>
        </div>
      </div>
    </div>
  `
  return c.html(baseLayout('SimpleFaka - 商品', content, user))
})

/**
 * GET /mini-app/cart
 * 购物车页面
 */
app.get('/cart', (c) => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.redirect('/mini-app/auth')
  }

  const content = `
    <div id="cart-container" hx-get="/mini-app/api/cart/view" hx-trigger="load" hx-swap="innerHTML">
      <div class="text-center py-12 text-gray-500">
        <div class="text-5xl mb-4">⏳</div>
        <p>加载购物车中...</p>
      </div>
    </div>
  `
  return c.html(baseLayout('SimpleFaka - 购物车', content, user))
})

/**
 * GET /mini-app/orders
 * 订单列表页面
 */
app.get('/orders', (c) => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.redirect('/mini-app/auth')
  }

  const content = `
    <div id="orders-container" hx-get="/mini-app/api/orders/view" hx-trigger="load" hx-swap="innerHTML">
      <div class="text-center py-12 text-gray-500">
        <div class="text-5xl mb-4">⏳</div>
        <p>加载订单中...</p>
      </div>
    </div>
  `
  return c.html(baseLayout('SimpleFaka - 订单', content, user))
})

export default app
