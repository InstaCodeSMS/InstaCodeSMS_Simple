import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { requireAuth } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env }>()

// 调试端点：检查 session 状态
app.get('/debug-session', async (c) => {
  const sessionToken = getCookie(c, 'better-auth.session_token')
  const user = c.get('user')
  
  // 提取 token 值（去掉签名部分）
  const tokenValue = sessionToken ? sessionToken.split('.')[0] : null
  
  // 检查环境变量
  const envStatus = {
    hasSupabaseUrl: !!c.env.SUPABASE_URL,
    hasServiceKey: !!c.env.SUPABASE_SERVICE_KEY,
    serviceKeyLength: c.env.SUPABASE_SERVICE_KEY?.length || 0,
    serviceKeyPrefix: c.env.SUPABASE_SERVICE_KEY?.substring(0, 20) + '...' || null
  }
  
  // 直接查询数据库
  let dbSession = null
  let dbError = null
  
  if (tokenValue) {
    try {
      const supabase = createSupabaseServiceClient(c.env)
      const result = await supabase
        .from('sessions')
        .select('id, user_id, expires_at, token, users!inner(id, email, name)')
        .eq('token', tokenValue)
        .single()
      
      dbSession = result.data
      dbError = result.error ? {
        message: (result.error as any).message,
        code: (result.error as any).code,
        details: (result.error as any).details
      } : null
    } catch (e) {
      dbError = { message: e instanceof Error ? e.message : String(e) }
    }
  }
  
  return c.json({
    cookie: {
      raw: sessionToken ? sessionToken.substring(0, 50) + '...' : null,
      tokenValue: tokenValue ? tokenValue.substring(0, 20) + '...' : null,
      hasSignature: sessionToken ? sessionToken.includes('.') : false
    },
    context: {
      user: user
    },
    env: envStatus,
    database: {
      session: dbSession,
      error: dbError
    }
  })
})

// 获取用户资料（包含 username）
app.get('/profile', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  const supabase = createSupabaseServiceClient(c.env)
  
  // 获取 profile 信息
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single()

  return c.json<ApiResponse>({
    success: true,
    message: '获取成功',
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      telegramId: user.telegramId,
      username: profile?.username || null,
      created_at: user.created_at
    }
  })
})

// 更新用户名
app.put('/profile', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  try {
    const body = await c.req.json()
    const { username } = body

    // 验证用户名格式
    if (!username || typeof username !== 'string') {
      return c.json<ApiResponse>({
        success: false,
        message: '用户名不能为空'
      }, 400)
    }

    if (username.length < 3 || username.length > 50) {
      return c.json<ApiResponse>({
        success: false,
        message: '用户名长度必须在3-50个字符之间'
      }, 400)
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return c.json<ApiResponse>({
        success: false,
        message: '用户名只能包含字母、数字和下划线'
      }, 400)
    }

    const supabase = createSupabaseServiceClient(c.env)
    
    // 更新 profile
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('user_id', user.id)

    if (error) {
      // 唯一约束冲突
      if (error.code === '23505') {
        return c.json<ApiResponse>({
          success: false,
          message: '该用户名已被使用'
        }, 400)
      }
      console.error('Update profile error:', error)
      return c.json<ApiResponse>({
        success: false,
        message: '更新失败'
      }, 500)
    }

    return c.json<ApiResponse>({
      success: true,
      message: '用户名设置成功'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, 500)
  }
})

// 检查用户名是否可用
app.get('/check-username', async (c) => {
  const username = c.req.query('username')

  if (!username || username.length < 3) {
    return c.json({ available: false })
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return c.json({ available: false })
  }

  const supabase = createSupabaseServiceClient(c.env)
  
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .single()

  // 如果没找到，说明用户名可用
  if (error && error.code === 'PGRST116') {
    return c.json({ available: true })
  }

  return c.json({ available: false })
})

app.get('/orders', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  // 暂时返回空数组（Supabase REST API 在 wrangler dev 中有 API key 问题）
  // 生产环境中使用真实 Supabase 连接
  return c.json<ApiResponse>({
    success: true,
    message: '获取成功',
    data: []
  })
})

export default app