/**
 * 全局错误处理中间件
 * 分级异常处理：区分客户端错误、上游错误、内部错误
 */

import { Context } from 'hono'
import {
  AppError,
  ErrorCode,
  isAppError,
  isTimeoutError,
  isConnectionError,
} from '../types/errors'

/**
 * 错误响应格式
 */
interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    requestId?: string
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
 * 获取 HTTP 状态码
 */
function getStatusCode(err: Error): number {
  if (isAppError(err)) {
    return err.statusCode
  }

  // 超时错误 -> 504
  if (isTimeoutError(err)) {
    return 504
  }

  // 连接错误 -> 503
  if (isConnectionError(err)) {
    return 503
  }

  // 默认 500
  return 500
}

/**
 * 构建错误响应
 */
function buildErrorResponse(err: Error, requestId?: string): ErrorResponse {
  // AppError 处理
  if (isAppError(err)) {
    return {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    }
  }

  // 超时错误
  if (isTimeoutError(err)) {
    return {
      success: false,
      error: {
        code: ErrorCode.UPSTREAM_TIMEOUT,
        message: '上游服务响应超时，请稍后重试',
        requestId,
      },
    }
  }

  // 连接错误
  if (isConnectionError(err)) {
    return {
      success: false,
      error: {
        code: ErrorCode.UPSTREAM_UNAVAILABLE,
        message: '上游服务暂时不可用，请稍后重试',
        details: { reason: err.message },
        requestId,
      },
    }
  }

  // Zod 校验错误
  if (err.name === 'ZodError') {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: '参数校验失败',
        details: (err as any).errors,
        requestId,
      },
    }
  }

  // 未知错误 - 隐藏内部细节
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: '服务器内部错误',
      requestId,
    },
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
 * 404 处理中间件
 */
export function notFoundHandler(c: Context): Response {
  const requestId = c.get('requestId') as string | undefined

  return c.json(
    {
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: '请求的资源不存在',
        requestId,
      },
    },
    404
  )
}