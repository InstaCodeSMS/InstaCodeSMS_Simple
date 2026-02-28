/**
 * Stripe 支付类型定义
 */

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

export interface StripeCreatePaymentRequest {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  returnUrl: string
  currency?: string
}

export interface StripePaymentResponse {
  trade_id: string
  payment_url?: string
  actual_amount?: number
}

export interface StripeWebhookData {
  id: string
  type: string
  data: {
    object: {
      id: string
      status: string
      amount_total?: number
      currency?: string
    }
  }
}
