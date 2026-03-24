#!/usr/bin/env node
/**
 * Telegram Webhook 管理脚本
 * 用于删除和恢复 Webhook
 */

const https = require('https')

// 从 .env 读取配置
require('dotenv').config()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN 未配置')
  process.exit(1)
}

// 调用 Telegram API
function callApi(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
    const body = JSON.stringify(params)
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 获取命令参数
const action = process.argv[2]

async function main() {
  console.log('🤖 Telegram Webhook 管理')
  console.log('='.repeat(50))

  switch (action) {
    case 'delete':
    case 'del':
      console.log('\n📋 删除 Webhook...')
      const delResult = await callApi('deleteWebhook')
      if (delResult.ok) {
        console.log('✅ Webhook 已删除')
        console.log('💡 现在可以使用 Polling 模式测试 Bot')
      } else {
        console.error('❌ 删除失败:', delResult.description)
      }
      break

    case 'set':
    case 'restore':
      if (!WEBHOOK_URL) {
        console.error('❌ TELEGRAM_WEBHOOK_URL 未配置')
        process.exit(1)
      }
      console.log('\n📋 设置 Webhook...')
      console.log(`   URL: ${WEBHOOK_URL}`)
      
      const setResult = await callApi('setWebhook', {
        url: WEBHOOK_URL,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'successful_payment']
      })
      
      if (setResult.ok) {
        console.log('✅ Webhook 已设置')
        console.log('💡 Bot 现在通过 Webhook 接收更新')
      } else {
        console.error('❌ 设置失败:', setResult.description)
      }
      break

    case 'info':
    case 'status':
      console.log('\n📋 获取 Webhook 信息...')
      const info = await callApi('getWebhookInfo')
      if (info.ok) {
        const wh = info.result
        console.log('✅ Webhook 信息:')
        console.log(`   URL: ${wh.url || '未设置'}`)
        console.log(`   待处理更新: ${wh.pending_update_count}`)
        if (wh.last_error_message) {
          console.log(`   ⚠️ 最后错误: ${wh.last_error_message}`)
        }
      }
      break

    default:
      console.log('\n用法:')
      console.log('  node scripts/telegram-webhook.cjs delete  - 删除 Webhook')
      console.log('  node scripts/telegram-webhook.cjs set     - 设置 Webhook')
      console.log('  node scripts/telegram-webhook.cjs info    - 查看 Webhook 状态')
      console.log('\n📝 测试流程:')
      console.log('  1. node scripts/telegram-webhook.cjs delete')
      console.log('  2. npx tsx src/adapters/telegram/polling.ts')
      console.log('  3. 在 Telegram 测试 Bot')
      console.log('  4. node scripts/telegram-webhook.cjs set')
  }
}

main().catch(console.error)