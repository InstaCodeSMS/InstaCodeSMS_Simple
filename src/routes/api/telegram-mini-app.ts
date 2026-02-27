/**
 * Telegram Mini App API 路由
 * 提供 Mini App 所需的所有 API 端点
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { ProductService } from '../../domains/product/product.service'
import { OrderService } from '../../domains/order/order.service'
import { createSupabaseClient } from '../../adapters/database/supabase'
import type { ApiResponse } from '../../types/api'
import { telegramAuthMiddleware, getTelegramUser } from '../../middleware/telegram-auth'
import { verifyInitData, getUserFromInitData } from '../../adapters/telegram/init-data'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/telegram-mini-app/verify
 * 验证 InitData 签名（用于前端测试）
 */
app.post('/verify', async (c) => {
  try {
    const body = await c.req.json()
    const { initData } = body

    if (!initData) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '缺少 initData'
        },
        400
      )
    }

    const botToken = c.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '服务器配置错误'
        },
        500
      )
    }

    // 验证 InitData 签名
    const result = verifyInitData(initData, botToken)

    if (!result.valid) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '验证失败: ' + result.error
        },
        401
      )
    }

    // 提取用户信息
    const user = getUserFromInitData(result.data!)

    return c.json<ApiResponse>({
      success: true,
      message: '验证成功',
      data: {
        user,
        authDate: result.data?.auth_date
      }
    })
  } catch (error) {
    console.error('Verify initData error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '验证出错'
      },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/user
 * 获取当前认证用户信息（需要中间件保护）
 */
app.get('/user', telegramAuthMiddleware, async (c) => {
  try {
    const user = getTelegramUser(c)

    if (!user) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '未认证'
        },
        401
      )
    }

    return c.json<ApiResponse>({
      success: true,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取用户信息失败'
      },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/products
 * 获取商品列表
 */
app.get('/products', async (c) => {
  try {
    const productService = new ProductService(c.env)
    const result = await productService.getProductList()

    return c.json<ApiResponse>({
      success: true,
      message: '获取商品列表成功',
      data: result.list
    })
  } catch (error) {
    console.error('Failed to get products:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取商品列表失败'
      },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/products/:productId
 * 获取商品详情
 */
app.get('/products/:productId', async (c) => {
  try {
    const productId = c.req.param('productId')
    const productService = new ProductService(c.env)
    const product = await productService.getProductById(productId)

    if (!product) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '商品不存在'
        },
        404
      )
    }

    return c.json<ApiResponse>({
      success: true,
      message: '获取商品详情成功',
      data: product
    })
  } catch (error) {
    console.error('Failed to get product:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取商品详情失败'
      },
      500
    )
  }
})

/**
 * POST /api/telegram-mini-app/orders
 * 创建订单（需要认证）
 */
app.post('/orders', telegramAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const { productId, expiry, quantity, paymentMethod } = body

    // 参数验证
    if (!productId || !expiry || !quantity || !paymentMethod) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '参数不完整'
        },
        400
      )
    }

    if (quantity < 1) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '数量必须大于 0'
        },
        400
      )
    }

    // 获取商品信息
    const productService = new ProductService(c.env)
    const product = await productService.getProductById(productId)

    if (!product) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '商品不存在'
        },
        404
      )
    }

    // 获取有效期价格
    const expiryOption = product.expiry_pricing?.options.find(
      (opt) => opt.expiry === expiry
    )

    if (!expiryOption) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '有效期选项不存在'
        },
        400
      )
    }

    // 计算总价
    const totalPrice = expiryOption.price * quantity

    // 获取认证用户
    const user = getTelegramUser(c)
    if (!user) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '未认证'
        },
        401
      )
    }

    // 创建订单（调用上游 API）
    const db = createSupabaseClient(c.env)
    const orderService = new OrderService(db, c.env)
    const orderResult = await orderService.createOrder(
      product.upstream_id || 0,
      quantity,
      { expiry }
    )

    console.log(`[Telegram Mini App] Order created by user ${user.telegramId}: ${orderResult.ordernum}`)

    return c.json<ApiResponse>({
      success: true,
      message: '订单创建成功',
      data: {
        ordernum: orderResult.ordernum,
        amount: totalPrice,
        paymentMethod,
        items: orderResult.items,
        userId: user.telegramId
      }
    })
  } catch (error) {
    console.error('Create order error:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '创建订单失败'
      },
      500
    )
  }
})

/**
 * GET /api/telegram-mini-app/orders/:orderId
 * 获取订单详情（需要认证）
 */
app.get('/orders/:orderId', telegramAuthMiddleware, async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const orderService = new OrderService(createSupabaseClient(c.env), c.env)
    const order = await orderService.getOrderDetail(orderId)

    return c.json<ApiResponse>({
      success: true,
      message: '获取订单详情成功',
      data: order
    })
  } catch (error) {
    console.error('Failed to get order:', error)
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取订单详情失败'
      },
      500
    )
  }
})

export default app
