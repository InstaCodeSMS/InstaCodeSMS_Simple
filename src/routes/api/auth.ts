/**
 * 认证 API 路由
 * 使用 Better Auth 进行用户认证
 */

import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { createAuth } from '../../adapters/auth'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * 注册
 * POST /api/auth/register
 */
app.post('/register', async (c) => {
  try {
    const auth = createAuth(c.env)
    const body = await c.req.json()

    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name || body.email.split('@')[0],
      },
      headers: c.req.raw.headers,
    }) as any

    if (result.error) {
      return c.json<ApiResponse>({
        success: false,
        message: result.error.message || '注册失败'
      }, 400)
    }

    // Better Auth 返回的是 token 而不是 session
    const token = result.token
    
    // 设置 session cookie - 必须在返回响应之前设置
    if (token) {
      console.log('[Auth] Setting cookie for token:', token.substring(0, 8) + '...')
      setCookie(c, 'better-auth.session_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 7, // 7天
        secure: false // 开发环境不使用 secure
      })
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: '注册成功',
      data: result.user
    })
  } catch (error) {
    console.error('[Auth] Register error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : '注册失败'
    }, 400)
  }
})

/**
 * 登录
 * POST /api/auth/login
 */
app.post('/login', async (c) => {
  try {
    const auth = createAuth(c.env)
    const body = await c.req.json()

    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: c.req.raw.headers,
    }) as any

    console.log('[Auth] signInEmail result:', JSON.stringify(result, null, 2))

    if (result.error) {
      return c.json<ApiResponse>({
        success: false,
        message: result.error.message || '邮箱或密码错误'
      }, 400)
    }

    const response = c.json<ApiResponse>({
      success: true,
      message: '登录成功',
      data: result.user
    })

    // 检查 result 中的 token 或 session
    console.log('[Auth] result keys:', Object.keys(result))
    console.log('[Auth] result.session:', result.session)
    console.log('[Auth] result.token:', result.token)

    if (result.session?.token) {
      response.headers.append(
        'Set-Cookie',
        `better-auth.session_token=${result.session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      )
    } else if (result.token) {
      response.headers.append(
        'Set-Cookie',
        `better-auth.session_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      )
    }

    return response
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : '登录失败'
    }, 400)
  }
})

/**
 * 登出
 * POST /api/auth/logout
 */
app.post('/logout', async (c) => {
  try {
    const auth = createAuth(c.env)
    
    // 使用 Better Auth 登出
    try {
      await auth.api.signOut({
        headers: c.req.raw.headers,
      })
    } catch (signOutError) {
      console.log('[Auth] Better Auth signOut error (continuing):', signOutError)
    }
    
    // 手动清除 cookies - 设置过期时间为过去
    setCookie(c, 'better-auth.session_token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 0 // 立即过期
    })
    
    setCookie(c, 'better-auth.session_data', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 0
    })
    
    return c.json<ApiResponse>({
      success: true,
      message: '登出成功',
      data: {
        cookies: [
          'better-auth.session_token=; Max-Age=0; Path=/',
          'better-auth.session_data=; Max-Age=0; Path=/'
        ]
      }
    })
  } catch (error) {
    console.error('[Auth] Logout error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '登出失败'
    }, 500)
  }
})

/**
 * 获取当前会话
 * GET /api/auth/session
 */
app.get('/session', async (c) => {
  try {
    const auth = createAuth(c.env)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })
    
    if (!session) {
      return c.json<ApiResponse>({
        success: false,
        message: '未登录'
      }, 401)
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: '已登录',
      data: session
    })
  } catch (error) {
    console.error('[Auth] Session error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '获取会话失败'
    }, 500)
  }
})

export default app