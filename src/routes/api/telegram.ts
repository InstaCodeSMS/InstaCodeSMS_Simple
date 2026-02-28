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
  const [a, b, c, d] = ip.split('.').map(Number)
  return ((a << 24) + (b << 16) + (c << 8) + d) >>> 0
}

/**
 * 验证管理员权限
 */
function verifyAdminSecret(token: string | undefined, adminSecret: string | undefined): boolean {
  if (!adminSecret || !token) return false
  return token === adminSecret
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
    // 获取客户端 IP（仅使用 Cloudflare 设置的 IP，x-forwarded-for 可被伪造）
    const clientIp = c.req.header('cf-connecting-ip')

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
 * POST /api/telegram/webhook/set
 * 设置 Webhook URL（管理员使用）
 */
app.post('/webhook/set', async (c) => {
  try {
    // 验证管理员权限
    const adminToken = c.req.header('x-admin-token')
    if (!verifyAdminSecret(adminToken, c.env.ADMIN_SECRET)) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

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
        message: 'Failed to set webhook'
      },
      500
    )
  }
})

/**
 * POST /api/telegram/webhook/info
 * 获取 Webhook 信息
 */
app.post('/webhook/info', async (c) => {
  try {
    // 验证管理员权限
    const adminToken = c.req.header('x-admin-token')
    if (!verifyAdminSecret(adminToken, c.env.ADMIN_SECRET)) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

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
        message: 'Failed to get webhook info'
      },
      500
    )
  }
})

/**
 * POST /api/telegram/menu/set
 * 设置菜单按钮（管理员使用）
 */
app.post('/menu/set', async (c) => {
  try {
    // 验证管理员权限
    const adminToken = c.req.header('x-admin-token')
    if (!verifyAdminSecret(adminToken, c.env.ADMIN_SECRET)) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }

    const shopUrl = c.env.SHOP_URL || 'https://yoursite.com/purchase'
    const bot = getBot(c.env)

    const result = await bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: '🛍️ 商城',
        web_app: {
          url: shopUrl
        }
      }
    })

    return c.json({
      success: true,
      message: 'Menu button set successfully',
      data: {
        text: '🛍️ 商城',
        url: shopUrl
      }
    })
  } catch (error) {
    console.error('[Telegram] Failed to set menu button:', error)
    return c.json(
      {
        success: false,
        message: 'Failed to set menu button'
      },
      500
    )
  }
})

export default app
