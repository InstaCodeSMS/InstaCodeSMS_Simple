/**
 * /receive 命令处理器（增强版）
 * 使用数据库持久化会话
 */

import type { Context } from 'grammy'
import type { Env } from '../../../types/env'
import { TelegramService } from '../telegram.service'
import { ReceiveServiceEnhanced } from '../receive.service.enhanced'
import { TelegramUserService } from '../user.service'

export async function handleReceiveEnhanced(ctx: Context, env: Env) {
  try {
    const userId = ctx.from?.id
    if (!userId) {
      await ctx.reply('❌ 无法获取用户信息')
      return
    }

    // 注册或更新用户
    const userService = new TelegramUserService(env)
    await userService.registerOrUpdateUser(ctx.from)

    const service = new TelegramService(env)
    const message = service.getReceivePrompt()

    await ctx.reply(message, {
      reply_markup: {
        force_reply: true,
        selective: true
      }
    })
  } catch (error) {
    console.error('[Receive] Error:', error)
    await ctx.reply('❌ 进入接码终端失败，请稍后重试')
  }
}

export async function handleReceiveOrdernumEnhanced(
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

  try {
    // 发送"开始监听"消息
    const statusMsg = await ctx.reply(
      `⏳ 正在监听订单 ${ordernum}...\n\n等待短信中...`
    )

    // 启动接码会话
    const receiveService = new ReceiveServiceEnhanced(env)
    const session = await receiveService.startReceiving(
      userId,
      ordernum,
      statusMsg.message_id
    )

    // 开始轮询
    await startPollingEnhanced(ctx, env, session)
  } catch (error: any) {
    console.error('[ReceiveOrdernum] Error:', error)
    if (error.message === '已有活跃的接码会话') {
      await ctx.reply('❌ 您已有一个活跃的接码会话，请先停止或等待完成')
    } else {
      await ctx.reply('❌ 启动接码失败，请稍后重试')
    }
  }
}

/**
 * 轮询获取短信验证码
 */
async function startPollingEnhanced(
  ctx: Context,
  env: Env,
  session: any
) {
  const receiveService = new ReceiveServiceEnhanced(env)
  let pollCount = 0
  const maxPolls = 60 // 最多轮询 60 次（5分钟）
  const pollInterval = 5000 // 每5 秒轮询一次

  const poll = async () => {
    try {
      pollCount++

      // 检查会话是否仍然活跃
      const activeSession = await receiveService.getActiveSession(session.user_id)
      if (!activeSession || activeSession.status !== 'polling') {
        return // 会话已停止
      }

      // 获取短信
      const smsResponse = await receiveService.getSmsCode(session.ordernum)

      if (smsResponse.status === 'success' && smsResponse.sms) {
        // 收到验证码
        await receiveService.markSuccess(session.id, smsResponse)

        const message = `
✅ 收到验证码！

📱 电话号码: \`${smsResponse.tel}\`
📝 验证码: \`${smsResponse.sms}\`
⏰ 有效期至: ${smsResponse.expired_date}`.trim()

        try {
          await ctx.api.editMessageText(
            session.user_id,
            session.message_id,
            message,
            { parse_mode: 'Markdown' }
          )
        } catch (error) {
          console.error('[Poll] Failed to edit message:', error)
          await ctx.api.sendMessage(session.user_id, message, {
            parse_mode: 'Markdown'
          })
        }
      } else if (pollCount >= maxPolls) {
        // 超时
        await receiveService.markTimeout(session.id)

        const timeoutMsg = `⏱️ 监听超时（5分钟）\n\n暂未收到验证码，请稍后重试`

        try {
          await ctx.api.editMessageText(
            session.user_id,
            session.message_id,
            timeoutMsg
          )
        } catch (error) {
          console.error('[Poll] Failed to edit message:', error)
          await ctx.api.sendMessage(session.user_id, timeoutMsg)
        }
      } else {
        // 继续等待，更新进度
        await receiveService.incrementPollCount(session.id)

        const dots = '.'.repeat((pollCount % 3) + 1)
        const progressMsg = `⏳ 正在监听订单 ${session.ordernum}${dots}\n\n等待短信中... (${pollCount}/${maxPolls})`

        try {
          await ctx.api.editMessageText(
            session.user_id,
            session.message_id,
            progressMsg
          )
        } catch (error) {
          //忽略编辑失败（可能消息未变化）
        }

        // 继续轮询
        setTimeout(poll, pollInterval)
      }
    } catch (error) {
      console.error('[Poll] Error:', error)
      await receiveService.markTimeout(session.id)
    }
  }

  // 开始第一次轮询
  setTimeout(poll, pollInterval)
}

/**
 * 停止接码
 */
export async function handleStopEnhanced(ctx: Context, env: Env) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply('❌ 无法获取用户信息')
    return
  }

  try {
    const receiveService = new ReceiveServiceEnhanced(env)
    const session = await receiveService.getActiveSession(userId)

    if (!session || session.status !== 'polling') {
      await ctx.reply('❌ 当前没有活跃的接码会话')
      return
    }

    await receiveService.stopReceiving(userId)
    await ctx.reply('⏹️ 已停止接码会话')
  } catch (error) {
    console.error('[Stop] Error:', error)
    await ctx.reply('❌ 停止接码失败')
  }
}