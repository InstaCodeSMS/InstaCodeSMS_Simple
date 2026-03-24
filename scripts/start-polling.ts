/**
 * Telegram Bot Polling 启动脚本
 * 直接运行: npx tsx scripts/start-polling.ts
 */

import 'dotenv/config'
import { createBot } from '../src/adapters/telegram/bot'

// 从环境变量构建 Env 对象
const env = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL || '',
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  TELEGRAM_ADMIN_SECRET: process.env.TELEGRAM_ADMIN_SECRET || '',
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  UPSTREAM_API_URL: process.env.UPSTREAM_API_URL || '',
  UPSTREAM_API_TOKEN: process.env.UPSTREAM_API_TOKEN || '',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
} as any

async function main() {
  console.log('🤖 Telegram Bot Polling 模式')
  console.log('='.repeat(50))
  console.log(`Bot Token: ${env.TELEGRAM_BOT_TOKEN?.substring(0, 20)}...`)
  console.log('')

  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN 未配置')
    process.exit(1)
  }

  console.log('[Telegram] 正在启动 Bot...')

  try {
    const bot = createBot(env)
    await bot.start()
    console.log('[Telegram] ✅ Bot 已启动！')
    console.log('[Telegram] 在 Telegram 中发送消息测试')
    console.log('')
    console.log('按 Ctrl+C 停止 Bot')
  } catch (error) {
    console.error('[Telegram] ❌ 启动失败:', error)
    process.exit(1)
  }
}

main()