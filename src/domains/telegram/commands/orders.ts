/**
 * /orders 命令处理器
 * 显示用户的订单列表
 */

import type { Context } from 'grammy'
import { TelegramService } from '../telegram.service'
import type { Env } from '../../../types/env'

export async function handleOrders(ctx: Context, env: Env) {
  try {
    const service = new TelegramService(env)
    const message = service.getOrdersMessage()

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '← 返回菜单', callback_data: 'back_to_menu' }]
        ]
      }
    })
  } catch (error) {
    console.error('Error in handleOrders:', error)
    await ctx.reply('❌ 获取订单失败，请稍后重试')
  }
}
