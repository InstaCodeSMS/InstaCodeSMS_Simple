/**
 * 错误类型定义
 * 分级异常处理：区分客户端错误、上游错误、内部错误
 */

/**
 * 错误码枚举
 */
export enum ErrorCode {
  // 4xx - 客户端错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',       // 400 - 参数校验失败
  NOT_FOUND = 'NOT_FOUND',                     // 404 - 资源不存在
  RATE_LIMITED = 'RATE_LIMITED',               // 429 - 请求过于频繁

  // 5xx - 服务端错误
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',           // 502 - 上游返回错误
  UPSTREAM_TIMEOUT = 'UPSTREAM_TIMEOUT',       // 504 - 上游超时
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE', // 503 - 上游不可用
  INTERNAL_ERROR = 'INTERNAL_ERROR',           // 500 - 内部错误
}

/**
 * 应用基础错误类
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * 参数校验错误
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(ErrorCode.NOT_FOUND, `${resource}不存在`, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * 限流错误
 */
export class RateLimitedError extends AppError {
  constructor(retryAfter: number) {
    super(
      ErrorCode.RATE_LIMITED,
      '请求过于频繁，请稍后重试',
      429,
      { retryAfter }
    )
    this.name = 'RateLimitedError'
  }
}

/**
 * 上游业务错误（上游返回 code != 1）
 */
export class UpstreamBusinessError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.UPSTREAM_ERROR, message, 502, details)
    this.name = 'UpstreamBusinessError'
  }
}

/**
 * 上游超时错误
 */
export class UpstreamTimeoutError extends AppError {
  constructor(timeout: number = 30000) {
    super(
      ErrorCode.UPSTREAM_TIMEOUT,
      '上游服务响应超时，请稍后重试',
      504,
      { timeout }
    )
    this.name = 'UpstreamTimeoutError'
  }
}

/**
 * 上游不可用错误（网络错误、连接失败）
 */
export class UpstreamUnavailableError extends AppError {
  constructor(reason?: string) {
    super(
      ErrorCode.UPSTREAM_UNAVAILABLE,
      '上游服务暂时不可用，请稍后重试',
      503,
      { reason }
    )
    this.name = 'UpstreamUnavailableError'
  }
}

/**
 * 内部错误
 */
export class InternalError extends AppError {
  constructor(message: string = '服务器内部错误', details?: unknown) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, details)
    this.name = 'InternalError'
  }
}

/**
 * 判断是否为 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * 判断是否为网络超时错误
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('etimedout') ||
      message.includes('econnreset')
    )
  }
  return false
}

/**
 * 判断是否为网络连接错误
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('fetch failed') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network')
    )
  }
  return false
}