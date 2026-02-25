/**
 * 同步 API 路由
 * 提供上游产品同步功能
 */

import { Hono } from 'hono'
import { ProductService } from '../../domains/product/product.service'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/sync/upstream
 * 同步上游产品到 Supabase
 */
app.post('/upstream', async (c) => {
  try {
    const service = new ProductService(c.env)
    const result = await service.syncUpstreamProducts()

    return c.json<ApiResponse>({
      success: result.success,
      message: result.message,
      data: result,
    }, result.success ? 200 : 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步失败'
    return c.json<ApiResponse>(
      {
        success: false,
        message,
      },
      500
    )
  }
})

/**
 * GET /api/sync/status
 * 获取同步状态
 */
app.get('/status', async (c) => {
  try {
    const service = new ProductService(c.env)
    const status = await service.getSyncStatus()

    return c.json<ApiResponse>({
      success: true,
      message: '获取同步状态成功',
      data: status,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取状态失败'
    return c.json<ApiResponse>(
      {
        success: false,
        message,
      },
      500
    )
  }
})

export default app