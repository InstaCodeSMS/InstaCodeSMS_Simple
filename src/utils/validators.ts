/**
 * 通用验证函数
 */

import { z, ZodError } from 'zod'
import { ValidationError } from '../core/errors'

/**
 * 验证订单输入
 */
export function validateOrderInput(data: unknown) {
  const schema = z.object({
    app_id: z.number().int().positive('服务项目 ID 必须是正整数'),
    num: z.number().int().min(1, '购买数量必须至少为 1'),
    type: z.number().int().optional(),
    expiry: z.number().int().optional(),
    prefix: z.string().optional(),
    exclude_prefix: z.string().optional(),
  })

  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new ValidationError(`订单参数验证失败: ${messages}`)
    }
    throw error
  }
}

/**
 * 验证支付参数
 */
export function validatePaymentInput(data: unknown) {
  const schema = z.object({
    order_id: z.string().min(1, '订单 ID 不能为空'),
    amount: z.number().positive('金额必须大于 0'),
    method: z.enum(['alipay', 'usdt']).refine(
      (val) => ['alipay', 'usdt'].includes(val),
      { message: '支付方式无效' }
    ),
  })

  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new ValidationError(`支付参数验证失败: ${messages}`)
    }
    throw error
  }
}

/**
 * 验证电话号码格式
 */
export function validatePhoneNumber(phone: string): boolean {
  // 支持多种格式：+86 13800138000, 13800138000, +1-555-123-4567 等
  const phoneRegex = /^[+]?[0-9\s\-()]{7,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

