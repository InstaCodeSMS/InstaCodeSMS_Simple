import { Hono } from 'hono'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'
import { requireAuth } from '../../middleware/auth'

const app = new Hono<{ Bindings: Env }>()

app.get('/profile', requireAuth, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json<ApiResponse>({
      success: false,
      message: '未登录'
    }, 401)
  }

  return c.json<ApiResponse>({
    success: true,
    message: '获取成功',
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      telegramId: user.telegramId
    }
  })
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