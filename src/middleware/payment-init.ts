/**
 * 支付策略初始化中间件
 * 在应用启动时注册所有支付策略
 */

import { createMiddleware } from 'hono/factory'
import type { Env } from '../types/env'
import { initializePaymentStrategies } from '../adapters/payment/init'
import { createSupabaseServiceClient } from '../adapters/database/supabase'

let initialized = false

export const paymentStrategyInitializer = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (!initialized) {
    const db = createSupabaseServiceClient(c.env)
    initializePaymentStrategies(c.env, db)
    initialized = true
  }
  await next()
})
