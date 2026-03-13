import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { languageDetector } from 'hono/language'
import type { Env } from './types/env'
import type { Language } from './i18n'

// 导入中间件
import { csrfProtection } from './middleware/csrf'
import { paymentStrategyInitializer } from './middleware/payment-init'
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// 导入页面视图
import ReceivePage from './views/pages/ReceivePage'
import PurchasePage from './views/pages/PurchasePage'
import CheckoutPage from './views/pages/CheckoutPage'
import SuccessPage from './views/pages/SuccessPage'
import { RegisterPage } from './views/pages/RegisterPage'
import { LoginPage } from './views/pages/LoginPage'
import { DashboardPage } from './views/pages/DashboardPage'

// 导入页面路由
import pagesRoutes from './routes/web/pages'

// 导入中间件
import { requireAuth } from './middleware/auth'
import authRoutes from './routes/api/auth'
import userRoutes from './routes/api/user'
import ordersRoutes from './routes/api/orders'
import servicesRoutes from './routes/api/services'
import smsRoutes from './routes/api/sms'
import paymentRoutes from './routes/api/payment'
import syncRoutes from './routes/api/sync'
import telegramRoutes from './routes/api/telegram'
import rpcApp from './routes/rpc'

// 创建主应用实例
const app = new Hono<{ Bindings: Env }>()

// ========== 中间件 ==========
app.use('*', paymentStrategyInitializer)
app.use('*', requestLogger)
app.use('*', cors())
app.use('*', languageDetector({
  supportedLanguages: ['zh', 'en'],
  fallbackLanguage: 'en'
}))
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

// 注册页面
app.get('/:lang/register', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(RegisterPage(csrfToken, lang))
})

// 登录页面
app.get('/:lang/login', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(LoginPage(csrfToken, lang))
})

// 用户中心页面（需要登录）
app.get('/:lang/dashboard', requireAuth, (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(DashboardPage(csrfToken, lang))
})

// ========== 页面路由（隐私政策和服务条款）==========
app.route('/', pagesRoutes)

// ========== API 路由 ==========
app.route('/api/auth', authRoutes)
app.route('/api/user', userRoutes)
app.route('/api/orders', ordersRoutes)
app.route('/api/services', servicesRoutes)
app.route('/api/sms', smsRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/sync', syncRoutes)
app.route('/api/telegram', telegramRoutes)
app.route('/rpc', rpcApp)

//健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ========== 错误处理 ==========
app.notFound(notFoundHandler)
app.onError(errorHandler)

// 导出应用实例
export { app }
