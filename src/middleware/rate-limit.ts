/**
 * 速率限制中间件
 * 防止 API 滥用和 DDoS 攻击
 */

import { Context, Next } from 'hono'

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number
  /** 时间窗口内允许的最大请求数 */
  maxRequests: number
  /** 是否跳过成功的请求 */
  skipSuccessfulRequests?: boolean
  /** 是否跳过失败的请求 */
  skipFailedRequests?: boolean
}

/**
 * 内存中的速率限制存储
 * 生产环境应该使用 Redis 或 Cloudflare KV
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  /**
   * 检查是否超过限制
   */
  isLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // 创建新的计数器
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return false
    }

    // 增加计数
    entry.count++

    // 检查是否超过限制
    return entry.count > config.maxRequests
  }

  /**
   * 获取剩余请求数
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.store.get(key)

    if (!entry) {
      return config.maxRequests
    }

    return Math.max(0, config.maxRequests - entry.count)
  }

  /**
   * 获取重置时间
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key)
    return entry?.resetTime || 0
  }
}

// 全局速率限制存储
const rateLimitStore = new RateLimitStore()

/**
 * 获取客户端标识
 */
function getClientKey(c: Context): string {
  // 优先使用用户 ID
  const userId = c.get('userId')
  if (userId) {
    return `user:${userId}`
  }

  // 其次使用 API 密钥
  const apiKey = c.req.header('x-api-key')
  if (apiKey) {
    return `api:${apiKey}`
  }

  // 最后使用 IP 地址
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'

  return `ip:${ip}`
}

/**
 * 通用速率限制中间件工厂
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const clientKey = getClientKey(c)

    // 检查是否超过限制
    if (rateLimitStore.isLimited(clientKey, config)) {
      const resetTime = rateLimitStore.getResetTime(clientKey)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      c.header('Retry-After', String(retryAfter))
      c.header('X-RateLimit-Limit', String(config.maxRequests))
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', String(resetTime))

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: '请求过于频繁，请稍后再试',
            retryAfter,
          },
        },
        429
      )
    }

    // 设置速率限制信息到响应头
    const remaining = rateLimitStore.getRemaining(clientKey, config)
    const resetTime = rateLimitStore.getResetTime(clientKey)

    c.header('X-RateLimit-Limit', String(config.maxRequests))
    c.header('X-RateLimit-Remaining', String(remaining))
    c.header('X-RateLimit-Reset', String(resetTime))

    await next()
  }
}

/**
 * API 端点速率限制（默认：每分钟 60 个请求）
 */
export const apiRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 60,
})

/**
 * 严格速率限制（每分钟 10 个请求）
 * 用于敏感操作如登录、支付等
 */
export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 10,
})

/**
 * 宽松速率限制（每分钟 200 个请求）
 * 用于高频操作如查询等
 */
export const relaxedRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 200,
})
