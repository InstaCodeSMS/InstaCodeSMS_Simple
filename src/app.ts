import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { setCookie } from 'hono/cookie'
import { languageDetector } from 'hono/language'
import type { Env } from './types/env'
import type { Language } from './i18n'

// Better Auth
import { createAuth } from './adapters/auth'

// 导入中间件
import { csrfProtection } from './middleware/csrf'
import { paymentStrategyInitializer } from './middleware/payment-init'
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { noCache } from './middleware/no-cache'
import { sessionMiddleware } from './middleware/auth'

// 导入页面视图
import ReceivePage from './views/pages/ReceivePage'
import PurchasePage from './views/pages/PurchasePage'
import CheckoutPage from './views/pages/CheckoutPage'
import SuccessPage from './views/pages/SuccessPage'
import { RegisterPage } from './views/pages/RegisterPage'
import { LoginPage } from './views/pages/LoginPage'
import { DashboardPage } from './views/pages/DashboardPage'
import { ProfilePage } from './views/pages/ProfilePage'
import { BillingPage } from './views/pages/BillingPage'
import { OrdersPage } from './views/pages/OrdersPage'

// 导入页面路由
import pagesRoutes from './routes/web/pages'

// 导入中间件
import { requireAuth } from './middleware/auth'
import authRoutes from './routes/api/auth'
import userRoutes from './routes/api/user'
import walletRoutes from './routes/api/wallet'
import ordersRoutes from './routes/api/orders'
import servicesRoutes from './routes/api/services'
import smsRoutes from './routes/api/sms'
import paymentRoutes from './routes/api/payment'
import syncRoutes from './routes/api/sync'
import telegramRoutes from './routes/api/telegram'
import webhooksRoutes from './routes/api/webhooks'
import rpcApp from './routes/rpc'
import miniAppRoutes from './routes/web/mini-app'
import checkSchemaRoutes from './routes/api/check-schema'

// 创建主应用实例
const app = new Hono<{ Bindings: Env }>()

// ========== 中间件 ==========
app.use('*', paymentStrategyInitializer)
app.use('*', requestLogger)
app.use('*', cors({
  origin: (origin) => {
    // 对于本地开发，允许任何 origin
    // 但返回具体的 origin 而不是 *，以支持 credentials
    return origin || '*'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Cookie', 'Authorization'],
  exposeHeaders: ['Set-Cookie'],
  maxAge: 86400
}))
app.use('*', languageDetector({
  supportedLanguages: ['zh', 'en'],
  fallbackLanguage: 'en',
  cookieOptions: {
    sameSite: 'Lax',
    secure: false, // 开发环境禁用 secure
    httpOnly: true,
    maxAge: 86400 * 365
  }
}))
app.use('*', csrfProtection)
app.use('*', sessionMiddleware)

// ========== 私有 API 禁止缓存 ==========
// Security: 防止 CDN 缓存用户数据，解决隐私模式下显示其他用户信息的问题
app.use('/api/user/*', noCache)
app.use('/api/auth/*', noCache)
app.use('/api/wallet/*', noCache)
app.use('/api/orders/*', noCache)
app.use('/api/payment/*', noCache)
app.use('/api/sms/*', noCache)
app.use('/api/telegram/*', noCache)

// ========== Better Auth 路由 ==========
app.all('/api/better-auth/*', async (c) => {
  const auth = createAuth(c.env)
  
  // 处理 OPTIONS 预检请求
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': c.req.header('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  const response = await auth.handler(c.req.raw)
  
  // 读取响应 body 获取 token
  let responseBody: ReadableStream<Uint8Array> | null = null
  let token: string | null = null
  
  // 对于注册和登录请求，需要从响应 body 中提取 token 并设置 cookie
  const url = new URL(c.req.url)
  const isAuthEndpoint = url.pathname.includes('/sign-up/') || url.pathname.includes('/sign-in/')
  
  if (isAuthEndpoint && response.body) {
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    
    // 合并所有 chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }
    
    const bodyText = new TextDecoder().decode(combinedArray)
    
    try {
      const json = JSON.parse(bodyText)
      token = json.token || null
      console.log('[Better-Auth] Got token from response:', token ? token.substring(0, 8) + '...' : 'null')
    } catch (e) {
      console.error('[Better-Auth] Failed to parse response:', e)
    }
    
    // 重新创建 body
    const encodedBody = new TextEncoder().encode(bodyText)
    responseBody = new ReadableStream({
      start(controller) {
        controller.enqueue(encodedBody)
        controller.close()
      }
    })
  } else if (response.body) {
    // 非 auth 端点，直接使用原始 body
    responseBody = response.body
  }
  
  // 获取 origin 和 localhost 检测
  const origin = c.req.header('origin') || '*'
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  
  // 使用 Hono 的 setCookie 设置所有 cookies
  // 1. 设置 session token（如果有）
  if (token) {
    console.log('[Better-Auth] Setting session token cookie via Hono setCookie')
    setCookie(c, 'better-auth.session_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: !isLocalhost, // localhost 不需要 secure
      maxAge: 60 * 60 * 24 * 7 // 7 天
    })
  }
  
  // 2. 设置原始响应中的其他 cookies
  const originalCookies = response.headers.getSetCookie()
  console.log('[Better-Auth] Original cookies from Better Auth:', originalCookies.length)
  
  for (const cookieStr of originalCookies) {
    // 解析 cookie 字符串
    const parts = cookieStr.split(';').map(p => p.trim())
    const nameValue = parts[0].split('=')
    if (nameValue.length >= 2) {
      const name = nameValue[0]
      const value = nameValue.slice(1).join('=')
      
      // 解析选项
      const options: {
        path?: string
        secure?: boolean
        httpOnly?: boolean
        sameSite?: 'Strict' | 'Lax' | 'None'
        maxAge?: number
      } = {}
      
      for (const part of parts.slice(1)) {
        const lowerPart = part.toLowerCase()
        if (lowerPart === 'httponly') {
          options.httpOnly = true
        } else if (lowerPart === 'secure') {
          options.secure = true
        } else if (lowerPart.startsWith('path=')) {
          options.path = part.substring(5)
        } else if (lowerPart.startsWith('max-age=')) {
          options.maxAge = parseInt(part.substring(8))
        } else if (lowerPart.startsWith('samesite=')) {
          const sameSite = part.substring(9)
          if (sameSite === 'Strict' || sameSite === 'Lax' || sameSite === 'None') {
            options.sameSite = sameSite
          }
        }
      }
      
      console.log('[Better-Auth] Setting cookie via Hono setCookie:', name, options)
      setCookie(c, name, value, options)
    }
  }
  
  // ========== 方案：在响应 body 中返回 cookies，前端手动设置 ==========
  // 问题：wrangler dev 环境中 Set-Cookie header 格式有问题
  // 解决：将 cookies 放入响应 body，前端通过 document.cookie 设置
  
  // 获取所有 Set-Cookie headers
  const setCookies = response.headers.getSetCookie()
  console.log('[Better-Auth] Set-Cookie headers count:', setCookies.length)
  
  // 对于注册/登录请求，在响应 body 中添加 cookies
  if (isAuthEndpoint && responseBody) {
    // 读取原始 body
    const reader = responseBody.getReader()
    const chunks: Uint8Array[] = []
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }
    
    const bodyText = new TextDecoder().decode(combinedArray)
    
    try {
      const json = JSON.parse(bodyText)
      // 将 cookies 添加到响应 body 中
      // 只保留 cookie 的名称和值部分（不包含属性，因为 document.cookie 不支持）
      const cookieValues: string[] = []
      for (const cookieStr of setCookies) {
        // 提取 cookie 名称=值 部分（第一个分号之前）
        const firstSemi = cookieStr.indexOf(';')
        const cookieValue = firstSemi > 0 ? cookieStr.substring(0, firstSemi) : cookieStr
        cookieValues.push(cookieValue)
      }
      json.cookies = cookieValues
      console.log('[Better-Auth] Added cookies to response body:', cookieValues.length)
      
      const newBody = JSON.stringify(json)
      const encodedBody = new TextEncoder().encode(newBody)
      
      const finalResponse = new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(encodedBody)
          controller.close()
        }
      }), {
        status: response.status,
        headers: response.headers
      })
      
      finalResponse.headers.set('Access-Control-Allow-Origin', origin)
      finalResponse.headers.set('Access-Control-Allow-Credentials', 'true')
      finalResponse.headers.set('Content-Type', 'application/json')
      
      return finalResponse
    } catch (e) {
      console.error('[Better-Auth] Failed to modify response body:', e)
    }
  }
  
  // 非认证端点，直接返回原始响应
  const finalResponse = new Response(responseBody || response.body, {
    status: response.status,
    headers: response.headers
  })
  
  finalResponse.headers.set('Access-Control-Allow-Origin', origin)
  finalResponse.headers.set('Access-Control-Allow-Credentials', 'true')
  
  console.log('[Better-Auth] Response status:', response.status)
  
  return finalResponse
})

