/**
 * Telegram Mini App 类型定义
 */

/**
 * Telegram 用户信息
 * 来自 initData 中的 user 字段
 */
export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  added_to_attachment_menu?: boolean
  photo_url?: string
}

/**
 * Telegram Mini App InitData
 * 前端通过 window.Telegram.WebApp.initData 获取
 */
export interface InitData {
  user?: TelegramUser
  auth_date: number
  hash: string
  chat_instance?: string
  chat_type?: string
  start_param?: string
  [key: string]: any
}

/**
 * InitData 验证结果
 */
export interface VerifyInitDataResult {
  valid: boolean
  data?: InitData
  error?: string
}

/**
 * 认证用户信息（注入到 Context）
 */
export interface AuthenticatedUser {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  isPremium?: boolean
  authDate: number
}
