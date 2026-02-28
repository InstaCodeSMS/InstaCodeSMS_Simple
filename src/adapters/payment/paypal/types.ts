/**
 * PayPal 支付类型定义
 */

export interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

export interface PayPalCreatePaymentRequest {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  returnUrl: string
  currency?: string
}

export interface PayPalPaymentResponse {
  trade_id: string
  payment_url?: string
  actual_amount?: number
}

export interface PayPalWebhookData {
  id: string
  event_type: string
  resource: {
    id: string
    status: string
    amount?: {
      value: string
      currency_code: string
    }
  }
}
