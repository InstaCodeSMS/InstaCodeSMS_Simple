/**
 * 短信领域 - 数据模型
 * 定义短信相关的 Zod Schema 和 TypeScript 类型
 */

import { z } from 'zod'

/**
 * 短信验证码状态
 */
export enum SmsStatus {
  PENDING = 'pending',    // 等待中
  SUCCESS = 'success',    // 已收到
  EXPIRED = 'expired',    // 已过期
  ERROR = 'error',        // 错误
}

/**
 * 获取短信验证码请求 Schema
 */
export const GetSmsCodeSchema = z.object({
  ordernum: z.string().min(1, '订单号不能为空'),
})

export type GetSmsCodeInput = z.infer<typeof GetSmsCodeSchema>

/**
 * 验证短信验证码请求 Schema
 */
export const VerifySmsCodeSchema = z.object({
  ordernum: z.string().min(1, '订单号不能为空'),
  code: z.string().min(1, '验证码不能为空'),
})

export type VerifySmsCodeInput = z.infer<typeof VerifySmsCodeSchema>

/**
 * 短信验证码响应
 */
export interface SmsCodeResponse {
  ordernum: string
  tel: string
  sms: string
  expired_date: string
  status: SmsStatus
}

/**
 * 短信验证结果
 */
export interface SmsVerifyResult {
  success: boolean
  message: string
  tel?: string
}
