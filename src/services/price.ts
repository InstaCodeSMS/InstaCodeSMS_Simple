import { ExpiryType } from '../types/api'

/**
 * 价格计算配置
 */
export interface PriceConfig {
  // 基础加价倍率（如 1.5 表示加价 50%）
  markup: number
}

/**
 * 有效期价格调整系数
 * 基于上游文档：
 * - 0: 随机有效期（无调整）
 * - 1: 5-30天（10%折扣）
 * - 2: 10-30天（无调整）
 * - 3: 15-30天（无调整）
 * - 4: 30-60天（无调整）
 * - 5: 60-80天（无调整）
 * - 6: 80天以上（10%加收）
 */
const EXPIRY_MULTIPLIERS: Record<number, number> = {
  [ExpiryType.Random]: 1.0,       // 随机
  [ExpiryType.Days5to30]: 0.9,    // 5-30天 (9折)
  [ExpiryType.Days10to30]: 1.0,   // 10-30天
  [ExpiryType.Days15to30]: 1.0,   // 15-30天
  [ExpiryType.Days30to60]: 1.0,   // 30-60天
  [ExpiryType.Days60to80]: 1.0,   // 60-80天
  [ExpiryType.Days80Plus]: 1.1,   // 80天以上 (加收10%)
}

/**
 * 计算用户价格
 * @param basePrice 上游基础价格（支持字符串或数字）
 * @param markup 加价倍率（如 1.5 表示加价 50%）
 * @param expiry 有效期类型（可选）
 * @returns 最终用户价格
 */
export function calculatePrice(
  basePrice: string | number,
  markup: number = 1.5,
  expiry?: number
): number {
  // 将字符串价格转换为数字
  const numericPrice = typeof basePrice === 'string' 
    ? parseFloat(basePrice) 
    : basePrice

  // 处理无效价格
  if (isNaN(numericPrice)) {
    return 0
  }

  // 获取有效期调整系数
  const expiryMultiplier = expiry !== undefined 
    ? (EXPIRY_MULTIPLIERS[expiry] ?? 1.0) 
    : 1.0

  // 计算最终价格：基础价格 × 加价倍率 × 有效期系数
  const finalPrice = numericPrice * markup * expiryMultiplier

  // 保留两位小数
  return Math.round(finalPrice * 100) / 100
}

/**
 * 计算订单总价
 * @param unitPrice 单价
 * @param quantity 数量
 * @returns 总价
 */
export function calculateTotalPrice(unitPrice: number, quantity: number): number {
  const total = unitPrice * quantity
  return Math.round(total * 100) / 100
}

/**
 * 格式化价格显示
 * @param price 价格
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number): string {
  return price.toFixed(2)
}

/**
 * 获取有效期描述
 * @param expiry 有效期类型
 * @returns 有效期描述
 */
export function getExpiryDescription(expiry: number): string {
  const descriptions: Record<number, string> = {
    [ExpiryType.Random]: '随机有效期',
    [ExpiryType.Days5to30]: '5-30天 (9折)',
    [ExpiryType.Days10to30]: '10-30天',
    [ExpiryType.Days15to30]: '15-30天',
    [ExpiryType.Days30to60]: '30-60天',
    [ExpiryType.Days60to80]: '60-80天',
    [ExpiryType.Days80Plus]: '80天以上 (加收10%)',
  }
  return descriptions[expiry] ?? '未知'
}

/**
 * 从环境变量获取加价倍率
 * @param envValue 环境变量值
 * @returns 加价倍率
 */
export function parseMarkup(envValue?: string): number {
  if (!envValue) return 1.5
  const parsed = parseFloat(envValue)
  return isNaN(parsed) || parsed < 1 ? 1.5 : parsed
}