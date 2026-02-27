/**
 * /help 命令处理器
 * 显示帮助信息
 */

import type { Context } from 'grammy'
import { TelegramService } from '../telegram.service'
import type { Env } from '../../../types/env'

export async function handleHelp(ctx: Context, env: Env) {
  try {
    const service = new TelegramService(env)
    const message = service.getHelpMessage()

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '← 返回菜单', callback_data: 'back_to_menu' }]
        ]
      }
    })
  } catch (error) {
    console.error('Error in handleHelp:', error)
    await ctx.reply('❌ 获取帮助信息失败，请稍后重试')
  }
}
