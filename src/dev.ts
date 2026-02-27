/**
 * 本地开发入口
 * 使用 Polling 模式运行 Telegram Bot
 */

import { startPolling } from './adapters/telegram/polling'
import { config } from 'dotenv'

// 加载 .env 文件
config()

// 调试输出：检查关键环境变量是否加载
console.log('[Debug] 环境变量加载状态:')
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
console.log('  SUPABASE_PUBLISHABLE_KEY:', process.env.SUPABASE_PUBLISHABLE_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ 已设置' : '❌ 未设置')

const env = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  UPSTREAM_API_URL: process.env.UPSTREAM_API_URL,
  UPSTREAM_API_TOKEN: process.env.UPSTREAM_API_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  BEPUSDT_API_URL: process.env.BEPUSDT_API_URL,
  BEPUSDT_API_TOKEN: process.env.BEPUSDT_API_TOKEN,
}

// 验证必需的环境变量
const requiredVars = [
  'TELEGRAM_BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_KEY',
]

const missing = requiredVars.filter(key => !process.env[key])
if (missing.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missing.join(', '))
  console.error('   请检查 .env 文件中的变量名是否正确')
  process.exit(1)
}

// 启动 Bot
startPolling(env as any).catch((error) => {
  console.error('❌ Failed to start bot:', error)
  process.exit(1)
})
