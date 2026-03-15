/**
 * Telegram 用户业务逻辑层
 */

import type { Env } from '../../types/env'
import { createClient } from '@supabase/supabase-js'
import { TelegramUserRepo } from './user.repo'
import type { 
  CreateTelegramUserInput,
  TelegramUser,
  ReceiveSession,
  CartItem
} from './user.schema'

export class TelegramUserService {
  private repo: TelegramUserRepo

  constructor(env: Env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    this.repo = new TelegramUserRepo(supabase)
  }

  /**
   * 注册或更新用户
   */
  async registerOrUpdateUser(telegramUser: any): Promise<TelegramUser> {
    const input: CreateTelegramUserInput = {
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      language_code: telegramUser.language_code || 'zh',
      is_bot: telegramUser.is_bot || false,
      metadata: {}
    }

    return await this.repo.upsert(input)
  }

  /**
   * 获取用户信息
   */
  async getUser(telegramId: number): Promise<TelegramUser | null> {
    return await this.repo.findByTelegramId(telegramId)
  }

  /**
   * 更新用户最后活跃时间
   */
  async updateLastActive(telegramId: number): Promise<void> {
    await this.repo.updateLastActive(telegramId)
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(telegramId: number): Promise<any> {
    return await this.repo.getStats(telegramId)
  }

  // ==================== 接码会话相关 ====================

  /**
   * 开始接码会话
   */
  async startReceiveSession(
    userId: number,
    ordernum: string,
    messageId: number
  ): Promise<ReceiveSession> {
    // 检查是否有活跃会话
    const activeSession = await this.repo.getActiveSession(userId)
    if (activeSession) {
      throw new Error('已有活跃的接码会话')
    }

    return await this.repo.createSession({
      user_id: userId,
      ordernum,
      message_id: messageId,
      status: 'polling',
      poll_count: 0
    })
  }

  /**
   * 获取活跃会话
   */
  async getActiveSession(userId: number): Promise<ReceiveSession | null> {
    return await this.repo.getActiveSession(userId)
  }

  /**
   * 更新会话状态
   */
  async updateSessionStatus(
    sessionId: number,
    status: 'success' | 'timeout' | 'stopped',
    result?: any
  ): Promise<ReceiveSession> {
    return await this.repo.updateSession(sessionId, {
      status,
      completed_at: new Date(),
      result
    })
  }

  /**
   * 增加轮询计数
   */
  async incrementPollCount(sessionId: number): Promise<ReceiveSession> {
    const session = await this.repo.getActiveSession(sessionId)
    if (!session) throw new Error('会话不存在')

    return await this.repo.updateSession(sessionId, {
      poll_count: session.poll_count + 1
    })
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await this.repo.cleanupExpiredSessions()
  }

  // ==================== 购物车相关 ====================

  /**
   * 获取购物车
   */
  async getCart(userId: number): Promise<CartItem[]> {
    return await this.repo.getCart(userId)
  }

  /**
   * 添加到购物车
   */
  async addToCart(
    userId: number,
    productId: string,
    quantity: number = 1
  ): Promise<CartItem> {
    return await this.repo.addToCart({
      user_id: userId,
      product_id: productId,
      quantity
    })
  }

  /**
   * 更新购物车数量
   */
  async updateCartQuantity(
    userId: number,
    productId: string,
    quantity: number
  ): Promise<CartItem> {
    if (quantity <= 0) {
      await this.repo.removeFromCart(userId, productId)
      throw new Error('商品已从购物车移除')
    }

    return await this.repo.updateCartQuantity(userId, productId, quantity)
  }

  /**
   * 从购物车移除
   */
  async removeFromCart(userId: number, productId: string): Promise<void> {
    await this.repo.removeFromCart(userId, productId)
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: number): Promise<void> {
    await this.repo.clearCart(userId)
  }

  /**
   * 获取购物车总数
   */
  async getCartCount(userId: number): Promise<number> {
    const items = await this.repo.getCart(userId)
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }
}