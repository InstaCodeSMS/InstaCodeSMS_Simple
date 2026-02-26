/**
 * 业务相关常量
 */

// 订单状态
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const

// 支付方式
export const PAYMENT_METHOD = {
  ALIPAY: 'alipay',
  USDT: 'usdt',
  WECHAT: 'wechat',
} as const

// 商品类型
export const PRODUCT_TYPE = {
  SMS: 'sms',
  VOICE: 'voice',
  CARD: 'card',
} as const

// 价格标记（加价倍数）
export const PRICE_MARKUP_DEFAULT = 1.0

// 订单过期时间（小时）
export const ORDER_EXPIRY_HOURS = 24

// 验证码有效期（分钟）
export const SMS_VALIDITY_MINUTES = 10

// 最大重试次数
export const MAX_RETRIES = 3

// 缓存过期时间（秒）
export const CACHE_TTL = {
  SHORT: 300,      // 5 分钟
  MEDIUM: 3600,    // 1 小时
  LONG: 86400,     // 24 小时
} as const
