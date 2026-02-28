/**
 * PayPal 客户端
 */

import type { PayPalConfig, PayPalCreatePaymentRequest, PayPalPaymentResponse } from './types'

export class PayPalClient {
  private config: PayPalConfig
  private apiUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: PayPalConfig) {
    this.config = config
    this.apiUrl = config.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  async createPayment(request: PayPalCreatePaymentRequest): Promise<PayPalPaymentResponse> {
    const token = await this.getAccessToken()

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: request.orderId,
          amount: {
            currency_code: request.currency || 'USD',
            value: String(request.amount),
          },
          description: request.name,
        },
      ],
      application_context: {
        return_url: request.returnUrl,
        cancel_url: request.returnUrl,
        notify_url: request.notifyUrl,
      },
    }

    const response = await fetch(`${this.apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.statusText}`)
    }

    const data = await response.json() as any
    const approvalLink = data.links?.find((link: any) => link.rel === 'approve')?.href

    return {
      trade_id: data.id,
      payment_url: approvalLink,
      actual_amount: request.amount,
    }
  }

  async capturePayment(orderId: string): Promise<boolean> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.apiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    return response.ok
  }

  verifyWebhook(data: unknown): boolean {
    // PayPal webhook verification would require webhook ID and signature verification
    // For now, we'll do basic validation
    const webhook = data as any
    return !!(webhook.id && webhook.event_type && webhook.resource)
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')
    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const data = await response.json() as any
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)

    return this.accessToken!
  }
}

export function createPayPalClient(config: PayPalConfig): PayPalClient {
  return new PayPalClient(config)
}
