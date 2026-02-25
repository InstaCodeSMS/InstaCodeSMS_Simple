/**
 * 服务 API 路由
 * 提供产品列表查询功能
 * 数据来源：Supabase (products + upstream_products)
 */

import { Hono } from 'hono'
import { ProductService } from '../../domains/product/product.service'
import type { Env } from '../../types/env'
import type { ApiResponse, ServiceItem } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/services
 * 获取服务列表
 * 从 Supabase products 表获取，价格和库存来自关联的 upstream_products
 */
app.get('/', async (c) => {
  try {
    const service = new ProductService(c.env)
    const result = await service.getProductList()

    // 转换为前端兼容的 ServiceItem 格式
    const list: ServiceItem[] = result.list.map((item) => ({
      id: item.upstream_id ?? 0,           // 前端使用 upstream_id 作为产品标识
      cate_id: item.cate_id ?? 0,          // 分类 ID
      title: item.title,                   // 产品名称
      description: item.description,       // 产品描述
      sales_price: item.sales_price ?? 0,  // 起步价（展示用）
      num: item.num,                       // 实时库存
      expiry_options: item.expiry_pricing?.options ?? [],  // 有效期定价选项
    }))

    return c.json<ApiResponse<{ list: ServiceItem[]; total: number }>>({
      success: true,
      message: '获取服务列表成功',
      data: {
        list,
        total: result.total,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取服务列表失败'
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
 * GET /api/services/:id
 * 获取单个服务详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // 由于前端使用 upstream_id，这里需要先查找对应的 product
    const service = new ProductService(c.env)
    
    // 获取所有产品列表，找到匹配的
    const result = await service.getProductList()
    const product = result.list.find((p) => p.upstream_id === parseInt(id))
    
    if (!product) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '服务不存在',
        },
        404
      )
    }

    return c.json<ApiResponse<ServiceItem>>({
      success: true,
      message: '获取服务详情成功',
      data: {
        id: product.upstream_id ?? 0,
        cate_id: product.cate_id ?? 0,
        title: product.title,
        description: product.description,
        sales_price: product.sales_price ?? 0,
        num: product.num,
        expiry_options: product.expiry_pricing?.options ?? [],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取服务详情失败'
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
 * GET /api/services/:id/prefixes
 * 获取号码前缀列表
 * 仍然从上游 API 获取
 */
app.get('/:id/prefixes', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '无效的服务 ID',
        },
        400
      )
    }

    // 获取号码前缀需要调用上游 API
    const { createUpstreamClient } = await import('../../lib/upstream')
    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const type = c.req.query('type')
    const expiry = c.req.query('expiry')

    const data = await client.getPrefixes({
      app_id: id,
      type: type ? parseInt(type) : undefined,
      expiry: expiry ? parseInt(expiry) : undefined,
    })

    return c.json<ApiResponse>({
      success: true,
      message: '获取号码前缀成功',
      data: data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取号码前缀失败'
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