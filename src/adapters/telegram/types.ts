/**
 * Telegram 适配器 - 类型定义
 * 定义 Telegram Bot 相关的类型和接口
 */

/**
 * Telegram Bot 配置
 */
export interface TelegramBotConfig {
  token: string
  webhookUrl: string
  webhookSecret?: string
}

/**
 * Telegram 用户会话
 */
export interface TelegramUserSession {
  userId: number
  username?: string
  firstName?: string
  lastName?: string
  state: 'idle' | 'searching' | 'ordering' | 'receiving'
  context?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Telegram 接码会话
 */
export interface TelegramReceiveSession {
  userId: number
  ordernum: string
  messageId: number
  isPolling: boolean
  pollCount: number
  startTime: Date
  lastPollTime?: Date
}

/**
 * Telegram API 响应
 */
export interface TelegramApiResponse<T = any> {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
}
