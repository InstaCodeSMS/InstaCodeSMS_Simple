/**
 * Mini App API 路由
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { ProductService } from '../../domains/product/product.service'
import { OrderService } from '../../domains/order/order.service'
import { TelegramUserService } from '../../domains/telegram/user.service'

const app = new Hono<{ Bindings: Env }>()

// 中间件：验证 Telegram 用户
app.use('*', async (c, next) => {
  const userId = c.req.header('X-Telegram-User-Id')
  const initData = c.req.header('X-Telegram-Init-Data')
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  c.set('userId', parseInt(userId))
  await next()
})

// ==================== 产品 API ====================

// 获取产品列表
app.get('/products', async (c) => {
  try {
    const service = new ProductService(c.env)
    const products = await service.getActiveProducts()
    
    return c.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('[API] Get products error:', error)
    return c.json({ error: 'Failed to fetch products' }, 500)
  }
})

// 获取产品详情
app.get('/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const service = new ProductService(c.env)
    const product = await service.getProductById(id)
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    return c.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('[API] Get product error:', error)
    return c.json({ error: 'Failed to fetch product' }, 500)
  }
})

// 搜索产品
app.get('/products/search', async (c) => {
  try {
    const q = c.req.query('q') || ''
    const service = new ProductService(c.env)
    const products = await service.searchProducts(q)
    
    return c.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('[API] Search products error:', error)
    return c.json({ error: 'Failed to search products' }, 500)
  }
})

// ==================== 购物车 API ====================

// 获取购物车
app.get('/cart', async (c) => {
  try {
    const userId = c.get('userId')
    const service = new TelegramUserService(c.env)
    const items = await service.getCart(userId)
    
    return c.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('[API] Get cart error:', error)
    return c.json({ error: 'Failed to fetch cart' }, 500)
  }
})

// 添加到购物车
app.post('/cart/add', async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id, quantity = 1 } = await c.req.json()
    
    if (!product_id) {
      return c.json({ error: 'Product ID is required' }, 400)
    }
    
    const service = new TelegramUserService(c.env)
    const item = await service.addToCart(userId, product_id, quantity)
    
    return c.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('[API] Add to cart error:', error)
    return c.json({ error: 'Failed to add to cart' }, 500)
  }
})

// 更新购物车数量
app.put('/cart/update', async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id, quantity } = await c.req.json()
    
    if (!product_id || !quantity) {
      return c.json({ error: 'Product ID and quantity are required' }, 400)
    }
    
    const service = new TelegramUserService(c.env)
    const item = await service.updateCartQuantity(userId, product_id, quantity)
    
    return c.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('[API] Update cart error:', error)
    return c.json({ error: 'Failed to update cart' }, 500)
  }
})

// 从购物车移除
app.delete('/cart/remove', async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id } = await c.req.json()
    
    if (!product_id) {
      return c.json({ error: 'Product ID is required' }, 400)
    }
    
    const service = new TelegramUserService(c.env)
    await service.removeFromCart(userId, product_id)
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('[API] Remove from cart error:', error)
    return c.json({ error: 'Failed to remove from cart' }, 500)
  }
})

//清空购物车
app.delete('/cart/clear', async (c) => {
  try {
    const userId = c.get('userId')
    const service = new TelegramUserService(c.env)
    await service.clearCart(userId)
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('[API] Clear cart error:', error)
    return c.json({ error: 'Failed to clear cart' }, 500)
  }
})

// ==================== 订单 API ====================

// 获取订单列表
app.get('/orders', async (c) => {
  try {
    const userId = c.get('userId')
    const service = new OrderService(c.env)
    const orders = await service.getUserOrders(userId.toString())
    
    return c.json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('[API] Get orders error:', error)
    return c.json({ error: 'Failed to fetch orders' }, 500)
  }
})

// 获取订单详情
app.get('/orders/:ordernum', async (c) => {
  try {
    const userId = c.get('userId')
    const ordernum = c.req.param('ordernum')
    const service = new OrderService(c.env)
    const order = await service.getOrderByOrdernum(ordernum)
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    // 验证订单所有权
    if (order.user_id !== userId.toString()) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    return c.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('[API] Get order error:', error)
    return c.json({ error: 'Failed to fetch order' }, 500)
  }
})

// ==================== 结算 API ====================

// 创建订单
app.post('/checkout', async (c) => {
  try {
    const userId = c.get('userId')
    const { items } = await c.req.json()
    
    if (!items || items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400)
    }
    
    const service = new OrderService(c.env)
    const order = await service.createOrderFromCart(userId.toString(), items)
    
    return c.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('[API] Checkout error:', error)
    return c.json({ error: 'Failed to create order' }, 500)
  }
})

export default app