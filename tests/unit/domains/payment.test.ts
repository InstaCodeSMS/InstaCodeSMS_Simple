/**
 * 支付领域单元测试
 */

import { describe, it, expect } from 'vitest'
import { PaymentMethod, PaymentStatus, CreatePaymentSchema } from '@/domains/payment/payment.schema'

describe('Payment Domain', () => {
  describe('PaymentMethod', () => {
    it('应该定义支付方式', () => {
      expect(PaymentMethod.ALIPAY).toBe('alipay')
      expect(PaymentMethod.USDT).toBe('usdt')
    })
  })

  describe('PaymentStatus', () => {
    it('应该定义支付状态', () => {
      expect(PaymentStatus.PENDING).toBe(1)
      expect(PaymentStatus.PAID).toBe(2)
      expect(PaymentStatus.TIMEOUT).toBe(3)
      expect(PaymentStatus.CANCELLED).toBe(4)
    })
  })

  describe('CreatePaymentSchema', () => {
    it('应该验证有效的支付请求', () => {
      const validPayment = {
        order_id: 'order-123',
        amount: 99.99,
        payment_method: 'alipay',
        product_info: {
          service_id: 1,
          title: '测试服务',
          quantity: 1,
          expiry: 0,
          expiry_days: '永久',
          unit_price: 99.99,
        },
      }

      const result = CreatePaymentSchema.safeParse(validPayment)
      expect(result.success).toBe(true)
    })

    it('应该拒绝无效的支付方式', () => {
      const invalidPayment = {
        order_id: 'order-123',
        amount: 99.99,
        payment_method: 'invalid',
        product_info: {
          service_id: 1,
          title: '测试服务',
          quantity: 1,
          expiry: 0,
          expiry_days: '永久',
          unit_price: 99.99,
        },
      }

      const result = CreatePaymentSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('应该拒绝无效的金额', () => {
      const invalidPayment = {
        order_id: 'order-123',
        amount: -10,
        payment_method: 'alipay',
        product_info: {
          service_id: 1,
          title: '测试服务',
          quantity: 1,
          expiry: 0,
          expiry_days: '永久',
          unit_price: 99.99,
        },
      }

      const result = CreatePaymentSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })
  })
})
