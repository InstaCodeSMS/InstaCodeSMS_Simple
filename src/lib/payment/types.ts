/**
 * 支付模块类型定义
 * 统一的支付类型，支持多种支付方式
 */

/**
 * 支付方式枚举
 */
export type PaymentMethod = 'usdt' | 'alipay'

/**
 * 支付订单状态
 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 1,
  /** 支付成功 */
  PAID = 2,
  /** 支付超时 */
  TIMEOUT = 3,
  /** 已取消 */
  CANCELLED = 4,
}

/**
 * 产品信息快照（用于创建订单时保存）
 */
export interface ProductSnapshot {
  /** 服务 ID */
  service_id: number
  /** 服务标题 */
  title: string
  /** 数量 */
  quantity: number
  /** 有效期选项 */
  expiry: number
  /** 有效期天数描述 */
  expiry_days: string
  /** 单价 */
  unit_price: number
}

/**
 * 创建支付订单请求
 */
export interface CreatePaymentRequest {
  /** 本地订单号 */
  order_id: string
  /** 金额 (CNY) */
  amount: number
  /** 支付方式 */
  payment_method: PaymentMethod
  /** 交易类型 (USDT专用，如 usdt.trc20) */
  trade_type?: string
  /** 产品信息快照 */
  product_info: ProductSnapshot
}

/**
 * 创建支付订单响应
 */
export interface CreatePaymentResponse {
  /** 交易 ID */
  trade_id: string
  /** 本地订单号 */
  order_id: string
  /** 支付方式 */
  payment_method: PaymentMethod
  /** 订单状态 */
  status: PaymentStatus
  /** 过期时间（秒） */
  expiration_time: number

  // USDT 专属字段
  /** 收款地址 */
  token?: string
  /** 实际支付金额（USDT） */
  actual_amount?: string
  /** 收银台链接 */
  payment_url?: string
  /** 法币类型 */
  fiat?: string

  // 支付宝专属字段
  /** 收款码图片 URL */
  qr_code_url?: string
  /** 收款码图片 base64 */
  qr_code?: string
  /** 显示金额（带偏移） */
  display_amount?: number
}

/**
 * 查询支付状态响应
 */
export interface PaymentStatusResponse {
  /** 交易 ID */
  trade_id: string
  /** 本地订单号 */
  order_id: string
  /** 订单状态 */
  status: PaymentStatus
  /** 支付时间 */
  paid_at?: string
  /** 实际支付金额 */
  actual_amount?: string
  /** 区块链交易哈希（USDT专用） */
  block_transaction_id?: string
}

/**
 * 支付回调数据
 */
export interface PaymentCallbackData {
  /** 交易 ID */
  trade_id: string
  /** 本地订单号 */
  order_id: string
  /** 请求支付金额（法币） */
  amount: number | string
  /** 实际支付金额（加密货币） */
  actual_amount: number | string
  /** 收款地址 */
  token: string
  /** 区块链交易哈希 */
  block_transaction_id?: string
  /** 签名 */
  signature: string
  /** 订单状态 */
  status: number
}

/**
 * 支付订单数据（存储到数据库）
 */
export interface PaymentOrder {
  /** 交易 ID（主键） */
  trade_id: string
  /** 本地订单号 */
  order_id: string
  /** 支付方式 */
  payment_method: PaymentMethod
  /** 金额（CNY） */
  amount: number
  /** 实际支付金额 */
  actual_amount?: number
  /** 订单状态 */
  status: PaymentStatus
  /** 产品信息快照（JSON） */
  product_info: ProductSnapshot
  /** 收款地址/收款码 */
  token?: string
  /** 交易类型 */
  trade_type?: string
  /** 过期时间 */
  expiration_time: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
  /** 支付时间 */
  paid_at?: string
  /** 区块链交易哈希 */
  block_transaction_id?: string
}