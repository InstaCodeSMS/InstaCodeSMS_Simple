import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { requireAuth } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env }>()

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

  const supabase = createSupabaseServiceClient(c.env)
  const { data, error } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json<ApiResponse>({
      success: false,
      message: '获取订单失败'
    }, 500)
  }

  return c.json<ApiResponse>({
    success: true,
    message: '获取成功',
    data: data
  })
})

export default app