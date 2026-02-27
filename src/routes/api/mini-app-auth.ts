/**
 * Telegram Mini App 认证 API 端点
 * 处理登录、登出、验证等操作
 */

import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import type { Env } from '@/types/env'
import { verifyInitData, getUserFromInitData } from '@/adapters/telegram/init-data'
import { createSession, deleteSession, getSession } from '@/middleware/session'
import type { ApiResponse } from '@/types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /mini-app/api/auth/login
 * 使用 InitData 登录
 */
app.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { initData } = body

    if (!initData) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '缺少 initData',
        },
        400
      )
    }

    const botToken = c.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '服务器配置错误',
        },
        500
      )
    }

    // 验证 InitData 签名
    const result = verifyInitData(initData, botToken)

    if (!result.valid) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '验证失败: ' + result.error,
        },
        401
      )
    }

    // 提取用户信息
    const user = getUserFromInitData(result.data!)

    if (!user) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '无法获取用户信息',
        },
        401
      )
    }

    // 创建会话
    const sessionId = createSession(user, initData)

    // 设置 Cookie
    setCookie(c, 'tg_session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60, // 24 小时
      path: '/mini-app',
    })

    return c.json<ApiResponse>({
      success: true,
      message: '登录成功',
      data: {
        user,
        sessionId,
      },
    })
  } catch (error) {
    console.error('[Mini App Auth] Login error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '登录失败',
      },
      500
    )
  }
})

/**
 * POST /mini-app/api/auth/logout
 * 登出
 */
app.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c, 'tg_session_id')

    if (sessionId) {
      deleteSession(sessionId)
    }

    // 删除 Cookie
    deleteCookie(c, 'tg_session_id', {
      path: '/mini-app',
    })

    return c.json<ApiResponse>({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    console.error('[Mini App Auth] Logout error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '登出失败',
      },
      500
    )
  }
})

/**
 * GET /mini-app/api/auth/me
 * 获取当前用户信息
 */
app.get('/me', async (c) => {
  try {
    const sessionId = getCookie(c, 'tg_session_id')

    if (!sessionId) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '未认证',
        },
        401
      )
    }

    const session = getSession(sessionId)

    if (!session) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '会话已过期',
        },
        401
      )
    }

    return c.json<ApiResponse>({
      success: true,
      message: '获取用户信息成功',
      data: session.user,
    })
  } catch (error) {
    console.error('[Mini App Auth] Get user error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取用户信息失败',
      },
      500
    )
  }
})

export default app
