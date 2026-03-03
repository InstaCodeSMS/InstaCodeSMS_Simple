/**
 * 支付策略初始化 - MVP版本
 * 仅初始化易支付
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../../types/env'
import { registerEpayStrategy } from './epay/strategy'

export function initializePaymentStrategies(env: Env, db: SupabaseClient): void {
  registerEpayStrategy(env, db)
}
