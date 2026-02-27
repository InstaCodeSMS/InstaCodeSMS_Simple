/**
 * Telegram Mini App 认证中间件
 * 处理会话 Cookie 和用户认证
 */

import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Env } from '@/types/env'
import { getSession } from './session'
import type { TelegramUser } from './session'

export interface AuthContext {
  user?: TelegramUser
  sessionId?: string
}

/**
 * 认证中间件
 * 从 Cookie 中获取会话 ID，验证会话有效性
 */
export const miniAppAuthMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AuthContext
}>(async (c, next) => {
  try {
    // 从 Cookie 中获取会话 ID
    const sessionId = getCookie(c, 'tg_session_id')

    if (sessionId) {
      const session = getSession(sessionId)
      if (session) {
        // 会话有效，设置用户信息
        c.set('user', session.user)
        c.set('sessionId', sessionId)
      }
    }

    await next()
  } catch (error) {
    console.error('[Mini App Auth] Middleware error:', error)
    await next()
  }
})

/**
 * 获取当前认证用户
 */
export function getCurrentUser(c: any): TelegramUser | undefined {
  return c.var.user
}

/**
 * 获取当前会话 ID
 */
export function getSessionId(c: any): string | undefined {
  return c.var.sessionId
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(c: any): boolean {
  return !!c.var.user
}
