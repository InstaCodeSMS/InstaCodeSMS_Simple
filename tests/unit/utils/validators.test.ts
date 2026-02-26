/**
 * 验证函数单元测试
 */

import { describe, it, expect } from 'vitest'
import { validateOrderInput, validatePaymentInput, validatePhoneNumber, validateEmail, validateUrl } from '@/utils/validators'

describe('Validators', () => {
  describe('validateOrderInput', () => {
    it('应该验证有效的订单输入', () => {
      const validInput = {
        app_id: 123,
        num: 5,
        type: 1,
        expiry: 0,
      }
      expect(() => validateOrderInput(validInput)).not.toThrow()
    })

    it('应该拒绝无效的app_id', () => {
      const invalidInput = {
        app_id: -1,
        num: 5,
      }
      expect(() => validateOrderInput(invalidInput)).toThrow()
    })

    it('应该拒绝无效的num', () => {
      const invalidInput = {
        app_id: 123,
        num: 0,
      }
      expect(() => validateOrderInput(invalidInput)).toThrow()
    })
  })

  describe('validatePaymentInput', () => {
    it('应该验证有效的支付输入', () => {
      const validInput = {
        order_id: 'order-123',
        amount: 99.99,
        method: 'alipay',
      }
      expect(() => validatePaymentInput(validInput)).not.toThrow()
    })

    it('应该拒绝无效的金额', () => {
      const invalidInput = {
        order_id: 'order-123',
        amount: -10,
        method: 'alipay',
      }
      expect(() => validatePaymentInput(invalidInput)).toThrow()
    })

    it('应该拒绝无效的支付方式', () => {
      const invalidInput = {
        order_id: 'order-123',
        amount: 99.99,
        method: 'invalid',
      }
      expect(() => validatePaymentInput(invalidInput)).toThrow()
    })
  })

  describe('validatePhoneNumber', () => {
    it('应该验证有效的电话号码', () => {
      expect(validatePhoneNumber('+86 13800138000')).toBe(true)
      expect(validatePhoneNumber('13800138000')).toBe(true)
      expect(validatePhoneNumber('+1-555-123-4567')).toBe(true)
    })

    it('应该拒绝无效的电话号码', () => {
      expect(validatePhoneNumber('abc')).toBe(false)
      expect(validatePhoneNumber('')).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('应该验证有效的邮箱', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.uk')).toBe(true)
    })

    it('应该拒绝无效的邮箱', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('validateUrl', () => {
    it('应该验证有效的URL', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
    })

    it('应该拒绝无效的URL', () => {
      expect(validateUrl('not a url')).toBe(false)
      expect(validateUrl('example.com')).toBe(false)
    })
  })
})
