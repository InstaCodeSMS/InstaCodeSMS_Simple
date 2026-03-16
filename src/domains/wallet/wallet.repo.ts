/**
 * 钱包仓库层
 * 
 * Why: 封装所有钱包相关的数据库操作，与业务逻辑分离
 * 通过 RPC 函数保证原子性操作
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  TransactionType,
  type WalletRecord,
  type TransactionRecord,
  type CreateTransactionParams,
  type ProcessTransactionResponse,
  type GetTransactionsParams,
  milliToYuan,
} from './wallet.schema'

/**
 * 钱包仓库
 */
export class WalletRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * 获取用户钱包信息
   * Why: 通过 RPC 函数获取，保证安全性
   */
  async getWallet(userId: string): Promise<WalletRecord | null> {
    const { data, error } = await this.client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取钱包信息失败: ${error.message}`)
    }

    return {
      user_id: data.user_id,
      balance: Number(data.balance),
      frozen_balance: Number(data.frozen_balance),
      version: data.version,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }

  /**
   * 处理交易（核心方法）
   * Why: 通过 RPC 函数实现原子性，同时更新余额和写入流水
   */
  async processTransaction(
    params: CreateTransactionParams
  ): Promise<ProcessTransactionResponse> {
    const { data, error } = await this.client.rpc('process_wallet_transaction', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_type: params.type,
      p_related_id: params.relatedId || null,
      p_related_type: params.relatedType || null,
      p_description: params.description || null,
      p_metadata: params.metadata || {},
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: data.success,
      transactionId: data.transaction_id,
      balanceBefore: data.balance_before,
      balanceAfter: data.balance_after,
      amount: data.amount,
      error: data.error,
    }
  }

  /**
   * 充值
   */
  async recharge(
    userId: string,
    amount: number, // 毫单位
    relatedId: string,
    metadata: Record<string, unknown>
  ): Promise<ProcessTransactionResponse> {
    return this.processTransaction({
      userId,
      amount: Math.abs(amount), // 确保是正数
      type: TransactionType.RECHARGE,
      relatedId,
      relatedType: 'recharge',
      description: '账户充值',
      metadata,
    })
  }

  /**
   * 消费
   */
  async consume(
    userId: string,
    amount: number, // 毫单位
    relatedId: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<ProcessTransactionResponse> {
    return this.processTransaction({
      userId,
      amount: -Math.abs(amount), // 确保是负数
      type: TransactionType.CONSUME,
      relatedId,
      relatedType: 'order',
      description: description || '购买服务',
      metadata,
    })
  }

  /**
   * 退款
   */
  async refund(
    userId: string,
    amount: number, // 毫单位
    relatedId: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<ProcessTransactionResponse> {
    return this.processTransaction({
      userId,
      amount: Math.abs(amount), // 确保是正数
      type: TransactionType.REFUND,
      relatedId,
      relatedType: 'refund',
      description: description || '订单退款',
      metadata,
    })
  }

  /**
   * 获取交易记录列表
   */
  async getTransactions(
    userId: string,
    params: GetTransactionsParams
  ): Promise<{ transactions: TransactionRecord[]; total: number }> {
    const { page, pageSize, type, startDate, endDate } = params
    const offset = (page - 1) * pageSize

    // 构建查询
    let query = this.client
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 类型筛选
    if (type) {
      query = query.eq('type', type)
    }

    // 日期范围筛选
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 分页
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`获取交易记录失败: ${error.message}`)
    }

    const transactions: TransactionRecord[] = (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      amount: Number(item.amount),
      type: item.type as TransactionType,
      balance_before: Number(item.balance_before),
      balance_after: Number(item.balance_after),
      related_id: item.related_id,
      related_type: item.related_type,
      description: item.description,
      metadata: item.metadata || {},
      created_at: item.created_at,
    }))

    return {
      transactions,
      total: count || 0,
    }
  }

  /**
   * 获取最近交易记录（用于概览）
   */
  async getRecentTransactions(
    userId: string,
    limit: number = 5
  ): Promise<TransactionRecord[]> {
    const { data, error } = await this.client
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`获取最近交易记录失败: ${error.message}`)
    }

    return (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      amount: Number(item.amount),
      type: item.type as TransactionType,
      balance_before: Number(item.balance_before),
      balance_after: Number(item.balance_after),
      related_id: item.related_id,
      related_type: item.related_type,
      description: item.description,
      metadata: item.metadata || {},
      created_at: item.created_at,
    }))
  }

  /**
   * 检查余额是否充足
   */
  async hasEnoughBalance(userId: string, requiredAmount: number): Promise<boolean> {
    const wallet = await this.getWallet(userId)
    if (!wallet) {
      return false
    }
    return wallet.balance >= requiredAmount
  }
}

/**
 * 创建钱包仓库实例
 */
export function createWalletRepository(client: SupabaseClient): WalletRepository {
  return new WalletRepository(client)
}