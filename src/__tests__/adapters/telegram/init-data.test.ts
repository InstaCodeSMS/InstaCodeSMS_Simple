/**
 * InitData 验证工具函数的单元测试
 */

import { describe, it, expect } from 'vitest'
import { verifyInitData, getUserIdFromInitData, getUserFromInitData } from '../../../adapters/telegram/init-data'
import {
  TEST_BOT_TOKEN,
  TEST_USER_ID,
  generateValidInitData,
  generateInvalidInitData,
  generateExpiredInitData,
} from '../../fixtures/telegram.fixtures'

describe('verifyInitData', () => {
  it('应该验证有效的 InitData', () => {
    const { initDataRaw } = generateValidInitData()

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.user?.id).toBe(TEST_USER_ID)
    expect(result.error).toBeUndefined()
  })

  it('应该拒绝无效的签名', () => {
    const { initDataRaw } = generateInvalidInitData()

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid signature')
    expect(result.data).toBeUndefined()
  })

  it('应该拒绝过期的 InitData', () => {
    const { initDataRaw } = generateExpiredInitData()

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('InitData expired')
    expect(result.data).toBeUndefined()
  })

  it('应该拒绝缺少 hash 的 InitData', () => {
    const initDataRaw = 'user=%7B%22id%22%3A123%7D&auth_date=1234567890'

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing hash in initData')
  })

  it('应该拒绝缺少 initData 的请求', () => {
    const result = verifyInitData('', TEST_BOT_TOKEN)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing initData or botToken')
  })

  it('应该拒绝缺少 botToken 的请求', () => {
    const { initDataRaw } = generateValidInitData()

    const result = verifyInitData(initDataRaw, '')

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing initData or botToken')
  })

  it('应该正确解析用户信息', () => {
    const { initDataRaw } = generateValidInitData({
      user: {
        id: 999,
        is_bot: false,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        is_premium: true,
      },
    })

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(true)
    expect(result.data?.user?.first_name).toBe('John')
    expect(result.data?.user?.last_name).toBe('Doe')
    expect(result.data?.user?.username).toBe('johndoe')
    expect(result.data?.user?.is_premium).toBe(true)
  })

  it('应该处理无效的 JSON 用户数据', () => {
    const now = Math.floor(Date.now() / 1000)
    const initDataRaw = `user=invalid_json&auth_date=${now}&hash=somehash`

    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid user data format')
  })
})

describe('getUserIdFromInitData', () => {
  it('应该从 InitData 中提取用户 ID', () => {
    const { initDataRaw } = generateValidInitData()
    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    if (result.valid && result.data) {
      const userId = getUserIdFromInitData(result.data)
      expect(userId).toBe(TEST_USER_ID)
    }
  })

  it('应该在没有用户信息时返回 null', () => {
    const initData = {
      auth_date: 123456,
      hash: 'abc',
    }

    const userId = getUserIdFromInitData(initData as any)
    expect(userId).toBeNull()
  })
})

describe('getUserFromInitData', () => {
  it('应该从 InitData 中提取用户信息', () => {
    const { initDataRaw } = generateValidInitData()
    const result = verifyInitData(initDataRaw, TEST_BOT_TOKEN)

    if (result.valid && result.data) {
      const user = getUserFromInitData(result.data)

      expect(user).toBeDefined()
      expect(user?.telegramId).toBe(TEST_USER_ID)
      expect(user?.firstName).toBe('Test')
      expect(user?.lastName).toBe('User')
      expect(user?.username).toBe('testuser')
      expect(user?.isPremium).toBe(false)
    }
  })

  it('应该在没有用户信息时返回 null', () => {
    const initData = {
      auth_date: 123456,
      hash: 'abc',
    }

    const user = getUserFromInitData(initData as any)
    expect(user).toBeNull()
  })
})
