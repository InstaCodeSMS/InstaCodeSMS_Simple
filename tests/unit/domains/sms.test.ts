/**
 * 短信领域单元测试
 */

import { describe, it, expect } from 'vitest'
import { SmsStatus, GetSmsCodeSchema, VerifySmsCodeSchema } from '@/domains/sms/sms.schema'

describe('SMS Domain', () => {
  describe('SmsStatus', () => {
    it('应该定义短信状态', () => {
      expect(SmsStatus.PENDING).toBe('pending')
      expect(SmsStatus.SUCCESS).toBe('success')
      expect(SmsStatus.EXPIRED).toBe('expired')
      expect(SmsStatus.ERROR).toBe('error')
    })
  })

  describe('GetSmsCodeSchema', () => {
    it('应该验证有效的获取验证码请求', () => {
      const validRequest = {
        ordernum: 'order-123',
      }

      const result = GetSmsCodeSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('应该拒绝空订单号', () => {
      const invalidRequest = {
        ordernum: '',
      }

      const result = GetSmsCodeSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('VerifySmsCodeSchema', () => {
    it('应该验证有效的验证码验证请求', () => {
      const validRequest = {
        ordernum: 'order-123',
        code: '123456',
      }

      const result = VerifySmsCodeSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('应该拒绝空验证码', () => {
      const invalidRequest = {
        ordernum: 'order-123',
        code: '',
      }

      const result = VerifySmsCodeSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })
})
