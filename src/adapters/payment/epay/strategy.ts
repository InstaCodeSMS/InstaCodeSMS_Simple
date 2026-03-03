/**
 * EPay 支付策略 - MVP版本
 * 简化为仅导出注册函数（保持兼容性）
 */

import type { Env } from '../../../types/env'
import type { SupabaseClient } from '@supabase/supabase-js'

export function registerEpayStrategy(env: Env, db: SupabaseClient): void {
  // MVP版本：无需注册，直接在PaymentService中使用EpayClient
}

