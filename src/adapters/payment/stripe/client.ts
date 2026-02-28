/**
 * Stripe 客户端
 */

import crypto from 'node:crypto'
import type { StripeConfig, StripeCreatePaymentRequest, StripePaymentResponse } from './types'

export class StripeClient {
  private config: StripeConfig
  private apiUrl = 'https://api.stripe.com/v1'

  constructor(config: StripeConfig) {
    this.config = config
  }

  async createPayment(request: StripeCreatePaymentRequest): Promise<StripePaymentResponse> {
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'payment',
      'success_url': request.returnUrl,
      'cancel_url': request.returnUrl,
      'line_items[0][price_data][currency]': request.currency || 'usd',
      'line_items[0][price_data][unit_amount]': String(Math.round(request.amount * 100)),
      'line_items[0][price_data][product_data][name]': request.name,
      'line_items[0][quantity]': '1',
      'client_reference_id': request.orderId,
    })

    const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`)
    }

    const data = await response.json() as any
    return {
      trade_id: data.id,
      payment_url: data.url,
      actual_amount: request.amount,
    }
  }

  verifyWebhook(body: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('hex')

    return hash === signature
  }
}

export function createStripeClient(config: StripeConfig): StripeClient {
  return new StripeClient(config)
}