// ========== Mini App 路由 ==========
// 注意：必须放在 /:lang 路由之前，否则 mini-app 会被当作语言参数
app.route('/mini-app', miniAppRoutes)

// ========== API 路由 ==========
// 注意：必须在 /:lang 页面路由之前，否则 /api/* 会被当作语言参数匹配
app.route('/api/auth', authRoutes)
app.route('/api/user', userRoutes)
app.route('/api/wallet', walletRoutes)
app.route('/api/orders', ordersRoutes)
app.route('/api/services', servicesRoutes)
app.route('/api/sms', smsRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/sync', syncRoutes)
app.route('/api/telegram', telegramRoutes)
app.route('/api/webhooks', webhooksRoutes)
app.route('/api/check-schema', checkSchemaRoutes)
app.route('/rpc', rpcApp)

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

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

// 个人资料页面（需要登录）
app.get('/:lang/profile', requireAuth, (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(ProfilePage(csrfToken, lang))
})

// 账单中心页面（需要登录）
app.get('/:lang/billing', requireAuth, (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(BillingPage(csrfToken, lang))
})

// 订单管理页面（需要登录）
app.get('/:lang/orders', requireAuth, (c) => {
  const csrfToken = c.var.csrfToken || ''
  const lang = c.req.param('lang') as Language
  return c.html(OrdersPage(csrfToken, lang))
})

// Orders 路由（无语言前缀）
app.get('/orders', requireAuth, (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/orders`, 302)
})

// Profile 路由（无语言前缀）
app.get('/profile', requireAuth, (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/profile`, 302)
})

// Billing 路由（无语言前缀）
app.get('/billing', requireAuth, (c) => {
  const lang = c.get('language') as Language
  return c.redirect(`/${lang}/billing`, 302)
})

// ========== 页面路由（隐私政策和服务条款）==========
app.route('/', pagesRoutes)

// ========== 错误处理 ==========
app.notFound(notFoundHandler)
app.onError(errorHandler)

// 导出应用实例
export { app }
