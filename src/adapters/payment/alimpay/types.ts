/**
 * AliMPay (CodePay 协议) 类型定义
 * 基于 https://github.com/MiaM1ku/AliMPay
 */

/**
 * 支付类型
 */
export type PaymentType = 'alipay'

/**
 * 签名类型
 */
export type SignType = 'MD5'

/**
 * 创建支付订单请求参数
 */
export interface CreatePaymentParams {
  /** 商户 ID */
  pid: string
  /** 支付类型，固定为 alipay */
  type: PaymentType
  /** 商户订单号 */
  out_trade_no: string
  /** 支付成功回调地址 */
  notify_url: string
  /** 支付完成跳转地址 */
  return_url: string
  /** 商品名称 */
  name: string
  /** 支付金额 */
  money: string | number
  /** 网站名称（可选） */
  sitename?: string
  /** 签名 */
  sign: string
  /** 签名类型 */
  sign_type: SignType
}

/**
 * 创建支付订单响应
 */
export interface CreatePaymentResponse {
  /** 状态码，1 成功，-1 失败 */
  code: 1 | -1
  /** 消息 */
  msg: string
  /** 商户 ID */
  pid?: string
  /** 平台订单号 */
  trade_no?: string
  /** 商户订单号 */
  out_trade_no?: string
  /** 原始金额 */
  money?: string
  /** 实际支付金额（经营码模式可能有偏移） */
  payment_amount?: number
  /** 支付链接 */
  payment_url?: string
  /** 二维码（base64，传统转账模式） */
  qr_code?: string
  /** 二维码链接（经营码模式） */
  qr_code_url?: string
  /** 是否为经营码模式 */
  business_qr_mode?: boolean
  /** 支付提示 */
  payment_tips?: string[]
}

/**
 * 查询订单响应
 */
export interface QueryOrderResponse {
  /** 状态码 */
  code: 1 | -1
  /** 消息 */
  msg: string
  /** 平台订单号 */
  trade_no?: string
  /** 商户订单号 */
  out_trade_no?: string
  /** 支付类型 */
  type?: string
  /** 商户 ID */
  pid?: string
  /** 创建时间 */
  addtime?: string
  /** 支付时间 */
  endtime?: string
  /** 商品名称 */
  name?: string
  /** 金额 */
  money?: string
  /** 订单状态：0 待支付，1 已支付 */
  status?: 0 | 1
}

/**
 * 查询商户信息响应
 */
export interface QueryMerchantResponse {
  /** 状态码 */
  code: 1 | -1
  /** 消息 */
  msg?: string
  /** 商户 ID */
  pid?: number
  /** 商户密钥 */
  key?: string
  /** 是否激活 */
  active?: number
  /** 余额 */
  money?: string
  /** 账户 */
  account?: string
  /** 用户名 */
  username?: string
  /** 费率 */
  rate?: string
}

/**
 * 支付回调通知参数
 */
export interface CallbackParams {
  /** 商户 ID */
  pid: string
  /** 平台订单号 */
  trade_no: string
  /** 商户订单号 */
  out_trade_no: string
  /** 支付类型 */
  type: string
  /** 商品名称 */
  name: string
  /** 金额 */
  money: string
  /** 交易状态 */
  trade_status: 'TRADE_SUCCESS' | 'TRADE_CLOSED' | 'WAIT_BUYER_PAY'
  /** 签名 */
  sign: string
  /** 签名类型 */
  sign_type: SignType
}

/**
 * AliMPay 配置
 */
export interface AlimpayConfig {
  /** API 地址 */
  apiUrl: string
  /** 商户 ID */
  pid: string
  /** 商户密钥 */
  key: string
}
