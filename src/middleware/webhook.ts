/**
 * Webhook 中间件
 * 提供 IP 白名单验证、Secret Token 验证等通用功能
 */

import { Context, Next } from 'hono'
import type { Env } from '../types/env'

/**
 * IP 白名单配置
 * Telegram 官方 IP 段
 */
export const TELEGRAM_IP_RANGES = [
  '149.154.160.0/22',
  '91.108.4.0/22',
  '91.108.56.0/22',
  '109.239.140.0/24',
  '149.154.164.0/22',
  '149.154.168.0/22'
]

/**
 * 将 IP 地址转换为数字
 */
function ipToNumber(ip: string): number {
  const [a, b, c, d] = ip.split('.').map(Number)
  return ((a << 24) + (b << 16) + (c << 8) + d) >>> 0
}

/**
 * 检查 IP 是否在指定范围内
 */
function isIpInRange(ip: string, range: string): boolean {
  const [rangeIp, bits] = range.split('/')
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(rangeIp)
  const mask = -1 << (32 - parseInt(bits))
  return (ipNum & mask) === (rangeNum & mask)
}

/**
 * 检查 IP 是否在白名单中
 */
export function isIpInWhitelist(ip: string | undefined, allowedRanges: string[]): boolean {
  if (!ip) return false
  return allowedRanges.some(range => isIpInRange(ip, range))
}

/**
 * Webhook 日志上下文
 */
export interface WebhookLogContext {
  timestamp: string
  webhookType: string
  ip: string | undefined
  country: string | undefined
  method: string
  path: string
  duration?: number
  status?: number
  error?: string
}

/**
 * 创建日志上下文
 */
export function createLogContext(c: Context, webhookType: string): WebhookLogContext {
  return {
    timestamp: new Date().toISOString(),
    webhookType,
    ip: c.req.header('cf-connecting-ip'),
    country: c.req.header('cf-ipcountry'),
    method: c.req.method,
    path: c.req.path,
  }
}

/**
 * Webhook 请求日志中间件
 */
export function webhookLogger(webhookType: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const startTime = Date.now()
    const logCtx = createLogContext(c, webhookType)

    console.log(`[Webhook/${webhookType}] 请求开始`, logCtx)

    await next()

    console.log(`[Webhook/${webhookType}] 请求完成`, {
      ...logCtx,
      status: c.res.status,
      duration: Date.now() - startTime,
    })
  }
}

/**
 * IP 白名单验证中间件
 */
export function ipWhitelistGuard(allowedRanges: string[], webhookType: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const clientIp = c.req.header('cf-connecting-ip')

    if (!isIpInWhitelist(clientIp, allowedRanges)) {
      console.warn(`[Webhook/${webhookType}] IP 不在白名单`, {
        ip: clientIp,
        allowedRanges,
      })
      return c.json({ ok: false, error: 'Forbidden' }, 403)
    }

    await next()
  }
}

/**
 * Secret Token 验证中间件
 */
export function secretTokenGuard(headerName: string, envKey: keyof Env, webhookType: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const providedToken = c.req.header(headerName)
    const expectedToken = c.env[envKey] as string | undefined

    // 如果没有配置 token，跳过验证但记录警告
    if (!expectedToken) {
      console.warn(`[Webhook/${webhookType}] 未配置 ${envKey}，建议启用以增强安全性`)
      return next()
    }

    if (!providedToken || providedToken !== expectedToken) {
      console.warn(`[Webhook/${webhookType}] Token 验证失败`, {
        hasToken: !!providedToken,
        expectedLength: expectedToken.length,
        providedLength: providedToken?.length || 0,
      })
      return c.json({ ok: false, error: 'Unauthorized' }, 401)
    }

    await next()
  }
}

/**
 * 组合中间件：Telegram Webhook 完整防护
 */
export function telegramWebhookGuard() {
  return [
    webhookLogger('telegram'),
    ipWhitelistGuard(TELEGRAM_IP_RANGES, 'telegram'),
    secretTokenGuard('X-Telegram-Bot-Api-Secret-Token', 'TELEGRAM_WEBHOOK_SECRET', 'telegram'),
  ]
}

/**
 * 组合中间件：支付回调 Webhook 防护
 * 支付回调依赖签名验证，不需要 IP 白名单
 */
export function paymentWebhookGuard(paymentType: string) {
  return [
    webhookLogger(`payment/${paymentType}`),
  ]
}