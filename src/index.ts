import { Hono } from 'hono'
import { cors } from 'hono/cors'

// 导入 CSRF 中间件
import { csrfProtection } from './middleware/csrf'

// 导入页面视图
import ReceivePage from './views/pages/ReceivePage'
import PurchasePage from './views/pages/PurchasePage'
import CheckoutPage from './views/pages/CheckoutPage'
import SuccessPage from './views/pages/SuccessPage'

// 导入 API 路由
import servicesApi from './routes/api/services'
import ordersApi from './routes/api/orders'
import smsApi from './routes/api/sms'
import syncApi from './routes/api/sync'
import paymentApi from './routes/api/payment'
import telegramApi from './routes/api/telegram'
import telegramMiniAppApi from './routes/api/telegram-mini-app'
import miniAppAuthApi from './routes/api/mini-app-auth'

// 导入 Web 路由
import telegramMiniAppWeb from './routes/web/telegram-mini-app'

// 导入中间件
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { miniAppAuthMiddleware } from './middleware/mini-app-auth'

// 导入上游客户端
import { createUpstreamClient } from './adapters/upstream'

// 导入类型
import type { Env } from './types/env'

// 创建应用
const app = new Hono<{ Bindings: Env }>()

// ========== 中间件 ==========
app.use('*', requestLogger)  // 请求日志 + request-id
app.use('*', cors())

// CSRF 保护
app.use('*', csrfProtection)

// ========== 页面路由 ==========

// 首页
app.get('/', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SimpleFaka - 虚拟手机号码接码平台</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://unpkg.com/htmx.org@2.0.8"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="min-h-screen bg-base-200 flex flex-col items-center justify-center" hx-headers='{"X-CSRF-Token": "${csrfToken}"}'>
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-4">
      <span class="text-primary">SIMPLE</span><span class="text-secondary">FAKA</span>
    </h1>
    <p class="text-lg opacity-70 mb-8">虚拟手机号码接码平台</p>
    <div class="flex gap-4 justify-center">
      <a href="/purchase" class="btn btn-primary">购买服务</a>
      <a href="/receive" class="btn btn-secondary">接码终端</a>
    </div>
  </div>
</body>
</html>`
  return c.html(html)
})

// 购买服务页面
app.get('/purchase', (c) => {
  const csrfToken = c.var.csrfToken || ''
  // 直接调用 PurchasePage 并传入 csrfToken
  const html = PurchasePage(csrfToken)
  return c.html(html)
})

// 接码终端页面
app.get('/receive', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = ReceivePage(csrfToken)
  return c.html(html)
})

// 结算页面
app.get('/checkout', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = CheckoutPage(csrfToken)
  return c.html(html)
})

// 支付成功页面
app.get('/success', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = SuccessPage(csrfToken)
  return c.html(html)
})

// ========== API 路由 ==========

// 服务 API
app.route('/api/services', servicesApi)

// 订单 API
app.route('/api/orders', ordersApi)

// 验证码 API
app.route('/api/sms', smsApi)

// 同步 API
app.route('/api/sync', syncApi)

// 支付 API
app.route('/api/payment', paymentApi)

// Telegram Bot API
app.route('/api/telegram', telegramApi)

// Telegram Mini App API
app.route('/api/telegram-mini-app', telegramMiniAppApi)

// Telegram Mini App 认证 API
app.route('/mini-app/api/auth', miniAppAuthApi)

// Telegram Mini App Web (前端路由) - 使用认证中间件
app.use('/mini-app/*', miniAppAuthMiddleware)
app.route('/mini-app', telegramMiniAppWeb)

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ========== 测试连接端点 ==========

/**
 * GET /api/test/connection
 * 测试与上游 API 的连接
 */
app.get('/api/test/connection', async (c) => {
  try {
    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 测试获取用户信息
    const profile = await client.getProfile()

    return c.json({
      success: true,
      message: '上游 API 连接成功',
      data: {
        url: c.env.UPSTREAM_API_URL,
        username: profile.username,
        balance: profile.money,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '连接失败'
    return c.json({
      success: false,
      message,
      data: {
        url: c.env.UPSTREAM_API_URL,
        hasToken: !!c.env.UPSTREAM_API_TOKEN,
      },
    }, 400)
  }
})

/**
 * GET /api/test/categories
 * 测试获取分类
 */
app.get('/api/test/categories', async (c) => {
  try {
    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getCategories()

    return c.json({
      success: true,
      message: '获取分类成功',
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败'
    return c.json({ success: false, message }, 400)
  }
})

// ========== 错误处理 ==========

// 404 处理
app.notFound(notFoundHandler)

// 全局错误处理
app.onError(errorHandler)

// 导出为 Cloudflare Workers 格式
export default app