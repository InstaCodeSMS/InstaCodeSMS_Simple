/**
 * 轻量级认证 API
 * 使用 Supabase REST API 进行认证，避免在 Cloudflare Workers 中超出资源限制
 * 
 * Why: Better Auth 使用 postgres.js 直连数据库，在 Workers 环境中会导致 Error 1102 (Worker exceeded resource limits)
 * Solution: 使用 Supabase REST API 进行认证操作
 */

import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import type { Env } from '../../types/env'

const app = new Hono<{ Bindings: Env }>()

/**
 * 生成随机 ID
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * 密码哈希（使用 Web Crypto API）
 */
async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  const saltValue = salt || generateId()
  const data = encoder.encode(password + saltValue)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltValue}:${hashHex}`
}

/**
 * 验证密码
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':')
  if (!salt || !hash) return false
  const newHash = await hashPassword(password, salt)
  return newHash === hashedPassword
}

/**
 * 生成 Session Token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Supabase REST API 请求
 */
async function supabaseRequest<T>(
  env: Env,
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    query?: Record<string, string>
    body?: object
    select?: string
  }
): Promise<{ data: T | null; error: string | null }> {
  const { method = 'GET', query = {}, body, select } = options
  
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_PUBLISHABLE_KEY
  
  let url = `${env.SUPABASE_URL}/rest/v1/${table}`
  
  // 添加查询参数
  const queryParams = new URLSearchParams()
  if (select) queryParams.set('select', select)
  Object.entries(query).forEach(([k, v]) => queryParams.set(k, v))
  url += '?' + queryParams.toString()
  
  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }
  
  // 使用 service key 时添加 Prefer header 以返回插入的数据
  if (method === 'POST') {
    headers['Prefer'] = 'return=representation'
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Auth] Supabase API error:', response.status, errorText)
      return { data: null, error: `API error: ${response.status}` }
    }
    
    const data = await response.json() as T
    return { data, error: null }
  } catch (e) {
    console.error('[Auth] Supabase request failed:', e)
    return { data: null, error: String(e) }
  }
}

/**
 * 注册
 * POST /api/auth-light/register
 */
app.post('/register', async (c) => {
  const { email, password, name } = await c.req.json<{ email: string; password: string; name?: string }>()
  
  if (!email || !password) {
    return c.json({ success: false, error: 'Email and password are required' }, 400)
  }
  
  if (password.length < 8) {
    return c.json({ success: false, error: 'Password must be at least 8 characters' }, 400)
  }
  
  // 检查用户是否已存在
  const { data: existingUsers, error: checkError } = await supabaseRequest<{ id: string }[]>(c.env, 'users', {
    query: { email: `eq.${email}` },
    select: 'id'
  })
  
  if (checkError) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
  
  if (existingUsers && existingUsers.length > 0) {
    return c.json({ success: false, error: 'Email already registered' }, 400)
  }
  
  // 创建用户
  const userId = generateId()
  const hashedPassword = await hashPassword(password)
  const now = new Date().toISOString()
  
  const { data: users, error: createError } = await supabaseRequest<{ id: string; email: string }[]>(c.env, 'users', {
    method: 'POST',
    body: {
      id: userId,
      email,
      name: name || email.split('@')[0],
      password_hash: hashedPassword,
      email_verified: false,
      created_at: now,
      updated_at: now
    },
    select: 'id,email,name'
  })
  
  if (createError || !users || users.length === 0) {
    return c.json({ success: false, error: 'Failed to create user' }, 500)
  }
  
  // 创建 session
  const sessionToken = generateSessionToken()
  const sessionId = generateId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 天
  
  const { error: sessionError } = await supabaseRequest(c.env, 'sessions', {
    method: 'POST',
    body: {
      id: sessionId,
      user_id: userId,
      token: sessionToken,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now
    }
  })
  
  if (sessionError) {
    console.error('[Auth] Failed to create session:', sessionError)
    // 用户已创建，继续返回成功
  }
  
  // 设置 cookie
  const isProduction = c.env.BASE_URL?.startsWith('https') || false
  setCookie(c, 'better-auth.session_token', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 7 // 7 天
  })
  
  return c.json({
    success: true,
    user: {
      id: userId,
      email,
      name: name || email.split('@')[0]
    },
    token: sessionToken
  })
})

/**
 * 登录
 * POST /api/auth-light/login
 */
app.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  
  if (!email || !password) {
    return c.json({ success: false, error: 'Email and password are required' }, 400)
  }
  
  // 查询用户
  const { data: users, error: userError } = await supabaseRequest<{
    id: string
    email: string
    name: string | null
    password_hash: string | null
  }[]>(c.env, 'users', {
    query: { email: `eq.${email}` },
    select: 'id,email,name,password_hash'
  })
  
  if (userError) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
  
  if (!users || users.length === 0) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401)
  }
  
  const user = users[0]
  
  // 检查密码
  if (!user.password_hash) {
    return c.json({ success: false, error: 'User has no password set' }, 400)
  }
  
  const passwordValid = await verifyPassword(password, user.password_hash)
  if (!passwordValid) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401)
  }
  
  // 创建 session
  const sessionToken = generateSessionToken()
  const sessionId = generateId()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 天
  
  const { error: sessionError } = await supabaseRequest(c.env, 'sessions', {
    method: 'POST',
    body: {
      id: sessionId,
      user_id: user.id,
      token: sessionToken,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now
    }
  })
  
  if (sessionError) {
    console.error('[Auth] Failed to create session:', sessionError)
  }
  
  // 设置 cookie
  const isProduction = c.env.BASE_URL?.startsWith('https') || false
  setCookie(c, 'better-auth.session_token', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 7 // 7 天
  })
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    },
    token: sessionToken
  })
})

/**
 * 登出
 * POST /api/auth-light/logout
 */
app.post('/logout', async (c) => {
  const sessionToken = getCookie(c, 'better-auth.session_token')
  
  if (sessionToken) {
    // 删除 session
    const tokenValue = sessionToken.split('.')[0]
    await supabaseRequest(c.env, 'sessions', {
      method: 'DELETE',
      query: { token: `eq.${tokenValue}` }
    })
  }
  
  // 清除 cookie
  setCookie(c, 'better-auth.session_token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 0
  })
  
  return c.json({ success: true })
})

/**
 * 获取当前用户
 * GET /api/auth-light/me
 */
app.get('/me', async (c) => {
  const sessionToken = getCookie(c, 'better-auth.session_token')
  
  if (!sessionToken) {
    return c.json({ success: false, error: 'Not authenticated' }, 401)
  }
  
  const tokenValue = sessionToken.split('.')[0]
  
  // 查询 session 和 user
  const { data: sessions, error } = await supabaseRequest<{
    id: string
    user_id: string
    expires_at: string
    token: string
    users: {
      id: string
      email: string
      name: string | null
      created_at: string
    }
  }[]>(c.env, 'sessions', {
    query: { token: `eq.${tokenValue}`, select: 'id,user_id,expires_at,token,users(id,email,name,created_at)' },
    select: 'id,user_id,expires_at,token,users(id,email,name,created_at)'
  })
  
  if (error || !sessions || sessions.length === 0) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }
  
  const session = sessions[0]
  
  // 检查过期
  if (new Date(session.expires_at) <= new Date()) {
    return c.json({ success: false, error: 'Session expired' }, 401)
  }
  
  return c.json({
    success: true,
    user: {
      id: session.users.id,
      email: session.users.email,
      name: session.users.name || undefined
    }
  })
})

export default app