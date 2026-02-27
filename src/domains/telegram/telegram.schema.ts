/**
 * Telegram 业务领域 - Zod 校验规则
 * 定义 Telegram 相关的数据结构和验证规则
 */

import { z } from 'zod'

/**
 * 用户会话状态
 */
export const UserSessionSchema = z.object({
  userId: z.number(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  state: z.enum(['idle', 'searching', 'ordering', 'receiving']),
  context: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * 接码会话
 */
export const ReceiveSessionSchema = z.object({
  userId: z.number(),
  ordernum: z.string(),
  messageId: z.number(),
  isPolling: z.boolean(),
  pollCount: z.number(),
  startTime: z.date(),
  lastPollTime: z.date().optional()
})

/**
 * 商品搜索参数
 */
export const ProductSearchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.enum(['default', 'priceLow', 'priceHigh']).default('default'),
  limit: z.number().default(10)
})

export type UserSession = z.infer<typeof UserSessionSchema>
export type ReceiveSession = z.infer<typeof ReceiveSessionSchema>
export type ProductSearch = z.infer<typeof ProductSearchSchema>
