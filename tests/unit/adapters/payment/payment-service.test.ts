/**
 * 支付流程集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PaymentService } from '../../../domains/payment/payment.service'
import { paymentRegistry } from '../registry'
import type { PaymentStrategy } from '../strategy'
import type { Env } from '../../../types/env'

// Mock 支付策略
class TestPaymentStrategy implements PaymentStrategy {
  name = 'test'

  async createPayment(input: any, baseUrl: string) {
    return {
      trade_id: `test-${Date.now()}`,
      payment_url: `${baseUrl}/pay`,
      actual_amount: String(input.amount),
    }
  }

  verifyCallback(data: unknown): boolean {
    return true
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    // Mock implementation
  }
}

describe('PaymentService with Registry', () => {
  let paymentService: PaymentService
  let mockDb: SupabaseClient
  let mockEnv: Env

  beforeEach(() => {
    // 注册测试策略
    paymentRegistry.register('test', new TestPaymentStrategy())

    // Mock 环境变量
    mockEnv = {
      API_BASE_URL: 'https://example.com',
    } as Env

    // Mock 数据库
    mockDb = {} as SupabaseClient

    paymentService = new PaymentService(mockDb, mockEnv)
  })

  it('应该能使用注册的策略创建支付订单', async () => {
    const result = await paymentService.createPayment({
      order_id: 'ORD123',
      amount: 100,
      payment_method: 'test',
      product_info: {
        service_id: 1,
        title: 'Test Product',
        quantity: 1,
        expiry: 0,
        expiry_days: '30',
        unit_price: 100,
      },
    })

    expect(result.trade_id).toBeDefined()
    expect(result.payment_url).toBe('https://example.com/pay')
    expect(result.actual_amount).toBe('100')
  })

  it('使用不存在的支付方式应该抛出错误', async () => {
    await expect(
      paymentService.createPayment({
        order_id: 'ORD123',
        amount: 100,
        payment_method: 'nonexistent',
        product_info: {
          service_id: 1,
          title: 'Test Product',
          quantity: 1,
          expiry: 0,
          expiry_days: '30',
          unit_price: 100,
        },
      })
    ).rejects.toThrow('不支持的支付方式')
  })

  it('缺少 API_BASE_URL 应该抛出错误', async () => {
    const serviceWithoutUrl = new PaymentService(mockDb, {} as Env)

    await expect(
      serviceWithoutUrl.createPayment({
        order_id: 'ORD123',
        amount: 100,
        payment_method: 'test',
        product_info: {
          service_id: 1,
          title: 'Test Product',
          quantity: 1,
          expiry: 0,
          expiry_days: '30',
          unit_price: 100,
        },
      })
    ).rejects.toThrow('缺少环境变量：API_BASE_URL')
  })
})
