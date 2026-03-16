/**
 * 钱包领域 - 类型定义与 Zod 验证
 * 
 * Why: 作为钱包模块的唯一事实来源，定义所有数据结构和验证规则
 * 金额单位: 毫 (1元 = 1000毫)
 */

import { z } from 'zod'

/**
 * 交易类型枚举
 */
export enum TransactionType {
  /** 充值 */
  RECHARGE = 'recharge',
  /** 消费 */
  CONSUME = 'consume',
  /** 退款 */
  REFUND = 'refund',
  /** 冻结 */
  FREEZE = 'freeze',
  /** 解冻 */
  UNFREEZE = 'unfreeze',
}

/**
 * 交易类型中文映射
 */
export const TransactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.RECHARGE]: '充值',
  [TransactionType.CONSUME]: '消费',
  [TransactionType.REFUND]: '退款',
  [TransactionType.FREEZE]: '冻结',
  [TransactionType.UNFREEZE]: '解冻',
}

/**
 * 钱包记录
 */
export interface WalletRecord {
  user_id: string
  balance: number           // 当前余额（毫）
  frozen_balance: number    // 冻结金额（毫）
  version: number           // 乐观锁版本号
  created_at: string
  updated_at: string
}

/**
 * 交易记录
 */
export interface TransactionRecord {
  id: string
  user_id: string
  amount: number            // 正数=收入，负数=支出（毫）
  type: TransactionType
  balance_before: number    // 变动前余额（毫）
  balance_after: number     // 变动后余额（毫）
  related_id: string | null
  related_type: string | null
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * 创建交易参数
 */
export interface CreateTransactionParams {
  userId: string
  amount: number            // 毫单位，正数充值/负数消费
  type: TransactionType
  relatedId?: string
  relatedType?: string
  description?: string
  metadata?: Record<string, unknown>
}

/**
 * 钱包信息响应
 */
export interface WalletInfoResponse {
  success: boolean
  balance: number           // 毫
  frozenBalance: number     // 毫
  balanceYuan: string       // 元（格式化后）
  frozenBalanceYuan: string // 元（格式化后）
  version: number
  createdAt: string
  updatedAt: string
}

/**
 * 交易记录响应
 */
export interface TransactionListResponse {
  success: boolean
  transactions: TransactionRecord[]
  total: number
  page: number
  pageSize: number
}

/**
 * 处理交易响应
 */
export interface ProcessTransactionResponse {
  success: boolean
  transactionId?: string
  balanceBefore?: number
  balanceAfter?: number
  amount?: number
  error?: string
}

// ============================================
// Zod 验证 Schema
// ============================================

/**
 * 交易类型验证
 */
export const TransactionTypeSchema = z.nativeEnum(TransactionType)

/**
 * 钱包记录验证
 */
export const WalletRecordSchema = z.object({
  user_id: z.string().uuid(),
  balance: z.number().int().nonnegative(),
  frozen_balance: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * 交易记录验证
 */
export const TransactionRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().int(),
  type: TransactionTypeSchema,
  balance_before: z.number().int(),
  balance_after: z.number().int(),
  related_id: z.string().nullable(),
  related_type: z.string().nullable(),
  description: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string(),
})

/**
 * 创建交易参数验证
 */
export const CreateTransactionParamsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int(),  // 正数充值，负数消费
  type: TransactionTypeSchema,
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * 获取交易列表参数
 */
export const GetTransactionsParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  type: TransactionTypeSchema.optional(),
  startDate: z.string().optional(),  // ISO 格式
  endDate: z.string().optional(),    // ISO 格式
})

export type GetTransactionsParams = z.infer<typeof GetTransactionsParamsSchema>

/**
 * 工具函数：毫转元
 */
export function milliToYuan(milli: number): string {
  return (milli / 1000).toFixed(3)
}

/**
 * 工具函数：元转毫
 */
export function yuanToMilli(yuan: number): number {
  return Math.round(yuan * 1000)
}

/**
 * 工具函数：格式化金额显示
 */
export function formatBalance(milli: number): string {
  const yuan = milli / 1000
  return yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  } as Intl.NumberFormatOptions)
}
