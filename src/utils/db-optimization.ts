/**
 * 数据库查询优化
 * 实现批量查询、连接池等优化策略
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 批量查询优化
 * 避免 N+1 查询问题
 */
export class BatchQueryOptimizer {
  /**
   * 批量获取订单
   */
  static async getOrdersByIds(
    client: SupabaseClient,
    orderIds: string[]
  ): Promise<Record<string, unknown>[]> {
    if (orderIds.length === 0) {
      return []
    }

    const { data, error } = await client
      .from('payment_orders')
      .select('*')
      .in('order_id', orderIds)

    if (error) {
      throw new Error(`批量查询订单失败: ${error.message}`)
    }

    return data || []
  }

  /**
   * 批量获取产品
   */
  static async getProductsByIds(
    client: SupabaseClient,
    productIds: number[]
  ): Promise<Record<string, unknown>[]> {
    if (productIds.length === 0) {
      return []
    }

    const { data, error } = await client
      .from('products')
      .select('*')
      .in('id', productIds)

    if (error) {
      throw new Error(`批量查询产品失败: ${error.message}`)
    }

    return data || []
  }
}

/**
 * 查询性能分析
 */
export class QueryPerformanceAnalyzer {
  private metrics = new Map<string, { count: number; totalTime: number }>()

  /**
   * 记录查询
   */
  recordQuery(name: string, duration: number): void {
    const existing = this.metrics.get(name) || { count: 0, totalTime: 0 }
    this.metrics.set(name, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): Record<string, { count: number; avgTime: number }> {
    const stats: Record<string, { count: number; avgTime: number }> = {}

    for (const [name, metric] of this.metrics) {
      stats[name] = {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
      }
    }

    return stats
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.metrics.clear()
  }
}

// 全局性能分析器
export const queryAnalyzer = new QueryPerformanceAnalyzer()

/**
 * 执行并分析查询
 */
export async function executeWithAnalytics<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    return await fn()
  } finally {
    const duration = Date.now() - startTime
    queryAnalyzer.recordQuery(name, duration)

    // 记录慢查询
    if (duration > 1000) {
      console.warn(`[慢查询] ${name}: ${duration}ms`)
    }
  }
}
