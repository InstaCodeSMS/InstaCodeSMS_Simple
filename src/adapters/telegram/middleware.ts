/**
 * Telegram Bot 中间件
 * 处理日志、错误处理等
 */

import type { Context } from 'grammy'

/**
 * 日志中间件
 */
export async function loggingMiddleware(ctx: Context, next: () => Promise<void>) {
  const start = Date.now()
  const update = ctx.update

  console.log(`[Telegram] Received update:`, {
    updateId: update.update_id,
    type: update.message ? 'message' : update.callback_query ? 'callback_query' : 'unknown',
    userId: update.message?.from?.id || update.callback_query?.from?.id,
    timestamp: new Date().toISOString()
  })

  try {
    await next()
  } catch (error) {
    console.error(`[Telegram] Error processing update ${update.update_id}:`, error)
    throw error
  }

  const duration = Date.now() - start
  console.log(`[Telegram] Update ${update.update_id} processed in ${duration}ms`)
}

/**
 * 错误处理中间件
 */
export async function errorHandlingMiddleware(ctx: Context, next: () => Promise<void>) {
  try {
    await next()
  } catch (error) {
    console.error('[Telegram] Middleware error:', error)

    // 尝试发送错误消息给用户
    try {
      if (ctx.from?.id) {
        await ctx.reply('❌ 发生错误，请稍后重试')
      }
    } catch (replyError) {
      console.error('[Telegram] Failed to send error message:', replyError)
    }
  }
}
