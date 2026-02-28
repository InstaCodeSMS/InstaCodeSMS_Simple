/**
 * 支付策略注册表
 * 管理所有支付方式的注册和获取
 */

import type { PaymentStrategy } from './strategy'

class PaymentRegistry {
  private strategies = new Map<string, PaymentStrategy>()

  register(method: string, strategy: PaymentStrategy): void {
    this.strategies.set(method, strategy)
  }

  get(method: string): PaymentStrategy {
    const strategy = this.strategies.get(method)
    if (!strategy) {
      throw new Error(`不支持的支付方式: ${method}`)
    }
    return strategy
  }

  has(method: string): boolean {
    return this.strategies.has(method)
  }

  getAll(): Map<string, PaymentStrategy> {
    return new Map(this.strategies)
  }
}

export const paymentRegistry = new PaymentRegistry()
