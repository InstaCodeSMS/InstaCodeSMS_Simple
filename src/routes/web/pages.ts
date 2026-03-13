/**
 * Web 路由层
 * 处理页面请求，返回 HTML 视图
 */

import { Hono } from 'hono'
import { RegisterPage } from '../../views/pages/RegisterPage'
import { LoginPage } from '../../views/pages/LoginPage'
import { DashboardPage } from '../../views/pages/DashboardPage'
import PrivacyPolicyPage from '../../views/pages/PrivacyPolicyPage'
import TermsPage from '../../views/pages/TermsPage'
import { requireAuth } from '../../middleware/auth'
import type { Env } from '../../types/env'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /
 * 首页
 */
app.get('/', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>即刻接码 - 虚拟手机号码接码平台</title>
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

app.get('/register', (c) => {
  return c.html(RegisterPage())
})

app.get('/login', (c) => {
  return c.html(LoginPage())
})

app.get('/dashboard', requireAuth, (c) => {
  return c.html(DashboardPage())
})

// 支持语言前缀的隐私政策页面
app.get('/:lang/privacy', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as 'zh' | 'en'
  return c.html(PrivacyPolicyPage(csrfToken, lang))
})

// 支持语言前缀的服务条款页面
app.get('/:lang/terms', (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as 'zh' | 'en'
  return c.html(TermsPage(csrfToken, lang))
})

// 重定向：无语言前缀 → 带语言前缀
app.get('/privacy', (c) => {
  const lang = c.get('language') as 'zh' | 'en' || 'zh'
  return c.redirect(`/${lang}/privacy`, 302)
})

app.get('/terms', (c) => {
  const lang = c.get('language') as 'zh' | 'en' || 'zh'
  return c.redirect(`/${lang}/terms`, 302)
})

export default app