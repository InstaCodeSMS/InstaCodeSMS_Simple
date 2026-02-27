/**
 * /start 命令处理器
 * 显示欢迎信息和主菜单
 */

import type { Context } from 'grammy'
import { TelegramService } from '../telegram.service'
import type { Env } from '../../../types/env'

export async function handleStart(ctx: Context, env: Env) {
  try {
    const service = new TelegramService(env)
    const message = service.getWelcomeMessage()

    // 获取 Mini App URL
    const baseUrl = env.TELEGRAM_WEBHOOK_URL?.replace('/api/telegram/webhook', '') || 'https://example.com'
    const miniAppUrl = `${baseUrl}/telegram-mini-app`

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛍️ 打开商城',
              web_app: { url: miniAppUrl }
            }
          ],
          [
            { text: '📦 我的订单', callback_data: 'orders' },
            { text: '📱 接码终端', callback_data: 'receive' }
          ],
          [
            { text: '📖 帮助', callback_data: 'help' }
          ]
        ]
      }
    })
  } catch (error) {
    console.error('Error in handleStart:', error)
    await ctx.reply('❌ 发生错误，请稍后重试')
  }
}
