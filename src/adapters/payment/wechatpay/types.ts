/**
 * WeChat Pay 支付类型定义
 */

export interface WeChatPayConfig {
  merchantId: string
  apiV3Key: string
  privateKey: string
  certificate: string
}

export interface WeChatPayCreatePaymentRequest {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  redirectUrl: string
  tradeType?: 'NATIVE' | 'H5'
}

export interface WeChatPaymentResponse {
  trade_id: string
  payment_url?: string
  qr_code?: string
  actual_amount?: number
}

export interface WeChatPayWebhookData {
  id: string
  create_time: string
  event_type: string
  resource: {
    original_type: string
    algorithm: string
    ciphertext: string
    associated_data: string
    nonce: string
  }
}
