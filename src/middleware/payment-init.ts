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
    // 调试：检查环境变量是否正确注入
    console.log('[PaymentInit] Initializing payment strategies...')
    console.log('[PaymentInit] EPAY config:', {
      EPAY_API_URL: c.env.EPAY_API_URL ? 'SET' : 'MISSING',
      EPAY_PID: c.env.EPAY_PID ? 'SET' : 'MISSING',
      EPAY_KEY: c.env.EPAY_KEY ? 'SET' : 'MISSING',
      EPAY_SIGN_TYPE: c.env.EPAY_SIGN_TYPE || 'NOT SET',
    })
    const db = createSupabaseServiceClient(c.env)
    initializePaymentStrategies(c.env, db)
    initialized = true
    console.log('[PaymentInit] Payment strategies initialized')
  }
  await next()
})
