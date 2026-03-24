/**
 * Telegram 用户数据模型
 */

import { z } from 'zod'

/**
 * Telegram 用户 Schema
 */
export const TelegramUserSchema = z.object({
  id: z.number().optional(),
  telegram_id: z.number(),
  username: z.string().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  language_code: z.string().default('zh'),
  is_bot: z.boolean().default(false),
  created_at: z.date().optional(),
  last_active: z.date().optional(),
  metadata: z.record(z.any()).default({})
})

export type TelegramUser = z.infer<typeof TelegramUserSchema>

/**
 * 创建用户输入 Schema
 */
export const CreateTelegramUserSchema = TelegramUserSchema.omit({
  id: true,
  created_at: true,
  last_active: true
} as const)

export type CreateTelegramUserInput = z.infer<typeof CreateTelegramUserSchema>

/**
 * 更新用户输入 Schema
 */
export const UpdateTelegramUserSchema = TelegramUserSchema.partial().required({
  telegram_id: true
})

export type UpdateTelegramUserInput = z.infer<typeof UpdateTelegramUserSchema>

/**
 * 接码会话 Schema
 */
export const ReceiveSessionSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  ordernum: z.string(),
  message_id: z.number(),
  status: z.enum(['polling', 'success', 'timeout', 'stopped']).default('polling'),
  poll_count: z.number().default(0),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  result: z.record(z.any()).optional()
})

export type ReceiveSession = z.infer<typeof ReceiveSessionSchema>

/**
 * 创建会话输入 Schema
 */
export const CreateReceiveSessionSchema = ReceiveSessionSchema.omit({
  id: true,
  started_at: true,
  completed_at: true
} as const)

export type CreateReceiveSessionInput = z.infer<typeof CreateReceiveSessionSchema>

/**
 * 购物车项 Schema
 */
export const CartItemSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  product_id: z.string(),
  quantity: z.number().min(1).default(1),
  added_at: z.date().optional(),
  updated_at: z.date().optional()
})

export type CartItem = z.infer<typeof CartItemSchema>

/**
 * 添加到购物车输入 Schema
 */
export const AddToCartSchema = z.object({
  user_id: z.number(),
  product_id: z.string(),
  quantity: z.number().min(1).default(1)
})

export type AddToCartInput = z.infer<typeof AddToCartSchema>