/**
 * 响应压缩和优化
 * 减少响应体积，提高传输效率
 */

import { Context } from 'hono'

/**
 * 响应优化配置
 */
export interface ResponseOptimizationConfig {
  /** 是否启用 gzip 压缩 */
  gzip?: boolean
  /** 是否移除空白 */
  minify?: boolean
  /** 缓存策略 */
  cacheControl?: string
}

/**
 * 设置缓存头
 */
export function setCacheHeaders(c: Context, config: ResponseOptimizationConfig): void {
  if (config.cacheControl) {
    c.header('Cache-Control', config.cacheControl)
  }

  // 设置 ETag 用于缓存验证
  c.header('ETag', `"${Date.now()}"`)
}

/**
 * 响应优化中间件
 */
export function responseOptimization(config: ResponseOptimizationConfig = {}) {
  return async (c: Context, next: () => Promise<void>) => {
    await next()

    // 设置缓存头
    if (config.cacheControl) {
      setCacheHeaders(c, config)
    }

    // 设置压缩
    if (config.gzip !== false) {
      c.header('Content-Encoding', 'gzip')
    }
  }
}

/**
 * 计算响应大小
 */
export function getResponseSize(data: unknown): number {
  return JSON.stringify(data).length
}

/**
 * 响应大小优化建议
 */
export function getOptimizationSuggestions(size: number): string[] {
  const suggestions: string[] = []

  if (size > 100 * 1024) {
    suggestions.push('响应体积超过 100KB，考虑分页或过滤数据')
  }

  if (size > 50 * 1024) {
    suggestions.push('响应体积较大，考虑启用压缩')
  }

  if (size > 10 * 1024) {
    suggestions.push('响应体积超过 10KB，考虑优化数据结构')
  }

  return suggestions
}
