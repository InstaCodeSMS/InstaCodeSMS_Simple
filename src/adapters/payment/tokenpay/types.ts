/**
 * Token Pay 支付类型定义
 */

export interface TokenPayConfig {
  apiUrl: string
  merchantId: string
  apiKey: string
}

export interface TokenPayCreatePaymentRequest {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  redirectUrl: string
  currency?: 'USDT' | 'TRX'
}

export interface TokenPayPaymentResponse {
  trade_id: string
  payment_url?: string
  qr_code?: string
  actual_amount?: number
}

export interface TokenPayCallbackData {
  merchant_id: string
  order_id: string
  trade_id: string
  amount: string
  currency: string
  status: string
  timestamp: string
  sign: string
}
