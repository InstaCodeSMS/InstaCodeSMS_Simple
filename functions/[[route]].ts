import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// 导入页面路由
import PurchasePage from '../src/views/pages/PurchasePage'
import ReceivePage from '../src/views/pages/ReceivePage'
import CheckoutPage from '../src/views/pages/CheckoutPage'
import SuccessPage from '../src/views/pages/SuccessPage'

// 导入 i18n
import { detectLanguage } from '../src/i18n'

// 导入 API 路由
import servicesApi from '../src/routes/api/services'
import ordersApi from '../src/routes/api/orders'
import smsApi from '../src/routes/api/sms'
import paymentApi from '../src/routes/api/payment'

// 导入类型
import type { Env } from '../src/types/env'

// 创建应用
const app = new Hono<{ Bindings: Env }>()

// 中间件
app.use('*', logger())
app.use('*', cors())

// ========== 页面路由 ==========

// 首页
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
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
<body class="min-h-screen bg-base-200 flex flex-col items-center justify-center">
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
</html>`)
})

// 购买服务页面
app.get('/purchase', (c) => {
  const lang = detectLanguage(c.req.query('lang'), null)
  return c.html(PurchasePage('', lang))
})

// 结算支付页面
app.get('/checkout', (c) => {
  const lang = detectLanguage(c.req.query('lang'), null)
  return c.html(CheckoutPage('', lang))
})

// 接码终端页面
app.get('/receive', (c) => {
  const lang = detectLanguage(c.req.query('lang'), null)
  return c.html(ReceivePage('', lang))
})

// 成功页面
app.get('/success', (c) => {
  const lang = detectLanguage(c.req.query('lang'), null)
  return c.html(SuccessPage('', lang))
})

// ========== API 路由 ==========

// 服务 API
app.route('/api/services', servicesApi)

// 订单 API
app.route('/api/orders', ordersApi)

// 验证码 API
app.route('/api/sms', smsApi)

// 支付 API
app.route('/api/payment', paymentApi)

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ========== 错误处理 ==========

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: '未找到请求的资源' }, 404)
})

// 全局错误处理
app.onError((err, c) => {
  console.error('Server Error:', err)
  return c.json({ success: false, message: '服务器内部错误' }, 500)
})

// 导出为 Cloudflare Pages Functions 格式
export const onRequest = handle(app)