/**
 * 支付注册表测试
 */

import { describe, it, expect } from 'vitest'
import { paymentRegistry } from '../registry'
import type { PaymentStrategy } from '../strategy'

// Mock 策略
class MockStrategy implements PaymentStrategy {
  name = 'mock'

  async createPayment() {
    return {
      trade_id: 'test-123',
      actual_amount: '100',
    }
  }

  verifyCallback() {
    return true
  }

  async markAsPaid() {}
}

describe('PaymentRegistry', () => {
  it('应该能注册和获取支付策略', () => {
    const strategy = new MockStrategy()
    paymentRegistry.register('mock', strategy)

    const retrieved = paymentRegistry.get('mock')
    expect(retrieved).toBe(strategy)
  })

  it('获取不存在的策略应该抛出错误', () => {
    expect(() => paymentRegistry.get('nonexistent')).toThrow('不支持的支付方式')
  })

  it('应该能检查策略是否存在', () => {
    const strategy = new MockStrategy()
    paymentRegistry.register('test', strategy)

    expect(paymentRegistry.has('test')).toBe(true)
    expect(paymentRegistry.has('nonexistent')).toBe(false)
  })
})
