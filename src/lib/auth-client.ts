/**
 * Better Auth 客户端
 * 用于 Web 前端认证操作
 * 
 * @see https://www.better-auth.com/docs/client
 */

import { createAuthClient } from "better-auth/react"

/**
 * Better Auth 客户端实例
 * 自动从当前页面 URL 获取 baseURL
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' 
    ? window.location.origin 
    : '',
})

// 导出常用方法
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient

/**
 * 登录状态 Hook
 * @returns 用户会话信息
 */
export function useAuth() {
  const { data: session, isPending, error } = useSession()
  
  return {
    user: session?.user,
    session: session?.session,
    isPending,
    isAuthenticated: !!session?.user,
    error,
  }
}

/**
 * 邮箱密码登录
 */
export async function loginWithEmail(email: string, password: string) {
  try {
    const result = await signIn.email({
      email,
      password,
    })
    
    return {
      success: !result.error,
      user: result.data?.user,
      error: result.error?.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '登录失败',
    }
  }
}

/**
 * 邮箱密码注册
 */
export async function registerWithEmail(
  email: string, 
  password: string, 
  name?: string
) {
  try {
    const result = await signUp.email({
      email,
      password,
      name,
    })
    
    return {
      success: !result.error,
      user: result.data?.user,
      error: result.error?.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '注册失败',
    }
  }
}

/**
 * 退出登录
 */
export async function logout() {
  try {
    await signOut()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '退出失败',
    }
  }
}

/**
 * Telegram 登录（Mini App）
 * 通过 initData 验证用户身份
 */
export async function loginWithTelegram(initData: string) {
  try {
    // 调用自定义 Telegram 认证端点
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    })
    
    const result = await response.json()
    
    return {
      success: response.ok,
      user: result.user,
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Telegram 登录失败',
    }
  }
}