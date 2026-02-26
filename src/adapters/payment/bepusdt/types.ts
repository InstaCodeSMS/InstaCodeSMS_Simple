/**
 * BEpusdt API 类型定义
 * 基于 BEpusdt API 文档：https://github.com/v03413/BEpusdt
 */

/**
 * BEpusdt 支持的交易类型
 */
export type TradeType =
  | 'usdt.trc20'
  | 'usdt.erc20'
  | 'usdt.bep20'
  | 'usdt.polygon'
  | 'usdc.trc20'
  | 'usdc.erc20'
  | 'usdc.polygon'
  | 'tron.trx'
  | 'eth.eth'
  | 'bnb.bsc'

/**
 * BEpusdt 创建交易请求
 */
export interface BepusdtCreateTransactionRequest {
  /** 商户订单编号（唯一标识） */
  order_id: string
  /** 支付金额（法币金额） */
  amount: number
  /** 支付结果异步回调地址 */
  notify_url: string
  /** 支付成功后商户跳转地址 */
  redirect_url: string
  /** 签名字符串 */
  signature: string
  /** 交易类型，默认 usdt.trc20 */
  trade_type?: TradeType
  /** 法币类型，默认 CNY */
  fiat?: 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY'
  /** 指定收款地址（留空则自动分配） */
  address?: string
  /** 商品名称 */
  name?: string
  /** 订单超时时间（秒），最低 120 秒 */
  timeout?: number
  /** 强制指定汇率 */
  rate?: string
}

/**
 * BEpusdt 创建交易响应数据
 */
export interface BepusdtTransactionData {
  /** 交易法币类型 */
  fiat: string
  /** 系统交易 ID */
  trade_id: string
  /** 商户订单编号 */
  order_id: string
  /** 请求支付金额（法币） */
  amount: string
  /** 实际支付金额（加密货币） */
  actual_amount: string
  /** 订单状态，1 表示待付款 */
  status: number
  /** 收款地址 */
  token: string
  /** 订单有效期（秒） */
  expiration_time: number
  /** 收银台付款链接地址 */
  payment_url: string
}

/**
 * BEpusdt API 响应
 */
export interface BepusdtApiResponse<T = unknown> {
  /** 状态码，200 表示成功 */
  status_code: number
  /** 响应消息 */
  message: string
  /** 数据 */
  data?: T
  /** 请求 ID */
  request_id: string
}

/**
 * BEpusdt 取消交易请求
 */
export interface BepusdtCancelTransactionRequest {
  /** 系统交易 ID */
  trade_id: string
  /** 签名字符串 */
  signature: string
}

/**
 * BEpusdt 回调通知数据
 */
export interface BepusdtCallbackData {
  /** 系统交易 ID */
  trade_id: string
  /** 商户订单编号 */
  order_id: string
  /** 请求支付金额（法币） */
  amount: number | string
  /** 实际支付金额（加密货币） */
  actual_amount: number | string
  /** 收款地址 */
  token: string
  /** 区块链交易哈希 */
  block_transaction_id: string
  /** 签名字符串 */
  signature: string
  /** 订单状态：1=等待支付，2=支付成功，3=支付超时 */
  status: number
}

/**
 * BEpusdt 付款方式
 */
export interface BepusdtPaymentMethod {
  /** 应付金额（法币） */
  amount: string
  /** 实际支付金额（加密货币） */
  actual_amount: string
  /** 应付金额法币单位 */
  fiat: string
  /** 汇率 */
  exchange_rate: string
  /** 货币名称 */
  currency: string
  /** 网络名称 */
  network: string
  /** 代币协议标准名 */
  token_net_name: string
  /** 用户自定义显示名称 */
  token_custom_name: string
  /** 是否为流行网络 */
  is_popular: boolean
}

/**
 * BEpusdt 查询付款方式响应数据
 */
export interface BepusdtMethodsData {
  /** 可用付款方式列表 */
  methods: BepusdtPaymentMethod[]
}
