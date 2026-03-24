/**
 * Telegram 用户数据访问层
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  TelegramUser, 
  CreateTelegramUserInput, 
  UpdateTelegramUserInput,
  ReceiveSession,
  CreateReceiveSessionInput,
  CartItem,
  AddToCartInput
} from './user.schema'

export class TelegramUserRepo {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 根据 Telegram ID 查找用户
   */
  async findByTelegramId(telegramId: number): Promise<TelegramUser | null> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * 创建用户
   */
  async create(input: CreateTelegramUserInput): Promise<TelegramUser> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 更新用户
   */
  async update(input: UpdateTelegramUserInput): Promise<TelegramUser> {
    const { telegram_id, ...updates } = input

    const { data, error } = await this.supabase
      .from('telegram_users')
      .update(updates)
      .eq('telegram_id', telegram_id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 创建或更新用户（upsert）
   */
  async upsert(input: CreateTelegramUserInput): Promise<TelegramUser> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .upsert(input, {
        onConflict: 'telegram_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 更新最后活跃时间
   */
  async updateLastActive(telegramId: number): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_users')
      .update({ last_active: new Date().toISOString() })
      .eq('telegram_id', telegramId)

    if (error) throw error
  }

  /**
   * 获取用户统计信息
   */
  async getStats(telegramId: number): Promise<any> {
    const { data, error } = await this.supabase
      .rpc('get_user_stats', { p_user_id: telegramId })

    if (error) throw error
    return data?.[0] || null
  }

  //==================== 接码会话相关 ====================

  /**
   * 创建接码会话
   */
  async createSession(input: CreateReceiveSessionInput): Promise<ReceiveSession> {
    const { data, error } = await this.supabase
      .from('receive_sessions')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 获取用户的活跃会话
   */
  async getActiveSession(userId: number): Promise<ReceiveSession | null> {
    const { data, error } = await this.supabase
      .from('receive_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'polling')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * 更新会话状态
   */
  async updateSession(
    id: number,
    updates: Partial<ReceiveSession>
  ): Promise<ReceiveSession> {
    const { data, error } = await this.supabase
      .from('receive_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('cleanup_expired_sessions')

    if (error) throw error
    return data || 0
  }

  // ==================== 购物车相关 ====================

  /**
   * 获取用户购物车
   */
  async getCart(userId: number): Promise<CartItem[]> {
    const { data, error } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * 添加到购物车
   */
  async addToCart(input: AddToCartInput): Promise<CartItem> {
    const { data, error } = await this.supabase
      .from('cart_items')
      .upsert(input, {
        onConflict: 'user_id,product_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 更新购物车项数量
   */
  async updateCartQuantity(
    userId: number,
    productId: string,
    quantity: number
  ): Promise<CartItem> {
    const { data, error } = await this.supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 从购物车移除
   */
  async removeFromCart(userId: number, productId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: number): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  }
}