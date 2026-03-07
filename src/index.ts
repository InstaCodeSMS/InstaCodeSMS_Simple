import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { languageDetector } from 'hono/language'

// 导入 CSRF 中间件
import { csrfProtection } from './middleware/csrf'

// 导入支付策略初始化中间件
import { paymentStrategyInitializer } from './middleware/payment-init'

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
import rpcApp from './routes/rpc'

// 导入中间件
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// 导入上游客户端
import { createUpstreamClient } from './adapters/upstream'

// 导入类型
import type { Env } from './types/env'
import type { Language } from './i18n'

// 创建应用
const app = new Hono<{ Bindings: Env }>()

// ========== 中间件 ==========
app.use('*', paymentStrategyInitializer)  // 初始化支付策略
app.use('*', requestLogger)  // 请求日志 + request-id
app.use('*', cors())
app.use('*', languageDetector({
  supportedLanguages: ['zh', 'en'],
  fallbackLanguage: 'en'
}))

// CSRF 保护
app.use('*', csrfProtection)

// ========== 页面路由 ==========

// 首页 - 重定向到对应语言版本
app.get('/', (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}`)
})

// 重定向：无语言前缀 → 带语言前缀
app.get('/purchase', (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/purchase`, 302)
})

app.get('/receive', (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/receive`, 302)
})

app.get('/checkout', (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/checkout`, 302)
})

app.get('/success', (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/success`, 302)
})

// 语言首页
app.get('/:lang', (c) => {
  const lang = c.req.param('lang') as Language
  return c.html(`<!DOCTYPE html>
<html lang="${lang}" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SimpleFaka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.min.css" rel="stylesheet" type="text/css" />
</head>
<body class="min-h-screen bg-base-200 flex flex-col items-center justify-center">
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-4">
      <span class="text-primary">SIMPLE</span><span class="text-secondary">FAKA</span>
    </h1>
    <div class="flex gap-4 justify-center">
      <a href="/${lang}/purchase" class="btn btn-primary">购买服务</a>
      <a href="/${lang}/receive" class="btn btn-secondary">接码终端</a>
    </div>
  </div>
</body>
</html>`)
})

// 购买服务页面
app.get('/:lang/purchase', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  const html = PurchasePage(csrfToken, lang)
  return c.html(html)
})

// 接码终端页面
app.get('/:lang/receive', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  const html = ReceivePage(csrfToken, lang)
  return c.html(html)
})

// 结算页面
app.get('/:lang/checkout', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  const html = CheckoutPage(csrfToken, lang)
  return c.html(html)
})

// 支付成功页面
app.get('/:lang/success', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  const html = SuccessPage(csrfToken, lang)
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

// RPC 路由（类型安全 API）
app.route('/rpc', rpcApp)

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 调试：检查环境变量
app.get('/api/debug/env', (c) => {
  return c.json({
    EPAY_API_URL: c.env.EPAY_API_URL ? 'SET' : 'MISSING',
    EPAY_PID: c.env.EPAY_PID ? 'SET' : 'MISSING', 
    EPAY_KEY: c.env.EPAY_KEY ? 'SET' : 'MISSING',
    EPAY_SIGN_TYPE: c.env.EPAY_SIGN_TYPE || 'NOT SET',
    API_BASE_URL: c.env.API_BASE_URL ? 'SET' : 'MISSING',
  })
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