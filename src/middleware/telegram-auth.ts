/**
 * Telegram Mini App 认证中间件
 * 验证请求中的 InitData 签名，确保用户身份
 */

import { createMiddleware } from 'hono/factory'
import type { Env } from '@/types/env'
import type { AuthenticatedUser } from '@/types/telegram'
import { verifyInitData, getUserFromInitData } from '@/adapters/telegram/init-data'

/**
 * Telegram 认证中间件
 * 从请求头中提取 X-TG-InitData，验证签名，注入用户信息到 Context
 *
 * @example
 * app.use('/api/telegram-mini-app/*', telegramAuthMiddleware)
 */
export const telegramAuthMiddleware = createMiddleware<{
  Bindings: Env
}>(async (c, next) => {
  try {
    // 从请求头中提取 initData
    const initDataRaw = c.req.header('X-TG-InitData')

    if (!initDataRaw) {
      console.warn('[Telegram Auth] Missing X-TG-InitData header')
      return c.json(
        {
          success: false,
          message: 'Missing authentication data',
        },
        401
      )
    }

    // 获取 Bot Token
    const botToken = c.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.error('[Telegram Auth] TELEGRAM_BOT_TOKEN not configured')
      return c.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        500
      )
    }

    // 验证 InitData 签名
    const result = verifyInitData(initDataRaw, botToken)

    if (!result.valid) {
      console.warn('[Telegram Auth] Verification failed:', result.error)
      return c.json(
        {
          success: false,
          message: 'Authentication failed',
        },
        401
      )
    }

    // 提取用户信息
    const user = getUserFromInitData(result.data!)

    if (!user) {
      console.warn('[Telegram Auth] No user information in initData')
      return c.json(
        {
          success: false,
          message: 'Invalid user information',
        },
        401
      )
    }

    // 将用户信息注入到 Context
    c.set('telegramUser', user)

    // 继续处理请求
    await next()
  } catch (error) {
    console.error('[Telegram Auth] Middleware error:', error)
    return c.json(
      {
        success: false,
        message: 'Authentication error',
      },
      500
    )
  }
})

/**
 * 获取当前认证用户
 * 在中间件保护的路由中使用
 *
 * @example
 * const user = getTelegramUser(c)
 * console.log(user.telegramId)
 */
export function getTelegramUser(c: any): AuthenticatedUser | null {
  return c.get('telegramUser') ?? null
}
