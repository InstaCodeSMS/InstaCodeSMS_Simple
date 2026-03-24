#!/usr/bin/env node
/**
 * Telegram Bot 测试脚本
 * 验证 Bot Token 是否有效并测试基本功能
 */

const https = require('https')

// 从 .env 读取配置
require('dotenv').config()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN 未配置')
  console.log('请在 .env 文件中添加: TELEGRAM_BOT_TOKEN=your_token')
  process.exit(1)
}

console.log('🤖 Telegram Bot 测试')
console.log('='.repeat(50))
console.log(`Bot Token: ${BOT_TOKEN.substring(0, 20)}...`)

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
          const json = JSON.parse(data)
          resolve(json)
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

async function runTests() {
  try {
    // 测试 1: 获取 Bot 信息
    console.log('\n📋 测试 1: 获取 Bot 信息...')
    const me = await callApi('getMe')
    
    if (!me.ok) {
      console.error('❌ Bot Token 无效')
      console.error('错误:', me.description)
      process.exit(1)
    }

    console.log('✅ Bot 信息:')
    console.log(`   ID: ${me.result.id}`)
    console.log(`   用户名: @${me.result.username}`)
    console.log(`   名称: ${me.result.first_name}`)
    console.log(`   是否是 Bot: ${me.result.is_bot ? '是' : '否'}`)

    // 测试 2: 获取 Webhook 信息
    console.log('\n📋 测试 2: 获取 Webhook 信息...')
    const webhookInfo = await callApi('getWebhookInfo')
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result
      console.log('✅ Webhook 信息:')
      console.log(`   URL: ${info.url || '未设置'}`)
      console.log(`   待处理更新: ${info.pending_update_count}`)
      
      if (info.url) {
        console.log(`   最后错误: ${info.last_error_message || '无'}`)
        console.log(`   最后错误时间: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : '无'}`)
      }
    }

    // 测试 3: 获取 Bot 命令
    console.log('\n📋 测试 3: 获取 Bot 命令...')
    const commands = await callApi('getMyCommands')
    
    if (commands.ok && commands.result.length > 0) {
      console.log('✅ 已设置的命令:')
      commands.result.forEach(cmd => {
        console.log(`   /${cmd.command} - ${cmd.description}`)
      })
    } else {
      console.log('⚠️  未设置命令')
    }

    // 测试总结
    console.log('\n' + '='.repeat(50))
    console.log('🎉 测试完成!')
    console.log('\n📝 下一步:')
    console.log('1. 在 Telegram 中搜索 @' + me.result.username)
    console.log('2. 发送 /start 命令')
    console.log('3. 如果无响应，运行: npm run dev')
    console.log('4. 设置 Webhook (生产环境):')
    console.log(`   curl -X POST https://instacode.cfd/api/telegram/webhook/set \\`)
    console.log(`     -H "x-admin-token: 6VHPaE7q26HvHn88COqt8bKAfoz3feDn"`)

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

runTests()