/**
 * 统一错误处理模块
 * 所有应用错误必须继承 AppError
 */

export enum ErrorCode {
  // 4xx - 客户端错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // 5xx - 服务端错误
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  UPSTREAM_TIMEOUT = 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
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
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(ErrorCode.NOT_FOUND, `${resource}不存在`, 404)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.UPSTREAM_ERROR, message, 502, details)
    this.name = 'UpstreamError'
  }
}

export class InternalError extends AppError {
  constructor(message: string = '服务器内部错误', details?: unknown) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, details)
    this.name = 'InternalError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
