/**
 * 认证中间件
 * 支持 Better Auth 会话和 Telegram Mini App 认证
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
 * Better Auth 会话中间件
 * 自动从请求中提取会话信息，支持 Web 和 Telegram 用户
 * 
 * Why: 修复手动设置 cookie 后 session_data 签名不匹配的问题
 * 通过 session_token 直接查询数据库验证会话
 */
export async function sessionMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // 尝试 Better Auth 会话（Cookie）
  if (c.env.DATABASE_URL) {
    try {
      const auth = createAuth(c.env)
      // 构建包含 Cookie 的 headers
      const headers = new Headers(c.req.raw.headers)
      const cookieHeader = c.req.header('cookie')
      if (cookieHeader) {
        headers.set('cookie', cookieHeader)
      }

      // 首先尝试 Better Auth 的 getSession
      try {
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
      } catch (getSessionError) {
        // getSession 失败（可能是 session_data 签名不匹配），尝试直接用 token 验证
        console.log('[Auth] getSession failed, trying direct token validation:', getSessionError instanceof Error ? getSessionError.message : String(getSessionError))
      }
      
      // 备用方案：直接使用 postgres 查询数据库验证 token
      let sessionToken = getCookie(c, 'better-auth.session_token')
      if (sessionToken) {
        console.log('[Auth] Found session_token in cookie, validating directly')
        
        // Cookie 中的 token 可能包含签名部分（格式: token.signature）
        // 数据库中只存储 token 部分，需要提取
        const tokenValue = sessionToken.split('.')[0]
        console.log('[Auth] Token value for validation:', tokenValue ? tokenValue.substring(0, 8) + '...' : 'null')
        
        try {
          // 直接使用 postgres 连接查询（绕过 Supabase API key 问题）
          const connectionString = c.env.HYPERDRIVE?.connectionString || c.env.DATABASE_URL
          if (connectionString) {
            // 动态导入 postgres
            const { default: postgres } = await import('postgres')
            const sql = postgres(connectionString, { max: 1 })
            
            try {
              // 查询 session 和 user
              const sessions = await sql`
                SELECT s.id as session_id, s.user_id, s.expires_at, 
                       u.id, u.email, u.name, u.created_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ${tokenValue}
                AND s.expires_at > NOW()
                LIMIT 1
              `
              
              if (sessions && sessions.length > 0) {
                const sessionData = sessions[0]
                console.log('[Auth] Direct postgres query successful for user:', sessionData.email)
                c.set('user', {
                  id: sessionData.user_id,
                  email: sessionData.email,
                  role: 'user',
                  telegramId: null,
                  created_at: String(sessionData.created_at || new Date().toISOString())
                })
                c.set('sessionId', sessionData.session_id)
                logUserId(c, sessionData.user_id)
                await next()
                return
              } else {
                console.log('[Auth] No session found for token')
              }
            } finally {
              await sql.end()
            }
          }
        } catch (dbError) {
          console.error('[Auth] Direct postgres query error:', dbError)
        }
      }
    } catch (error) {
      console.error('[Auth] Better Auth session error:', error)
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