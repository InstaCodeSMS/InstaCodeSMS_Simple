import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { config } from 'dotenv'

// 导入 CSRF 中间件
import { csrfProtection } from './middleware/csrf'

// 加载 .dev.vars 文件（本地开发）
config({ path: '.dev.vars' })

// 导入页面路由
import ReceivePage from './routes/page/receive'
import PurchasePage from './routes/page/purchase'
import CheckoutPage from './routes/page/checkout'
import SuccessPage from './routes/page/success'

// 导入 API 路由
import servicesApi from './routes/api/services'
import ordersApi from './routes/api/orders'
import smsApi from './routes/api/sms'
import syncApi from './routes/api/sync'
import paymentApi from './routes/api/payment'

// 导入中间件
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// 导入上游客户端
import { createUpstreamClient } from './lib/upstream'

// 导入类型
import type { Env } from './types/env'

/**
 * 将 CSRF Token 注入到 HTML body 标签中
 * 让 HTMX 自动在所有请求中携带此 token
 */
function injectCsrfToken(html: string, csrfToken: string): string {
  // 在 body 标签中添加 hx-headers 属性
  return html.replace(
    /<body([^>]*)>/i,
    `<body$1 hx-headers='{"X-CSRF-Token": "${csrfToken}"}'>`
  )
}

// 本地开发环境变量（从 .dev.vars 加载）
const devEnv: Env = {
  UPSTREAM_API_URL: process.env.UPSTREAM_API_URL || 'https://api.cc',
  UPSTREAM_API_TOKEN: process.env.UPSTREAM_API_TOKEN || '',
  PRICE_MARKUP: process.env.PRICE_MARKUP || '1.5',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  BEPUSDT_API_URL: process.env.BEPUSDT_API_URL || '',
  BEPUSDT_API_TOKEN: process.env.BEPUSDT_API_TOKEN || '',
  ALIMPAY_API_URL: process.env.ALIMPAY_API_URL || '',
  ALIMPAY_PID: process.env.ALIMPAY_PID || '',
  ALIMPAY_KEY: process.env.ALIMPAY_KEY || '',
}

// 创建应用
const app = new Hono<{ Bindings: Env }>()

// ========== 中间件 ==========
app.use('*', requestLogger)  // 请求日志 + request-id
app.use('*', cors())

// ========== 开发环境中间件 ==========
// 为本地开发注入环境变量（必须在 CSRF 之前，因为 CSRF 需要 c.env）
app.use('*', async (c, next) => {
  // 如果 c.env 为空（本地开发），注入 devEnv
  if (!c.env?.UPSTREAM_API_TOKEN) {
    c.env = devEnv
  }
  await next()
})

// CSRF 保护（必须在开发环境中间件之后）
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
  const html = injectCsrfToken(PurchasePage(), csrfToken)
  return c.html(html)
})

// 接码终端页面
app.get('/receive', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = injectCsrfToken(ReceivePage(), csrfToken)
  return c.html(html)
})

// 结算页面
app.get('/checkout', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = injectCsrfToken(CheckoutPage(), csrfToken)
  return c.html(html)
})

// 支付成功页面
app.get('/success', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = injectCsrfToken(SuccessPage(), csrfToken)
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

// ========== 本地开发服务器启动 ==========
// 只在 Node.js 环境中运行（不在 Cloudflare Workers 中）
if (typeof process !== 'undefined' && process.versions?.node) {
  const port = Number(process.env.PORT) || 3000
  console.log(`🚀 Server is running on http://localhost:${port}`)
  
  serve({
    fetch: app.fetch,
    port,
  })
}
