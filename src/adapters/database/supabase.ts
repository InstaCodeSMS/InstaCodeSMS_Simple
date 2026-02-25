/**
 * Supabase 数据库适配器
 * 初始化 Supabase 客户端，提供 anon 和 service 两种客户端
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../../types/env'

// Supabase 客户端类型
export type { SupabaseClient }

/**
 * 创建 Supabase 客户端（使用 anon key，受 RLS 保护）
 * 适用于：前端请求、公开 API
 */
export function createSupabaseClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY)
}

/**
 * 创建 Supabase 服务客户端（使用 service key，绕过 RLS）
 * 适用于：后台任务、同步操作、管理功能
 */
export function createSupabaseServiceClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}