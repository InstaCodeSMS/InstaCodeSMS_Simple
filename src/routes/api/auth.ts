import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { UserService } from '../../domains/user/user.service'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

app.post('/register', async (c) => {
  try {
    const service = new UserService(c.env)
    const result = await service.register(await c.req.json())

    setCookie(c, 'auth_session', result.sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: result.expiresAt,
      path: '/'
    })

    return c.json<ApiResponse>({
      success: true,
      message: '注册成功',
      data: result.user
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : '注册失败'
    }, 400)
  }
})

app.post('/login', async (c) => {
  try {
    const service = new UserService(c.env)
    const result = await service.login(await c.req.json())

    setCookie(c, 'auth_session', result.sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: result.expiresAt,
      path: '/'
    })

    return c.json<ApiResponse>({
      success: true,
      message: '登录成功',
      data: result.user
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : '登录失败'
    }, 400)
  }
})

app.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c, 'auth_session')
    if (sessionId) {
      await new UserService(c.env).logout(sessionId)
    }
    
    deleteCookie(c, 'auth_session', { path: '/' })

    return c.json<ApiResponse>({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      message: '登出失败'
    }, 500)
  }
})

export default app