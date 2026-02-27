/**
 * Telegram Mini App API 集成测试
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Hono } from 'hono'
import type { Env } from '../../../types/env'
import telegramMiniAppApi from '../../../routes/api/telegram-mini-app'
import {
  TEST_BOT_TOKEN,
  generateValidInitData,
  generateInvalidInitData,
} from '../../fixtures/telegram.fixtures'

// 模拟环境变量
const mockEnv: Env = {
  UPSTREAM_API_URL: 'https://api.example.com',
  UPSTREAM_API_TOKEN: 'test-token',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SERVICE_KEY: 'test-service-key',
  BEPUSDT_API_URL: 'https://bepusdt.example.com',
  BEPUSDT_API_TOKEN: 'test-token',
  TELEGRAM_BOT_TOKEN: TEST_BOT_TOKEN,
}

describe('Telegram Mini App API', () => {
  describe('POST /verify', () => {
    it('应该验证有效的 InitData', async () => {
      const { initDataRaw } = generateValidInitData()

      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: initDataRaw }),
        }),
        mockEnv
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('验证成功')
      expect(data.data?.user?.telegramId).toBe(123456789)
      expect(data.data?.user?.firstName).toBe('Test')
    })

    it('应该拒绝无效的 InitData', async () => {
      const { initDataRaw } = generateInvalidInitData()

      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: initDataRaw }),
        }),
        mockEnv
      )

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('验证失败')
    })

    it('应该拒绝缺少 initData 的请求', async () => {
      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }),
        mockEnv
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toBe('缺少 initData')
    })
  })

  describe('GET /user', () => {
    it('应该返回认证用户信息', async () => {
      const { initDataRaw } = generateValidInitData()

      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/user', {
          method: 'GET',
          headers: {
            'X-TG-InitData': initDataRaw,
          },
        }),
        mockEnv
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('获取用户信息成功')
      expect(data.data?.telegramId).toBe(123456789)
      expect(data.data?.firstName).toBe('Test')
    })

    it('应该拒绝缺少认证头的请求', async () => {
      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/user', {
          method: 'GET',
        }),
        mockEnv
      )

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toBe('Missing authentication data')
    })

    it('应该拒绝无效的认证头', async () => {
      const { initDataRaw } = generateInvalidInitData()

      const app = new Hono<{ Bindings: Env }>()
      app.route('/api/telegram-mini-app', telegramMiniAppApi)

      const response = await app.fetch(
        new Request('http://localhost/api/telegram-mini-app/user', {
          method: 'GET',
          headers: {
            'X-TG-InitData': initDataRaw,
          },
        }),
        mockEnv
      )

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toBe('Authentication failed')
    })
  })
})
