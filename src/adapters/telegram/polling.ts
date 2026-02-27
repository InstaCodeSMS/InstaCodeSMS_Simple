/**
 * Telegram Bot Polling 模式
 * 用于本地开发，Bot 主动轮询获取更新
 */

import type { Env } from '../../types/env'
import { createBot } from './bot'

/**
 * 启动 Bot Polling
 */
export async function startPolling(env: Env): Promise<void> {
  const bot = createBot(env)

  console.log('[Telegram] Starting bot in polling mode...')

  try {
    await bot.start()
    console.log('[Telegram] Bot started successfully')
  } catch (error) {
    console.error('[Telegram] Failed to start bot:', error)
    throw error
  }
}
