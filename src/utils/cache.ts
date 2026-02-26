/**
 * 缓存工具
 * 实现内存缓存和 Cloudflare KV 缓存
 */

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存 TTL（秒） */
  ttl: number
  /** 是否使用 KV 存储 */
  useKV?: boolean
}

/**
 * 内存缓存存储
 */
class MemoryCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>()

  /**
   * 获取缓存
   */
  get(key: string): unknown | null {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * 设置缓存
   */
  set(key: string, value: unknown, ttl: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    })
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.store.size
  }
}

// 全局内存缓存实例
export const memoryCache = new MemoryCache()

/**
 * 缓存装饰器
 * 用于缓存函数结果
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: CacheConfig
): T {
  return (async (...args: unknown[]) => {
    // 生成缓存键
    const cacheKey = `${fn.name}:${JSON.stringify(args)}`

    // 尝试从缓存获取
    const cached = memoryCache.get(cacheKey)
    if (cached !== null) {
      return cached
    }

    // 执行函数
    const result = await fn(...args)

    // 存储到缓存
    memoryCache.set(cacheKey, result, config.ttl)

    return result
  }) as T
}

/**
 * 缓存键生成器
 */
export function generateCacheKey(prefix: string, ...parts: unknown[]): string {
  return `${prefix}:${parts.map((p) => String(p)).join(':')}`
}

/**
 * 缓存预热
 * 预加载常用数据到缓存
 */
export async function warmupCache(
  loader: () => Promise<Map<string, unknown>>,
  ttl: number
): Promise<void> {
  try {
    const data = await loader()
    for (const [key, value] of data) {
      memoryCache.set(key, value, ttl)
    }
  } catch (error) {
    console.error('缓存预热失败:', error)
  }
}
