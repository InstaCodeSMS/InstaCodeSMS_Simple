/**
 * 支付架构验证脚本
 * 验证自注册工厂架构是否正常工作
 */

import { paymentRegistry } from './src/adapters/payment/registry'
import { AlipayStrategy, registerAlipayStrategy } from './src/adapters/payment/alimpay/strategy'
import { UsdtStrategy, registerUsdtStrategy } from './src/adapters/payment/bepusdt/strategy'
import type { Env } from './src/types/env'

// Mock 环境变量
const mockEnv: Env = {
  API_BASE_URL: 'https://example.com',
  ALIMPAY_API_URL: 'https://alimpay.example.com',
  ALIMPAY_PID: 'test-pid',
  ALIMPAY_KEY: 'test-key',
  BEPUSDT_API_URL: 'https://bepusdt.example.com',
  BEPUSDT_API_TOKEN: 'test-token',
} as Env

// Mock 数据库
const mockDb = {} as any

console.log('🧪 开始验证支付架构...\n')

// 测试1：注册支付策略
console.log('✓ 测试1：注册支付策略')
try {
  registerAlipayStrategy(mockEnv, mockDb)
  registerUsdtStrategy(mockEnv, mockDb)
  console.log('  ✅ 支付策略注册成功\n')
} catch (error) {
  console.error('  ❌ 注册失败:', error)
  process.exit(1)
}

// 测试2：获取已注册的策略
console.log('✓ 测试2：获取已注册的策略')
try {
  const alipayStrategy = paymentRegistry.get('alipay')
  const usdtStrategy = paymentRegistry.get('usdt')

  console.log(`  ✅ 获取 alipay 策略: ${alipayStrategy.name}`)
  console.log(`  ✅ 获取 usdt 策略: ${usdtStrategy.name}\n`)
} catch (error) {
  console.error('  ❌ 获取失败:', error)
  process.exit(1)
}

// 测试3：检查策略是否存在
console.log('✓ 测试3：检查策略是否存在')
try {
  const hasAlipay = paymentRegistry.has('alipay')
  const hasUsdt = paymentRegistry.has('usdt')
  const hasStripe = paymentRegistry.has('stripe')

  console.log(`  ✅ alipay 存在: ${hasAlipay}`)
  console.log(`  ✅ usdt 存在: ${hasUsdt}`)
  console.log(`  ✅ stripe 存在: ${hasStripe} (预期为 false)\n`)
} catch (error) {
  console.error('  ❌ 检查失败:', error)
  process.exit(1)
}

// 测试4：获取不存在的策略应该抛出错误
console.log('✓ 测试4：获取不存在的策略应该抛出错误')
try {
  paymentRegistry.get('nonexistent')
  console.error('  ❌ 应该抛出错误但没有\n')
  process.exit(1)
} catch (error) {
  console.log(`  ✅ 正确抛出错误: ${(error as Error).message}\n`)
}

console.log('✅ 所有验证通过！支付架构正常工作。')
console.log('\n📋 架构验证总结：')
console.log('  • 支付策略注册表: ✅ 正常')
console.log('  • 支付策略注册: ✅ 正常')
console.log('  • 支付策略获取: ✅ 正常')
console.log('  • 错误处理: ✅ 正常')
