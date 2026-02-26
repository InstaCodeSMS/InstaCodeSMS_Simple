/**
 * 改进的错误处理中间件
 * 支持 AppError、Zod 验证错误、上游错误等
 */

import { Context } from 'hono'
import { AppError, isAppError } from '../core/errors'
import { ZodError } from 'zod'

/**
 * 错误响应格式
 */
interface ErrorResponse {
  success: false
  message: string
  code?: string
  details?: unknown
  requestId?: string
}

/**
 * 获取 HTTP 状态码
 */
function getStatusCode(err: Error): number {
  if (err instanceof AppError) {
    return err.statusCode
  }

  if (err instanceof ZodError) {
    return 400
  }

  // 检查错误消息中的特定模式
  const message = err.message || ''

  if (message.includes('timeout') || message.includes('超时')) {
    return 504
  }

  if (message.includes('connection') || message.includes('连接')) {
    return 503
  }

  return 500
}

/**
 * 构建错误响应
 */
function buildErrorResponse(err: Error, requestId?: string): ErrorResponse {
  // AppError 处理
  if (err instanceof AppError) {
    return {
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      requestId,
    }
  }

  // Zod 验证错误
  if (err instanceof ZodError) {
    return {
      success: false,
      message: '参数验证失败',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
      requestId,
    }
  }

  // 超时错误
  if (err.message.includes('timeout') || err.message.includes('超时')) {
    return {
      success: false,
      message: '请求超时，请稍后重试',
      code: 'TIMEOUT_ERROR',
      requestId,
    }
  }

  // 连接错误
  if (err.message.includes('connection') || err.message.includes('连接')) {
    return {
      success: false,
      message: '服务暂时不可用，请稍后重试',
      code: 'CONNECTION_ERROR',
      requestId,
    }
  }

  // 未知错误 - 隐藏内部细节
  return {
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    requestId,
  }
}

/**
 * 记录错误日志
 */
function logError(err: Error, requestId: string | undefined, statusCode: number): void {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    statusCode,
  }

  // 5xx 错误使用 error 级别
  if (statusCode >= 500) {
    console.error(JSON.stringify(logData))
  } else if (statusCode >= 400) {
    console.warn(JSON.stringify(logData))
  } else {
    console.log(JSON.stringify(logData))
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') as string | undefined
  const statusCode = getStatusCode(err)
  const errorResponse = buildErrorResponse(err, requestId)

  // 设置响应头
  if (requestId) {
    c.header('X-Request-ID', requestId)
  }

  // 记录错误日志
  logError(err, requestId, statusCode)

  return c.json(errorResponse, statusCode as any)
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(c: Context): Response {
  const requestId = c.get('requestId') as string | undefined

  return c.json(
    {
      success: false,
      message: '请求的资源不存在',
      code: 'NOT_FOUND',
      requestId,
    },
    404
  )
}
