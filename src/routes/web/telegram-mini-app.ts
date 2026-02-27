/**
 * Telegram Mini App Web 路由
 * 渲染 Mini App 页面
 */

import { Hono } from 'hono'
import TelegramMiniAppIndex from '../../views/telegram-mini-app/index'
import TelegramMiniAppCheckout from '../../views/telegram-mini-app/checkout'
import TelegramMiniAppSuccess from '../../views/telegram-mini-app/success'

const app = new Hono()

/**
 * GET /telegram-mini-app
 * Mini App 主页面
 */
app.get('/', (c) => {
  return c.html(TelegramMiniAppIndex())
})

/**
 * GET /telegram-mini-app/checkout
 * 结算页面
 */
app.get('/checkout', (c) => {
  return c.html(TelegramMiniAppCheckout())
})

/**
 * GET /telegram-mini-app/success
 * 成功页面
 */
app.get('/success', (c) => {
  return c.html(TelegramMiniAppSuccess())
})

export default app
