/**
 * 支付策略初始化
 * 在应用启动时注册所有支付策略
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../../types/env'
import { registerAlipayStrategy } from './alimpay/strategy'
import { registerUsdtStrategy } from './bepusdt/strategy'

export function initializePaymentStrategies(env: Env, db: SupabaseClient): void {
  registerAlipayStrategy(env, db)
  registerUsdtStrategy(env, db)
}
