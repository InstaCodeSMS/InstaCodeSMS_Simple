/**
 * Telegram 测试数据
 */

import { createHmac } from 'crypto'

// 测试用的 Bot Token
export const TEST_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'

// 测试用户 ID
export const TEST_USER_ID = 123456789

/**
 * 生成有效的 InitData
 * @param overrides - 覆盖默认值
 */
export function generateValidInitData(overrides?: Record<string, any>) {
  const now = Math.floor(Date.now() / 1000)

  const user = {
    id: TEST_USER_ID,
    is_bot: false,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en',
    is_premium: false,
    ...overrides?.user,
  }

  // 构建所有参数（包括 user）
  const params: Record<string, string> = {
    user: JSON.stringify(user),
    auth_date: now.toString(),
    chat_instance: '123456789',
    chat_type: 'private',
  }

  // 应用覆盖（但不覆盖 user）
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      if (key !== 'user') {
        params[key] = String(value)
      }
    })
  }

  // 按字母顺序排序参数并格式化为 key=value\nkey=value
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // 计算签名
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(TEST_BOT_TOKEN)
    .digest()

  const hash = createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex')

  // 构建 initData 字符串（URL 编码）
  const initDataRaw = `user=${encodeURIComponent(JSON.stringify(user))}&auth_date=${now}&hash=${hash}&chat_instance=123456789&chat_type=private`

  return {
    initDataRaw,
    user,
    authDate: now,
    hash,
  }
}

/**
 * 生成无效的 InitData（错误的签名）
 */
export function generateInvalidInitData() {
  const now = Math.floor(Date.now() / 1000)

  const user = {
    id: TEST_USER_ID,
    is_bot: false,
    first_name: 'Test',
  }

  // 使用错误的签名
  const invalidHash = 'invalid_hash_' + Math.random().toString(36).substring(7)

  const initDataRaw = `user=${encodeURIComponent(JSON.stringify(user))}&auth_date=${now}&hash=${invalidHash}`

  return {
    initDataRaw,
    user,
    authDate: now,
    hash: invalidHash,
  }
}

/**
 * 生成过期的 InitData
 */
export function generateExpiredInitData() {
  const expiredTime = Math.floor(Date.now() / 1000) - 86400 * 2 // 2 天前

  const user = {
    id: TEST_USER_ID,
    is_bot: false,
    first_name: 'Test',
  }

  // 构建所有参数
  const params: Record<string, string> = {
    user: JSON.stringify(user),
    auth_date: expiredTime.toString(),
  }

  // 按字母顺序排序参数
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // 计算签名
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(TEST_BOT_TOKEN)
    .digest()

  const hash = createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex')

  const initDataRaw = `user=${encodeURIComponent(JSON.stringify(user))}&auth_date=${expiredTime}&hash=${hash}`

  return {
    initDataRaw,
    user,
    authDate: expiredTime,
    hash,
  }
}
