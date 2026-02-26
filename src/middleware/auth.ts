/**
 * 认证中间件
 * 处理 API 密钥验证、会话管理等认证逻辑
 */

import { Context, Next } from 'hono'
import { logUserId } from './logger'

/**
 * 认证上下文
 */
export interface AuthContext {
  userId?: string
  apiKey?: string
  isAuthenticated: boolean
}

/**
 * API 密钥验证中间件
 * 用于保护 API 端点
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('x-api-key') || c.req.query('api_key')

  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少 API 密钥',
        },
      },
      401
    )
  }

  // 验证 API 密钥（这里应该从数据库或环境变量验证）
  // TODO: 实现实际的 API 密钥验证逻辑
  if (!isValidApiKey(apiKey)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'API 密钥无效',
        },
      },
      401
    )
  }

  // 设置认证信息到 context
  c.set('auth', {
    apiKey,
    isAuthenticated: true,
  } as AuthContext)

  logUserId(c, `api-key-${apiKey.substring(0, 8)}`)

  await next()
}

/**
 * 可选认证中间件
 * 如果提供了认证信息则验证，否则允许继续
 */
export async function optionalAuth(c: Context, next: Next) {
  const apiKey = c.req.header('x-api-key') || c.req.query('api_key')

  if (apiKey && isValidApiKey(apiKey)) {
    c.set('auth', {
      apiKey,
      isAuthenticated: true,
    } as AuthContext)
    logUserId(c, `api-key-${apiKey.substring(0, 8)}`)
  } else {
    c.set('auth', {
      isAuthenticated: false,
    } as AuthContext)
  }

  await next()
}

/**
 * 验证 API 密钥
 * TODO: 实现实际的验证逻辑
 */
function isValidApiKey(apiKey: string): boolean {
  // 临时实现：检查密钥格式
  // 生产环境应该从数据库或密钥管理服务验证
  if (!apiKey || apiKey.length < 32) {
    return false
  }

  // 这里应该调用数据库或密钥管理服务
  // const isValid = await validateApiKeyFromDatabase(apiKey)
  // return isValid

  // 临时允许所有格式正确的密钥
  return true
}

/**
 * 获取认证信息
 */
export function getAuth(c: Context): AuthContext {
  return c.get('auth') || { isAuthenticated: false }
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(c: Context): boolean {
  const auth = getAuth(c)
  return auth.isAuthenticated
}
