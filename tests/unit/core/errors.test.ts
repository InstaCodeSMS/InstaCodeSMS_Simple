/**
 * 错误处理单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  ErrorCode,
  isAppError,
} from '@/core/errors'

describe('Error Handling', () => {
  describe('AppError', () => {
    it('应该创建AppError实例', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, '测试错误', 500)
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(error.message).toBe('测试错误')
      expect(error.statusCode).toBe(500)
    })

    it('应该转换为JSON', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, '参数错误', 400, { field: 'name' })
      const json = error.toJSON()
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(json.message).toBe('参数错误')
      expect(json.details).toEqual({ field: 'name' })
    })
  })

  describe('ValidationError', () => {
    it('应该创建ValidationError实例', () => {
      const error = new ValidationError('字段验证失败', { field: 'email' })
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
    })
  })

  describe('NotFoundError', () => {
    it('应该创建NotFoundError实例', () => {
      const error = new NotFoundError('用户')
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.statusCode).toBe(404)
      expect(error.message).toContain('用户')
    })
  })

  describe('isAppError', () => {
    it('应该识别AppError实例', () => {
      const appError = new AppError(ErrorCode.INTERNAL_ERROR, '错误')
      const regularError = new Error('普通错误')

      expect(isAppError(appError)).toBe(true)
      expect(isAppError(regularError)).toBe(false)
      expect(isAppError('not an error')).toBe(false)
    })
  })
})
