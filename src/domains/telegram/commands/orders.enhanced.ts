/**
 * /orders 命令处理器（增强版）
 * 实现完整的订单查询功能
 */

import type { Context } from 'grammy'
import type { Env } from '../../../types/env'
import { TelegramUserService } from '../user.service'
import { OrderService } from '../../order/order.service'

export async function handleOrdersEnhanced(ctx: Context, env: Env) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply('❌ 无法获取用户信息')
    return
  }

  try {
    // 注册或更新用户
    const userService = new TelegramUserService(env)
    await userService.registerOrUpdateUser(ctx.from)

    // 获取用户订单
    const orderService = new OrderService(env)
    const orders = await orderService.getUserOrders(userId.toString())

    if (!orders || orders.length === 0) {
      await ctx.reply('📦 您还没有订单\n\n点击下方按钮开始购物：', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍️ 去购物', web_app: { url: env.SHOP_URL || '' } }]
          ]
        }
      })
      return
    }

    // 显示订单列表
    const message = formatOrderList(orders)
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buildOrderButtons(orders.slice(0, 5))
      }
    })
  } catch (error) {
    console.error('[Orders] Error:', error)
    await ctx.reply('❌ 获取订单列表失败，请稍后重试')
  }
}

/**
 * 格式化订单列表
 */
function formatOrderList(orders: any[]): string {
  let message = '📦 *我的订单*\n\n'

  orders.slice(0, 10).forEach((order, index) => {
    const statusEmoji = getStatusEmoji(order.status)
    message += `${index + 1}. ${statusEmoji} 订单 #${order.ordernum}\n`
    message += `   商品：${order.product_title || '未知'}\n`
    message += `   金额：¥${order.amount}\n`
    message += `   时间：${formatDate(order.created_at)}\n\n`
  })

  if (orders.length > 10) {
    message += `\n_还有 ${orders.length - 10} 个订单..._`
  }

  return message
}

/**
 * 获取状态表情
 */
function getStatusEmoji(status: string): string {
  constemojiMap: Record<string, string> = {
    pending: '⏳',
    paid: '✅',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
  }
  return emojiMap[status] || '❓'
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 构建订单按钮
 */
function buildOrderButtons(orders: any[]): any[] {
  const buttons = orders.map(order => [
    {
      text: `查看订单 #${order.ordernum.slice(-6)}`,
      callback_data: `order_${order.ordernum}`
    }
  ])

  buttons.push([
    { text: '🔄 刷新', callback_data: 'orders_refresh' },
    { text: '🛍️ 继续购物', web_app: { url: process.env.SHOP_URL || '' } }
  ])

  return buttons
}

/**
 * 处理订单详情查询
 */
export async function handleOrderDetail(
  ctx: Context,
  env: Env,
  ordernum: string
) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply('❌ 无法获取用户信息')
    return
  }

  try {
    const orderService = new OrderService(env)
    const order = await orderService.getOrderByOrdernum(ordernum)

    if (!order) {
      await ctx.reply('❌ 订单不存在')
      return
    }

    // 验证订单所有权
    if (order.user_id !== userId.toString()) {
      await ctx.reply('❌ 无权查看此订单')
      return
    }

    // 显示订单详情
    const message = formatOrderDetail(order)
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buildOrderDetailButtons(order)
      }
    })
  } catch (error) {
    console.error('[OrderDetail] Error:', error)
    await ctx.reply('❌ 获取订单详情失败')
  }
}

/**
 * 格式化订单详情
 */
function formatOrderDetail(order: any): string {
  const statusEmoji = getStatusEmoji(order.status)
  
  let message = `📦 *订单详情*\n\n`
  message += `订单号：\`${order.ordernum}\`\n`
  message += `状态：${statusEmoji} ${getStatusText(order.status)}\n`
  message += `商品：${order.product_title || '未知'}\n`
  message += `金额：¥${order.amount}\n`
  message += `创建时间：${formatDate(order.created_at)}\n`

  if (order.status === 'completed' && order.card_info) {
    message += `\n*卡密信息：*\n`
    message += `\`\`\`\n${order.card_info}\n\`\`\``
  }

  if (order.upstream_result) {
    const result = JSON.parse(order.upstream_result)
    if (result.tel) {
      message += `\n📱 电话号码：\`${result.tel}\``
    }
  }

  return message
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return textMap[status] || '未知'
}

/**
 * 构建订单详情按钮
 */
function buildOrderDetailButtons(order: any): any[] {
  const buttons: any[] = []

  if (order.status === 'completed') {
    buttons.push([
      { text: '📱 开始接码', callback_data: `receive_${order.ordernum}` }
    ])
  }

  buttons.push([
    { text: '« 返回订单列表', callback_data: 'orders' }
  ])

  return buttons
}