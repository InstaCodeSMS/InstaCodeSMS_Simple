/**
 * 支付领域 - 数据模型 (MVP版本)
 */

import { z } from 'zod'

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  USDT = 'usdt',
}

/**
 * 支付订单状态枚举
 */
export enum PaymentStatus {
  PENDING = 1,      // 待支付
  PAID = 2,         // 已支付
  TIMEOUT = 3,      // 已超时
  CANCELLED = 4,    // 已取消
}

/**
 * 创建支付订单请求 Schema
 */
export const CreatePaymentSchema = z.object({
  order_id: z.string().min(1, '订单ID不能为空'),
  amount: z.number().positive('金额必须大于0'),
  payment_method: z.nativeEnum(PaymentMethod),
  product_info: z.object({
    service_id: z.number().int().positive(),
    title: z.string().min(1),
    quantity: z.number().int().positive(),
    expiry: z.number().int().nonnegative(),
    expiry_days: z.string(),
    unit_price: z.number().positive(),
  }),
  trade_type: z.string().optional(),
  base_url: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>

/**
 * 支付订单查询 Schema
 */
export const QueryPaymentSchema = z.object({
  trade_id: z.string().min(1, '交易ID不能为空'),
})

export type QueryPaymentInput = z.infer<typeof QueryPaymentSchema>

/**
 * 支付订单回调 Schema
 */
export const PaymentCallbackSchema = z.object({
  trade_id: z.string(),
  order_id: z.string(),
  status: z.number().int(),
  amount: z.number().positive(),
  actual_amount: z.number().positive().optional(),
  block_transaction_id: z.string().optional(),
})

export type PaymentCallbackInput = z.infer<typeof PaymentCallbackSchema>

/**
 * 支付订单响应
 */
export interface PaymentOrderResponse {
  trade_id: string
  order_id: string
  status: PaymentStatus
  amount: number
  actual_amount: number | null
  payment_method: PaymentMethod
  paid_at: string | null
  block_transaction_id: string | null
}

