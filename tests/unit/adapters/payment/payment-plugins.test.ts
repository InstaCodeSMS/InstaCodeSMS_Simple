/**
 * 支付插件集成测试
 * 验证所有支付策略是否正确注册和工作
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { paymentRegistry } from '../../src/adapters/payment/registry'
import { initializePaymentStrategies } from '../../src/adapters/payment/init'

describe('Payment Plugins Integration', () => {
  const mockEnv = {
    API_BASE_URL: 'https://example.com',
    ALIMPAY_API_URL: 'https://alimpay.example.com',
    ALIMPAY_PID: 'test-pid',
    ALIMPAY_KEY: 'test-key',
    BEPUSDT_API_URL: 'https://bepusdt.example.com',
    BEPUSDT_API_TOKEN: 'test-token',
    EPAY_API_URL: 'https://epay.example.com',
    EPAY_PID: 'test-pid',
    EPAY_KEY: 'test-key',
    TOKENPAY_API_URL: 'https://tokenpay.example.com',
    TOKENPAY_MERCHANT_ID: 'test-merchant',
    TOKENPAY_API_KEY: 'test-key',
    PAYPAL_CLIENT_ID: 'test-client',
    PAYPAL_CLIENT_SECRET: 'test-secret',
    STRIPE_SECRET_KEY: 'test-secret',
    STRIPE_PUBLISHABLE_KEY: 'test-publishable',
    WECHATPAY_MERCHANT_ID: 'test-merchant',
    WECHATPAY_API_V3_KEY: 'test-key',
    WECHATPAY_PRIVATE_KEY: 'test-private-key',
  } as any

  const mockDb = {} as any

  beforeEach(() => {
    // Initialize all payment strategies
    initializePaymentStrategies(mockEnv, mockDb)
  })

  it('should register all 7 payment methods', () => {
    const expectedMethods = ['alipay', 'usdt', 'epay', 'tokenpay', 'paypal', 'stripe', 'wechatpay']

    for (const method of expectedMethods) {
      expect(paymentRegistry.has(method)).toBe(true)
    }
  })

  it('should retrieve all registered payment strategies', () => {
    const expectedMethods = ['alipay', 'usdt', 'epay', 'tokenpay', 'paypal', 'stripe', 'wechatpay']

    for (const method of expectedMethods) {
      const strategy = paymentRegistry.get(method)
      expect(strategy).toBeDefined()
      expect(strategy.name).toBe(method)
    }
  })

  it('should have all required methods in each strategy', () => {
    const expectedMethods = ['alipay', 'usdt', 'epay', 'tokenpay', 'paypal', 'stripe', 'wechatpay']

    for (const method of expectedMethods) {
      const strategy = paymentRegistry.get(method)
      expect(typeof strategy.createPayment).toBe('function')
      expect(typeof strategy.verifyCallback).toBe('function')
      expect(typeof strategy.markAsPaid).toBe('function')
    }
  })

  it('should throw error for non-existent payment method', () => {
    expect(() => {
      paymentRegistry.get('nonexistent')
    }).toThrow()
  })

  it('should return all 7 registered strategies', () => {
    const allStrategies = paymentRegistry.getAll()
    expect(allStrategies.size).toBe(7)
  })
})
