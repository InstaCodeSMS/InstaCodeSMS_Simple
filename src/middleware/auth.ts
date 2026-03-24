/**
 * 认证中间件
 * 支持 Better Auth 会话和 Telegram Mini App 认证
 * 
 * 优化：使用 Supabase REST API 进行会话验证，避免 Worker 资源超限
 */

import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { logUserId } from './logger'
import { createAuth } from '../adapters/auth'
import { validateTelegramInitData, extractTelegramUserId } from '../adapters/auth/telegram'
import type { Env } from '../types/env'

/**
 * 认证上下文
 */
export interface AuthContext {
  userId?: string
  apiKey?: string
  isAuthenticated: boolean
}

/**
 * 使用 Supabase REST API 验证会话
 * 避免 postgres 连接在 Workers 环境中的资源消耗
 */
async function validateSessionViaAPI(env: Env, sessionToken: string): Promise<{
  valid: boolean
  user?: {
    id: string
    email: string
    name?: string
  }
  sessionId?: string
}> {
  // 从 cookie 中提取 token（格式可能为 token.signature）
  // 处理可能的双重 URL 编码（%252F -> %2F -> /）
  let decodedToken = sessionToken;
  try {
    // 尝试解码，最多解码两次（处理双重编码）
    let decoded = decodedToken;
    for (let i = 0; i < 2; i++) {
      const temp = decodeURIComponent(decoded);
      if (temp === decoded) break; // 没有变化，说明已经解码完毕
      decoded = temp;
    }
    decodedToken = decoded;
    console.log('[Auth] Decoded sessionToken:', sessionToken.substring(0, 20) + '... -> ' + decodedToken.substring(0, 20) + '...');
  } catch (e) {
    // 解码失败，使用原始值
    console.log('[Auth] Failed to decode sessionToken, using original');
  }
  
  const tokenValue = decodedToken.split('.')[0]
  
  // SUPABASE_PUBLISHABLE_KEY 即 anon key
  const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY
  
  if (!env.SUPABASE_URL || !supabaseKey) {
    console.error('[Auth] Missing Supabase credentials')
    return { valid: false }
  }

  try {
    // 使用 Supabase REST API 查询 session
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/sessions?select=id,user_id,expires_at,token,users(id,email,name,created_at)&token=eq.${tokenValue}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('[Auth] Supabase API error:', response.status, await response.text())
      return { valid: false }
    }

    const sessions = await response.json() as Array<{
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
    }>

    if (!sessions || sessions.length === 0) {
      return { valid: false }
    }

    const session = sessions[0]
    
    // 检查过期
    const expiresAt = new Date(session.expires_at)
    if (expiresAt <= new Date()) {
      return { valid: false }
    }

    return {
      valid: true,
      user: {
        id: session.users.id,
        email: session.users.email,
        name: session.users.name || undefined
      },
      sessionId: session.id
    }
  } catch (error) {
    console.error('[Auth] Session validation error:', error)
    return { valid: false }
  }
}

/**
 * Better Auth 会话中间件
 * 自动从请求中提取会话信息，支持 Web 和 Telegram 用户
 * 
 * Why: 使用 Supabase REST API 而非直接 SQL 连接
 * 避免在 Cloudflare Workers 中超出资源限制
 */
export async function sessionMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // 尝试 Better Auth 会话（通过 REST API）
  const sessionToken = getCookie(c, 'better-auth.session_token')
  
  if (sessionToken) {
    console.log('[Auth] Found session_token, validating via API')
    
    const result = await validateSessionViaAPI(c.env, sessionToken)
    
    if (result.valid && result.user) {
      console.log('[Auth] Session valid for user:', result.user.email)
      c.set('user', {
        id: result.user.id,
        email: result.user.email,
        role: 'user',
        telegramId: null,
        created_at: new Date().toISOString()
      })
      c.set('sessionId', result.sessionId || '')
      logUserId(c, result.user.id)
      await next()
      return
    } else {
      console.log('[Auth] Session validation failed')
    }
  }

  // 尝试 Better Auth getSession（可能需要数据库连接，作为备选）
  if (c.env.DATABASE_URL && !sessionToken) {
    try {
      const auth = createAuth(c.env)
      const headers = new Headers(c.req.raw.headers)
      const cookieHeader = c.req.header('cookie')
      if (cookieHeader) {
        headers.set('cookie', cookieHeader)
      }

      const session = await auth.api.getSession({
        headers: headers
      })

      if (session) {
        c.set('user', {
          id: session.user.id,
          email: session.user.email,
          role: 'user',
          telegramId: null,
          created_at: String(session.user.createdAt || new Date().toISOString())
        })
        c.set('sessionId', session.session.id)
        logUserId(c, session.user.id)
        await next()
        return
      }
    } catch (error) {
      console.error('[Auth] Better Auth session error:', error instanceof Error ? error.message : String(error))
    }
  }
  
  // 尝试 Telegram Mini App 认证
  const initData = c.req.header('X-Telegram-Init-Data')
  if (initData && c.env.TELEGRAM_BOT_TOKEN) {
    // 快速提取用户 ID
    const telegramId = extractTelegramUserId(initData)
    
    if (telegramId) {
      // 验证 initData 签名
      const validation = await validateTelegramInitData(initData, c.env.TELEGRAM_BOT_TOKEN)
      
      if (validation.valid && validation.user) {
        c.set('user', {
          id: `telegram:${telegramId}`,
          email: null,
          role: 'user',
          telegramId: telegramId,
          created_at: new Date().toISOString()
        })
        c.set('sessionId', `telegram:${telegramId}`)
        logUserId(c, `telegram:${telegramId}`)
        await next()
        return
      } else {
        console.warn('[Auth] Telegram validation failed:', validation.error)
      }
    }
  }
  
  // 未认证
  c.set('user', null as any)
  c.set('sessionId', '')
  await next()
}

