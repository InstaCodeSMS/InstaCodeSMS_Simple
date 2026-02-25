/**
 * 请求日志中间件
 * 功能：生成 request-id，记录请求/响应信息，提供可观测性
 */

import { Context, Next } from 'hono'
import { nanoid } from 'nanoid'

/**
 * 日志条目接口
 */
interface LogEntry {
  requestId: string
  method: string
  path: string
  query: string
  ip: string
  userAgent: string
  referer: string
  userId?: string
  duration: number
  statusCode: number
  contentLength: number
  upstreamStatus?: number
  timestamp: string
}

/**
 * 请求日志中间件
 * 为每个请求生成唯一 ID 并记录结构化日志
 */
export async function requestLogger(c: Context, next: Next) {
  const requestId = c.req.header('x-request-id') || nanoid(12)
  const startTime = Date.now()

  // 设置 request-id 到 context
  c.set('requestId', requestId)

  // 获取请求信息
  const requestInfo = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    ip: getClientIp(c),
    userAgent: c.req.header('user-agent') || 'unknown',
    referer: c.req.header('referer') || '',
  }

  try {
    await next()
  } finally {
    // 记录响应信息
    const duration = Date.now() - startTime
    const logEntry: LogEntry = {
      ...requestInfo,
      query: JSON.stringify(requestInfo.query),
      duration,
      statusCode: c.res.status,
      contentLength: parseInt(c.res.headers.get('content-length') || '0'),
      upstreamStatus: c.get('upstreamStatus'),
      userId: c.get('userId'),
      timestamp: new Date().toISOString(),
    }

    // 设置响应头
    c.res.headers.set('X-Request-ID', requestId)
    c.res.headers.set('X-Response-Time', `${duration}ms`)

    // 结构化日志输出
    const logLevel = c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info'
    const logString = JSON.stringify(logEntry)

    if (logLevel === 'error') {
      console.error(logString)
    } else if (logLevel === 'warn') {
      console.warn(logString)
    } else {
      console.log(logString)
    }
  }
}

/**
 * 获取客户端真实 IP
 */
function getClientIp(c: Context): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  )
}

/**
 * 记录上游请求状态（供其他中间件调用）
 */
export function logUpstreamStatus(c: Context, status: number) {
  c.set('upstreamStatus', status)
}

/**
 * 记录用户 ID（供认证中间件调用）
 */
export function logUserId(c: Context, userId: string) {
  c.set('userId', userId)
}