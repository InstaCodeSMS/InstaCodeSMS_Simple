/**
 * Telegram Mini App InitData 签名验证
 * 确保请求真的来自 Telegram，而不是黑客伪造
 */

import { createHmac } from 'crypto'
import type { InitData, VerifyInitDataResult } from '../../types/telegram'

/**
 * 验证 Telegram Mini App 的 InitData 签名
 *
 * @param initDataRaw - 原始的 initData 字符串（来自 window.Telegram.WebApp.initData）
 * @param botToken - Telegram Bot Token
 * @returns 验证结果和解析后的数据
 *
 * @example
 * const result = verifyInitData(initDataRaw, botToken)
 * if (result.valid) {
 *   console.log(result.data?.user?.id)
 * }
 */
export function verifyInitData(
  initDataRaw: string,
  botToken: string
): VerifyInitDataResult {
  try {
    // 参数验证
    if (!initDataRaw || !botToken) {
      return { valid: false, error: 'Missing initData or botToken' }
    }

    // 解析 initData
    const params = new URLSearchParams(initDataRaw)
    const hash = params.get('hash')

    if (!hash) {
      return { valid: false, error: 'Missing hash in initData' }
    }

    // 移除 hash，获取其他参数
    params.delete('hash')

    // 按字母顺序排序参数，格式为 key=value\nkey=value
    const sortedParams = Array.from(params.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // 计算签名
    // 步骤1：用 Bot Token 生成密钥
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // 步骤2：用密钥对排序后的参数进行 HMAC-SHA256
    const calculatedHash = createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex')

    // 步骤3：比较签名（使用恒定时间比较防时序攻击）
    if (!constantTimeCompare(calculatedHash, hash)) {
      return { valid: false, error: 'Invalid signature' }
    }

    // 步骤4：检查时间戳（防止重放攻击）
    const authDate = parseInt(params.get('auth_date') || '0', 10)
    const now = Math.floor(Date.now() / 1000)
    const maxAge = 86400 // 24 小时

    if (now - authDate > maxAge) {
      return { valid: false, error: 'InitData expired' }
    }

    // 步骤5：解析用户信息
    const userData = params.get('user')
    let user: any = undefined

    if (userData) {
      try {
        user = JSON.parse(userData)
      } catch (e) {
        return { valid: false, error: 'Invalid user data format' }
      }
    }

    // 构建返回的 InitData 对象
    const data: InitData = {
      user,
      auth_date: authDate,
      hash,
    }

    // 添加其他参数
    for (const [key, value] of params.entries()) {
      if (key !== 'user' && key !== 'auth_date') {
        data[key] = value
      }
    }

    return { valid: true, data }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 恒定时间比较（防时序攻击）
 * 防止攻击者通过比较耗时来推断正确的签名
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * 从 InitData 中提取用户 ID
 */
export function getUserIdFromInitData(initData: InitData): number | null {
  return initData.user?.id ?? null
}

/**
 * 从 InitData 中提取用户信息
 */
export function getUserFromInitData(initData: InitData) {
  if (!initData.user) {
    return null
  }

  return {
    telegramId: initData.user.id,
    firstName: initData.user.first_name,
    lastName: initData.user.last_name,
    username: initData.user.username,
    isPremium: initData.user.is_premium,
    authDate: initData.auth_date,
  }
}
