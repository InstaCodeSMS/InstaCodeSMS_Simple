/**
 * E-pay 支付类型定义
 */

export interface EpayConfig {
  apiUrl: string
  pid: string
  key: string
  signType?: 'MD5' | 'RSA'
}

export interface EpayCreatePaymentRequest {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  returnUrl: string
  channel?: 'wechat' | 'alipay' | 'qq'
}

export interface EpayPaymentResponse {
  trade_no: string
  payment_url?: string
  qr_code?: string
  qr_code_url?: string
  payment_amount?: number
}

export interface EpayCallbackData {
  pid: string
  trade_no: string
  out_trade_no: string
  type: string
  name: string
  money: string
  trade_status: string
  sign: string
  sign_type: string
}
