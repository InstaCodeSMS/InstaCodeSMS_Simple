/**
 * Webhooks 路由汇总
 * 
 * 路由结构：
 * - /api/webhooks/payment/epay - EPay 支付回调
 * 
 * 注意：Telegram Webhook 保持在 /api/telegram/webhook
 */

import { Hono } from 'hono'
import type { Env } from '../../../types/env'
import epayWebhook from './payment/epay'

const app = new Hono<{ Bindings: Env }>()

// EPay 支付回调: /api/webhooks/payment/epay
app.route('/payment/epay', epayWebhook)

export default app
