/**
 * 订单相关类型定义
 */

import { z } from 'zod'

/**
 * 支付订单状态枚举
 */
export enum PaymentOrderStatus {
  /** 待支付 */
  PENDING = 1,
  /** 已支付 */
  PAID = 2,
  /** 已超时 */
  TIMEOUT = 3,
  /** 已取消 */
  CANCELLED = 4,
}

/**
 * 支付方式
 */
export type PaymentMethod = 'usdt' | 'alipay' | 'epay' | 'tokenpay' | 'paypal' | 'stripe' | 'wechatpay'

/**
 * 产品信息快照
 */
export interface ProductSnapshot {
  /** 服务 ID */
  service_id: number
  /** 服务标题 */
  title: string
  /** 数量 */
  quantity: number
  /** 有效期选项 */
  expiry: number
  /** 有效期天数描述 */
  expiry_days: string
  /** 单价 */
  unit_price: number
}

/**
 * 数据库中的支付订单记录
 */
export interface PaymentOrderRecord {
  /** 系统交易 ID */
  trade_id: string
  /** 商户订单号 */
  order_id: string
  /** 支付方式 */
  payment_method: PaymentMethod
  /** 请求支付金额（CNY） */
  amount: number
  /** 实际支付金额（USDT） */
  actual_amount: number | null
  /** 订单状态 */
  status: PaymentOrderStatus
  /** 产品信息快照 */
  product_info: ProductSnapshot
  /** 收款地址 */
  token: string | null
  /** 交易类型 */
  trade_type: string | null
  /** 订单有效期（秒） */
  expiration_time: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
  /** 支付时间 */
  paid_at: string | null
  /** 区块链交易哈希 */
  block_transaction_id: string | null
}

/**
 * 创建支付订单参数
 */
export interface CreatePaymentOrderParams {
  trade_id: string
  order_id: string
  payment_method: PaymentMethod
  amount: number
  actual_amount?: number
  status: PaymentOrderStatus
  product_info: ProductSnapshot
  token?: string
  trade_type?: string
  expiration_time: number
}

/**
 * 更新支付订单参数
 */
export interface UpdatePaymentOrderParams {
  status?: PaymentOrderStatus
  actual_amount?: number
  paid_at?: string
  block_transaction_id?: string
}

// Zod 验证 schema
export const ProductSnapshotSchema = z.object({
  service_id: z.number(),
  title: z.string(),
  quantity: z.number(),
  expiry: z.number(),
  expiry_days: z.string(),
  unit_price: z.number(),
})

export const PaymentOrderRecordSchema = z.object({
  trade_id: z.string(),
  order_id: z.string(),
  payment_method: z.enum(['usdt', 'alipay']),
  amount: z.number(),
  actual_amount: z.number().nullable(),
  status: z.number(),
  product_info: ProductSnapshotSchema,
  token: z.string().nullable(),
  trade_type: z.string().nullable(),
  expiration_time: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  paid_at: z.string().nullable(),
  block_transaction_id: z.string().nullable(),
})