/**
 * 需要认证的路由守卫
 */
export async function requireAuth(c: Context, next: Next) {
  const user = c.get('user')
  
  if (!user) {
    // HTMX 请求返回局部错误
    if (c.req.header('HX-Request')) {
      return c.html('<div class="alert alert-error">请先登录</div>', 401)
    }
    // API 请求返回 JSON
    if (c.req.header('Accept')?.includes('application/json')) {
      return c.json({ 
        success: false,
        error: { 
          code: 'UNAUTHORIZED', 
          message: '请先登录' 
        } 
      }, 401)
    }
    // Web 请求重定向到登录页（保留语言前缀）
    const lang = c.req.param('lang') || 'zh'
    return c.redirect(`/${lang}/login`)
  }
  
  await next()
}

/**
 * 可选认证中间件
 * 如果有会话则验证，否则继续
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  await sessionMiddleware(c, next)
}

/**
 * 获取当前用户
 */
export function getCurrentUser(c: Context) {
  return c.get('user')
}

/**
 * 获取当前会话 ID
 */
export function getCurrentSessionId(c: Context) {
  return c.get('sessionId')
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(c: Context): boolean {
  const user = c.get('user')
  return !!user
}

// ==================== API 密钥认证（保留兼容） ====================

/**
 * API 密钥验证中间件
 * 用于保护 API 端点
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('x-api-key') || c.req.query('api_key')

  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少 API 密钥',
        },
      },
      401
    )
  }

  // 验证 API 密钥
  if (!isValidApiKey(apiKey)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'API 密钥无效',
        },
      },
      401
    )
  }

  // 设置认证信息到 context
  c.set('auth', {
    apiKey,
    isAuthenticated: true,
  } as AuthContext)

  logUserId(c, `api-key-${apiKey.substring(0, 8)}`)

  await next()
}

/**
 * 可选 API 密钥认证中间件
 */
export async function optionalApiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('x-api-key') || c.req.query('api_key')

  if (apiKey && isValidApiKey(apiKey)) {
    c.set('auth', {
      apiKey,
      isAuthenticated: true,
    } as AuthContext)
    logUserId(c, `api-key-${apiKey.substring(0, 8)}`)
  } else {
    c.set('auth', {
      isAuthenticated: false,
    } as AuthContext)
  }

  await next()
}

/**
 * 验证 API 密钥
 */
function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 32) {
    return false
  }
  // 临时允许所有格式正确的密钥
  // TODO: 实现实际的验证逻辑
  return true
}

/**
 * 获取认证信息
 */
export function getAuth(c: Context): AuthContext {
  return c.get('auth') || { isAuthenticated: false }
}

// ==================== 兼容旧接口 ====================

/**
 * 用户会话认证中间件（兼容旧代码）
 * @deprecated 使用 sessionMiddleware 替代
 */
export async function requireUserAuth(c: Context, next: Next) {
  const sessionId = getCookie(c, 'auth_session')

  if (!sessionId) {
    return c.redirect('/login')
  }

  // 使用 Better Auth 验证会话
  if (c.env.DATABASE_URL) {
    try {
      const auth = createAuth(c.env)
      const session = await auth.api.getSession({
        headers: c.req.raw.headers
      })
      
      if (session) {
        c.set('user', {
          id: session.user.id,
          email: session.user.email,
          role: 'user',
          telegramId: null,
          created_at: String(session.user.createdAt || new Date().toISOString())
        })
        c.set('sessionId', session.session.id)
        await next()
        return
      }
    } catch (error) {
      console.error('[Auth] Session validation error:', error)
    }
  }

  return c.redirect('/login')
}

/**
 * 可选用户认证中间件（兼容旧代码）
 * @deprecated 使用 optionalAuth 替代
 */
export async function optionalUserAuth(c: Context<{ Bindings: Env }>, next: Next) {
  await sessionMiddleware(c, next)
}