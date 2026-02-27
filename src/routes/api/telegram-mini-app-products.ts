/**
 * Telegram Mini App 商品 API
 * 获取商品列表、详情等
 */

import { Hono } from 'hono'
import type { Env } from '@/types/env'
import { createUpstreamClient } from '@/adapters/upstream'
import { getCurrentUser } from '@/middleware/mini-app-auth'
import { getOrCreateCart, addToCart, getCartTotal, getCartItemCount } from '@/middleware/cart'
import type { ApiResponse } from '@/types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/telegram-mini-app/products
 * 获取商品列表
 */
app.get('/products', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const cate_id = c.req.query('cate_id') ? parseInt(c.req.query('cate_id')!) : undefined
    const name = c.req.query('name')

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getAppList({
      cate_id,
      name,
    })

    return c.json<ApiResponse>({
      success: true,
      message: '获取商品列表成功',
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取商品列表失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/categories
 * 获取商品分类
 */
app.get('/categories', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getCategories()

    return c.json<ApiResponse>({
      success: true,
      message: '获取分类成功',
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取分类失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * POST /api/telegram-mini-app/cart/add
 * 添加商品到购物车
 */
app.post('/cart/add', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const body = await c.req.json()
    const { app_id, name, price, quantity, type, expiry } = body

    if (!app_id || !name || !price || !quantity) {
      return c.json<ApiResponse>(
        { success: false, message: '缺少必要参数' },
        400
      )
    }

    const cart = addToCart(user, {
      app_id,
      name,
      price,
      quantity: parseInt(quantity),
      type,
      expiry,
    })

    return c.json<ApiResponse>({
      success: true,
      message: '添加到购物车成功',
      data: {
        cart,
        total: getCartTotal(cart),
        itemCount: getCartItemCount(cart),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '添加到购物车失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/cart
 * 获取购物车
 */
app.get('/cart', async (c) => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        { success: false, message: '未认证' },
        401
      )
    }

    const cart = getOrCreateCart(user)

    return c.json<ApiResponse>({
      success: true,
      message: '获取购物车成功',
      data: {
        cart,
        total: getCartTotal(cart),
        itemCount: getCartItemCount(cart),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取购物车失败'
    return c.json<ApiResponse>(
      { success: false, message },
      500
    )
  }
})

export default app
