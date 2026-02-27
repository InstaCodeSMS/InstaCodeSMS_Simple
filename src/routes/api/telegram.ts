/**
 * Telegram Webhook 路由
 * 接收 Telegram 的 Webhook 更新并分发给 Bot 处理
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { getBot } from '../../adapters/telegram/bot'

const app = new Hono<{ Bindings: Env }>()

/**
 * Telegram 官方 IP 段（用于 IP 白名单验证）
 */
const TELEGRAM_IP_RANGES = [
  '149.154.160.0/22',
  '91.108.4.0/22',
  '91.108.56.0/22',
  '109.239.140.0/24',
  '149.154.164.0/22',
  '149.154.168.0/22'
]

/**
 * 检查 IP 是否在白名单中
 */
function isIpInRange(ip: string, range: string): boolean {
  const [rangeIp, bits] = range.split('/')
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(rangeIp)
  const mask = -1 << (32 - parseInt(bits))
  return (ipNum & mask) === (rangeNum & mask)
}

/**
 * 将 IP 地址转换为数字
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.')
  return parts.reduce((acc, part, i) => {
    return acc + parseInt(part) * Math.pow(256, 3 - i)
  }, 0)
}

/**
 * 验证 IP 白名单
 */
function verifyIpWhitelist(clientIp: string | undefined): boolean {
  if (!clientIp) {
    console.warn('[Telegram] No client IP found')
    return false
  }

  return TELEGRAM_IP_RANGES.some(range => isIpInRange(clientIp, range))
}

/**
 * POST /api/telegram/webhook
 * 接收 Telegram 的 Webhook 更新
 */
app.post('/webhook', async (c) => {
  try {
    // 获取客户端 IP
    const clientIp = c.req.header('cf-connecting-ip') ||
                     c.req.header('x-forwarded-for')?.split(',')[0].trim()

    // 验证 IP 白名单
    if (!verifyIpWhitelist(clientIp)) {
      console.warn(`[Telegram] Unauthorized IP: ${clientIp}`)
      return c.json({ ok: false, error: 'Unauthorized IP' }, 403)
    }

    // 解析请求体
    const update = await c.req.json()

    // 获取 Bot 实例并处理更新
    const bot = getBot(c.env)
    await bot.handleUpdate(update)

    return c.json({ ok: true })
  } catch (error) {
    console.error('[Telegram] Webhook error:', error)
    return c.json({ ok: false, error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/telegram/webhook/set
 * 设置 Webhook URL（管理员使用）
 */
app.get('/webhook/set', async (c) => {
  try {
    const webhookUrl = c.env.TELEGRAM_WEBHOOK_URL

    if (!webhookUrl) {
      return c.json(
        {
          success: false,
          message: 'TELEGRAM_WEBHOOK_URL not configured'
        },
        400
      )
    }

    const bot = getBot(c.env)

    // 设置 Webhook
    const result = await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ['message', 'callback_query']
    })

    console.log('[Telegram] Webhook set successfully:', result)

    return c.json({
      success: true,
      message: 'Webhook set successfully',
      result
    })
  } catch (error) {
    console.error('[Telegram] Failed to set webhook:', error)
    return c.json(
      {
        success: false,
        message: 'Failed to set webhook',
        error: String(error)
      },
      500
    )
  }
})

/**
 * GET /api/telegram/webhook/info
 * 获取 Webhook 信息
 */
app.get('/webhook/info', async (c) => {
  try {
    const bot = getBot(c.env)
    const info = await bot.api.getWebhookInfo()

    return c.json({
      success: true,
      data: info
    })
  } catch (error) {
    console.error('[Telegram] Failed to get webhook info:', error)
    return c.json(
      {
        success: false,
        error: String(error)
      },
      500
    )
  }
})

export default app
