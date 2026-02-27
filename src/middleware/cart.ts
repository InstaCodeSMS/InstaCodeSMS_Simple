/**
 * 购物车管理
 * 基于会话的购物车存储
 */

import type { TelegramUser } from './session'

export interface CartItem {
  app_id: number
  name: string
  price: string
  quantity: number
  type?: number // 项目类型 (1=首登卡, 2=重启卡, 3=续费卡)
  expiry?: number // 有效期类型
}

export interface Cart {
  userId: number
  items: CartItem[]
  createdAt: number
  updatedAt: number
}

// 购物车存储 (内存)
const carts = new Map<number, Cart>()

/**
 * 获取或创建购物车
 */
export function getOrCreateCart(user: TelegramUser): Cart {
  const userId = user.telegramId

  if (!carts.has(userId)) {
    carts.set(userId, {
      userId,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  return carts.get(userId)!
}

/**
 * 添加商品到购物车
 */
export function addToCart(user: TelegramUser, item: CartItem): Cart {
  const cart = getOrCreateCart(user)

  // 检查是否已存在相同商品
  const existingItem = cart.items.find(
    (i) => i.app_id === item.app_id && i.type === item.type && i.expiry === item.expiry
  )

  if (existingItem) {
    existingItem.quantity += item.quantity
  } else {
    cart.items.push(item)
  }

  cart.updatedAt = Date.now()
  return cart
}

/**
 * 从购物车移除商品
 */
export function removeFromCart(user: TelegramUser, app_id: number, type?: number, expiry?: number): Cart {
  const cart = getOrCreateCart(user)

  cart.items = cart.items.filter(
    (i) => !(i.app_id === app_id && i.type === type && i.expiry === expiry)
  )

  cart.updatedAt = Date.now()
  return cart
}

/**
 * 更新购物车商品数量
 */
export function updateCartItemQuantity(
  user: TelegramUser,
  app_id: number,
  quantity: number,
  type?: number,
  expiry?: number
): Cart {
  const cart = getOrCreateCart(user)

  const item = cart.items.find(
    (i) => i.app_id === app_id && i.type === type && i.expiry === expiry
  )

  if (item) {
    if (quantity <= 0) {
      removeFromCart(user, app_id, type, expiry)
    } else {
      item.quantity = quantity
    }
  }

  cart.updatedAt = Date.now()
  return cart
}

/**
 * 清空购物车
 */
export function clearCart(user: TelegramUser): Cart {
  const cart = getOrCreateCart(user)
  cart.items = []
  cart.updatedAt = Date.now()
  return cart
}

/**
 * 获取购物车总价
 */
export function getCartTotal(cart: Cart): number {
  return cart.items.reduce((total, item) => {
    return total + parseFloat(item.price) * item.quantity
  }, 0)
}

/**
 * 获取购物车商品总数
 */
export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0)
}
