/**
 * /receive 命令处理器
 * 进入接码终端模式
 */

import type { Context } from 'grammy'
import { TelegramService } from '../telegram.service'
import { ReceiveService } from '../receive.service'
import type { Env } from '../../../types/env'

// 全局接码服务实例
let receiveService: ReceiveService | null = null

function getReceiveService(env: Env): ReceiveService {
  if (!receiveService) {
    receiveService = new ReceiveService(env)
  }
  return receiveService
}

export async function handleReceive(ctx: Context, env: Env) {
  try {
    const service = new TelegramService(env)
    const message = service.getReceivePrompt()

    await ctx.reply(message, {
      reply_markup: {
        force_reply: true,
        selective: true
      }
    })
  } catch (error) {
    console.error('Error in handleReceive:', error)
    await ctx.reply('❌ 进入接码终端失败，请稍后重试')
  }
}

/**
 * 处理用户输入的订单号
 */
export async function handleReceiveOrdernum(
  ctx: Context,
  env: Env,
  ordernum: string
) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply('❌ 无法获取用户信息')
    return
  }

  // 验证订单号格式
  if (!ordernum || ordernum.trim().length === 0) {
    await ctx.reply('❌ 订单号不能为空，请重新输入')
    return
  }

  // 发送"开始监听"消息
  const statusMsg = await ctx.reply(
    `⏳ 正在监听订单 ${ordernum}...\n\n等待短信中...`
  )

  // 启动接码会话
  const service = getReceiveService(env)
  await service.startReceiving(userId, ordernum, statusMsg.message_id)

  // 开始轮询
  await startPolling(ctx, env, userId, ordernum, statusMsg.message_id)
}

/**
 * 轮询获取短信验证码
 */
async function startPolling(
  ctx: Context,
  env: Env,
  userId: number,
  ordernum: string,
  messageId: number
) {
  const service = getReceiveService(env)
  let pollCount = 0
  const maxPolls = 60 // 最多轮询 60 次（5 分钟）
  const pollInterval = 5000 // 每 5 秒轮询一次

  const interval = setInterval(async () => {
    try {
      pollCount++

      // 获取短信
      const smsResponse = await service.getSmsCode(ordernum)

      if (smsResponse.status === 'success' && smsResponse.sms) {
        // 收到验证码
        clearInterval(interval)

        const message = `
✅ 收到验证码！

📱 电话号码: \`${smsResponse.tel}\`
📝 验证码: \`${smsResponse.sms}\`
⏰ 有效期至: ${smsResponse.expired_date}`.trim()

        try {
          await ctx.api.editMessageText(userId, messageId, message)
        } catch (error) {
          console.error('Failed to edit message:', error)
          await ctx.api.sendMessage(userId, message)
        }

        service.stopReceiving(userId)
      } else if (pollCount >= maxPolls) {
        // 超时
        clearInterval(interval)
        const timeoutMsg = `⏱️ 监听超时（5分钟）\n\n暂未收到验证码，请稍后重试`

        try {
          await ctx.api.editMessageText(userId, messageId, timeoutMsg)
        } catch (error) {
          console.error('Failed to edit message:', error)
          await ctx.api.sendMessage(userId, timeoutMsg)
        }

        service.stopReceiving(userId)
      } else {
        // 继续等待，更新进度
        const dots = '.'.repeat((pollCount % 3) + 1)
        const progressMsg = `⏳ 正在监听订单 ${ordernum}${dots}\n\n等待短信中... (${pollCount}/${maxPolls})`

        try {
          await ctx.api.editMessageText(userId, messageId, progressMsg)
        } catch (error) {
          console.error('Failed to edit message:', error)
        }
      }
    } catch (error) {
      console.error('Polling error:', error)
      clearInterval(interval)
      service.stopReceiving(userId)
    }
  }, pollInterval)

  service.setPollingInterval(userId, interval)
}

/**
 * 停止接码
 */
export async function handleStop(ctx: Context, env: Env) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply('❌ 无法获取用户信息')
    return
  }

  const service = getReceiveService(env)
  const session = service.getSession(userId)

  if (!session?.isPolling) {
    await ctx.reply('❌ 当前没有活跃的接码会话')
    return
  }

  service.stopReceiving(userId)
  await ctx.reply('⏹️ 已停止接码会话')
}

