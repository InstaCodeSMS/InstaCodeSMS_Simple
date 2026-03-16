/**
 * 钱包服务层
 * 
 * Why: 编排钱包相关的业务流程，处理充值、消费、退款等场景
 * 调用仓库层进行数据操作，保证业务逻辑的完整性
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createWalletRepository, WalletRepository } from './wallet.repo'
import {
  TransactionType,
  type WalletInfoResponse,
  type TransactionListResponse,
  type TransactionRecord,
  type GetTransactionsParams,
  milliToYuan,
  formatBalance,
  yuanToMilli,
} from './wallet.schema'

/**
 * 充值请求参数
 */
export interface RechargeRequest {
  amount: number          // 元
  paymentMethod: string   // usdt / alipay
}

/**
 * 充值订单创建结果
 */
export interface RechargeOrderResult {
  success: boolean
  tradeId?: string
  amount?: number         // 毫
  paymentUrl?: string
  error?: string
}

/**
 * 钱包服务
 */
export class WalletService {
  private repo: WalletRepository

  constructor(client: SupabaseClient) {
    this.repo = createWalletRepository(client)
  }

  /**
   * 获取钱包信息
   */
  async getWalletInfo(userId: string): Promise<WalletInfoResponse> {
    const wallet = await this.repo.getWallet(userId)
    
    if (!wallet) {
      return {
        success: false,
        balance: 0,
        frozenBalance: 0,
        balanceYuan: '0.000',
        frozenBalanceYuan: '0.000',
        version: 0,
        createdAt: '',
        updatedAt: '',
      }
    }

    return {
      success: true,
      balance: wallet.balance,
      frozenBalance: wallet.frozen_balance,
      balanceYuan: milliToYuan(wallet.balance),
      frozenBalanceYuan: milliToYuan(wallet.frozen_balance),
      version: wallet.version,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at,
    }
  }

  /**
   * 获取交易记录列表
   */
  async getTransactions(
    userId: string,
    params: GetTransactionsParams
  ): Promise<TransactionListResponse> {
    const { transactions, total } = await this.repo.getTransactions(userId, params)

    return {
      success: true,
      transactions,
      total,
      page: params.page,
      pageSize: params.pageSize,
    }
  }

  /**
   * 获取最近交易记录
   */
  async getRecentTransactions(userId: string, limit: number = 5): Promise<TransactionRecord[]> {
    return this.repo.getRecentTransactions(userId, limit)
  }

  /**
   * 处理充值成功回调
   * Why: 支付成功后调用此方法更新余额
   * 
   * @param userId 用户ID
   * @param amount 金额（毫单位）
   * @param tradeId 交易号
   * @param metadata 元数据（支付方式等）
   */
  async handleRechargeSuccess(
    userId: string,
    amount: number,
    tradeId: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.repo.recharge(userId, amount, tradeId, {
      ...metadata,
      rechargeTime: new Date().toISOString(),
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || '充值失败',
      }
    }

    return { success: true }
  }

  /**
   * 处理消费（购买服务）
   * Why: 购买服务时扣款
   * 
   * @param userId 用户ID
   * @param amount 金额（毫单位）
   * @param orderId 订单号
   * @param description 描述
   * @param metadata 元数据
   */
  async handleConsume(
    userId: string,
    amount: number,
    orderId: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    // 先检查余额
    const hasBalance = await this.repo.hasEnoughBalance(userId, amount)
    if (!hasBalance) {
      return {
        success: false,
        error: '余额不足',
      }
    }

    const result = await this.repo.consume(userId, amount, orderId, description, metadata)

    if (!result.success) {
      return {
        success: false,
        error: result.error || '扣款失败',
      }
    }

    return { success: true }
  }

  /**
   * 处理退款
   * Why: 订单取消或服务失败时退款
   * 
   * @param userId 用户ID
   * @param amount 金额（毫单位）
   * @param orderId 订单号
   * @param reason 退款原因
   */
  async handleRefund(
    userId: string,
    amount: number,
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.repo.refund(userId, amount, orderId, reason || '订单退款')

    if (!result.success) {
      return {
        success: false,
        error: result.error || '退款失败',
      }
    }

    return { success: true }
  }

  /**
   * 检查余额是否充足
   */
  async checkBalance(userId: string, amountYuan: number): Promise<boolean> {
    const amountMilli = yuanToMilli(amountYuan)
    return this.repo.hasEnoughBalance(userId, amountMilli)
  }
}

/**
 * 创建钱包服务实例
 */
export function createWalletService(client: SupabaseClient): WalletService {
  return new WalletService(client)
}