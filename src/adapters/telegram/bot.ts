/**
 * Telegram Bot 实例
 * 初始化 grammY Bot 并配置中间件
 */

import { Bot, Context } from 'grammy'
import type { Env } from '../../types/env'
import { loggingMiddleware, errorHandlingMiddleware } from './middleware'
import { handleStart } from '../../domains/telegram/commands/start'
import { handleProducts } from '../../domains/telegram/commands/products'
import { handleOrders } from '../../domains/telegram/commands/orders'
import { handleReceive, handleReceiveOrdernum, handleStop } from '../../domains/telegram/commands/receive'
import { handleHelp } from '../../domains/telegram/commands/help'

/**
 * 创建 Bot 实例
 */
export function createBot(env: Env): Bot {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  // 应用自定义中间件
  bot.use(loggingMiddleware)
  bot.use(errorHandlingMiddleware)

  // 注册命令
  bot.command('start', (ctx: Context) => handleStart(ctx, env))
  bot.command('products', (ctx: Context) => handleProducts(ctx, env))
  bot.command('orders', (ctx: Context) => handleOrders(ctx, env))
  bot.command('receive', (ctx: Context) => handleReceive(ctx, env))
  bot.command('stop', (ctx: Context) => handleStop(ctx, env))
  bot.command('help', (ctx: Context) => handleHelp(ctx, env))

  // 处理文本消息（用于接收订单号）
  bot.on('message:text', async (ctx: Context) => {
    const text = ctx.message?.text
    const userId = ctx.from?.id

    // 检查是否是回复消息（用户在回复"请输入订单号"）
    if (ctx.message?.reply_to_message) {
      const replyText = ctx.message.reply_to_message.text

      if (replyText?.includes('请输入订单号')) {
        // 这是用户输入的订单号
        const ordernum = text?.trim()

        if (!ordernum) {
          await ctx.reply('❌ 订单号不能为空')
          return
        }

        // 调用接码逻辑
        await handleReceiveOrdernum(ctx, env, ordernum)
        return
      }
    }

    // 其他文本消息忽略
  })

  // 处理按钮回调
  bot.on('callback_query', async (ctx: Context) => {
    const data = ctx.callbackQuery?.data

    if (data === 'products') {
      await handleProducts(ctx, env)
    } else if (data === 'orders') {
      await handleOrders(ctx, env)
    } else if (data === 'receive') {
      await handleReceive(ctx, env)
    } else if (data === 'help') {
      await handleHelp(ctx, env)
    } else if (data === 'back_to_menu') {
      await handleStart(ctx, env)
    }

    await ctx.answerCallbackQuery()
  })

  return bot
}

/**
 * 获取 Bot 实例
 */
export function getBot(env: Env): Bot {
  return createBot(env)
}

/**
 * 重置 Bot 实例（用于测试）
 */
export function resetBot(): void {
  // 无需重置，每次都创建新实例
}
