/**
 * Telegram Bot 实例（增强版）
 * 集成新的用户管理和命令系统
 */

import { Bot, Context } from 'grammy'
import type { Env } from '../../types/env'
import { loggingMiddleware, errorHandlingMiddleware } from './middleware'
import { handleStart } from '../../domains/telegram/commands/start'
import { handleProducts } from '../../domains/telegram/commands/products'
import { handleHelp } from '../../domains/telegram/commands/help'
import {
  handleReceiveEnhanced, 
  handleReceiveOrdernumEnhanced,
  handleStopEnhanced 
} from '../../domains/telegram/commands/receive.enhanced'
import { 
  handleOrdersEnhanced,
  handleOrderDetail
} from '../../domains/telegram/commands/orders.enhanced'

/**
 * 创建 Bot 实例
 */
export function createBotEnhanced(env: Env): Bot {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  // 应用中间件
  bot.use(loggingMiddleware)
  bot.use(errorHandlingMiddleware)

  // 注册命令
  bot.command('start', (ctx: Context) => handleStart(ctx, env))
  bot.command('products', (ctx: Context) => handleProducts(ctx, env))
  bot.command('orders', (ctx: Context) => handleOrdersEnhanced(ctx, env))
  bot.command('receive', (ctx: Context) => handleReceiveEnhanced(ctx, env))
  bot.command('stop', (ctx: Context) => handleStopEnhanced(ctx, env))
  bot.command('help', (ctx: Context) => handleHelp(ctx, env))

  // 处理文本消息（用于接收订单号）
  bot.on('message:text', async (ctx: Context) => {
    const text = ctx.message?.text
    const userId = ctx.from?.id

    if (!text || !userId) return

    // 检查是否是回复消息
    if (ctx.message?.reply_to_message) {
      const replyText = ctx.message.reply_to_message.text

      if (replyText?.includes('请输入订单号')) {
        const ordernum = text.trim()
        if (!ordernum) {
          await ctx.reply('❌ 订单号不能为空')
          return
        }

        await handleReceiveOrdernumEnhanced(ctx, env, ordernum)
        return
      }
    }
  })

  // 处理按钮回调
  bot.on('callback_query', async (ctx: Context) => {
    const data = ctx.callbackQuery?.data

    if (!data) return

    try {
      if (data === 'products') {
        await handleProducts(ctx, env)
      } else if (data === 'orders' || data === 'orders_refresh') {
        await handleOrdersEnhanced(ctx, env)
      } else if (data === 'receive') {
        await handleReceiveEnhanced(ctx, env)
      } else if (data === 'help') {
        await handleHelp(ctx, env)
      } else if (data === 'back_to_menu') {
        await handleStart(ctx, env)
      } else if (data.startsWith('order_')) {
        const ordernum = data.replace('order_', '')
        await handleOrderDetail(ctx, env, ordernum)
      } else if (data.startsWith('receive_')) {
        const ordernum = data.replace('receive_', '')
        await handleReceiveOrdernumEnhanced(ctx, env, ordernum)
      }

      await ctx.answerCallbackQuery()
    } catch (error) {
      console.error('[CallbackQuery] Error:', error)
      await ctx.answerCallbackQuery('操作失败，请重试')
    }
  })

  return bot
}

/**
 * 获取 Bot 实例
 */
export function getBotEnhanced(env: Env): Bot {
  return createBotEnhanced(env)
}