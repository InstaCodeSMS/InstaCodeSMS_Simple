/**
 * 认证适配器 - 使用 Supabase Auth
 * 兼容 Cloudflare Workers Edge 环境
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../../types/env'

export type { SupabaseClient }

/**
 * 创建 Supabase Auth 客户端
 * 用于服务端认证操作
 */
export function createAuthClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * 创建 Supabase 客户端（用于前端，使用 anon key）
 */
export function createPublicAuthClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY)
}

/**
 * 用户信息类型
 */
export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
  emailVerified: boolean
}

/**
 * 会话信息类型
 */
export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: AuthUser
}

/**
 * 认证服务
 * 封装 Supabase Auth 操作
 */
export class AuthService {
  private client: SupabaseClient

  constructor(env: Env) {
    this.client = createAuthClient(env)
  }

  /**
   * 注册新用户
   */
  async signUp(email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: '注册失败' }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name,
        emailVerified: data.user.email_confirmed_at ? true : false,
      },
      error: null,
    }
  }

  /**
   * 登录
   */
  async signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { session: null, error: error.message }
    }

    if (!data.session || !data.user) {
      return { session: null, error: '登录失败' }
    }

    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name,
          emailVerified: data.user.email_confirmed_at ? true : false,
        },
      },
      error: null,
    }
  }

  /**
   * 登出
   */
  async signOut(token: string): Promise<{ error: string | null }> {
    const { error } = await this.client.auth.admin.signOut(token)
    return { error: error?.message || null }
  }

  /**
   * 获取当前用户
   */
  async getUser(token: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await this.client.auth.getUser(token)

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: '用户不存在' }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        emailVerified: data.user.email_confirmed_at ? true : false,
      },
      error: null,
    }
  }

  /**
   * 验证会话
   */
  async verifySession(token: string): Promise<{ valid: boolean; user: AuthUser | null }> {
    const { user, error } = await this.getUser(token)
    return { valid: !error && !!user, user }
  }
}

/**
 * 创建认证服务实例
 */
export function createAuthService(env: Env): AuthService {
  return new AuthService(env)
}