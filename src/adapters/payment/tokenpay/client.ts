/**
 * Token Pay 客户端
 */

import crypto from 'node:crypto'
import type { TokenPayConfig, TokenPayCreatePaymentRequest, TokenPayPaymentResponse, TokenPayCallbackData } from './types'

export class TokenPayClient {
  private config: TokenPayConfig

  constructor(config: TokenPayConfig) {
    this.config = config
  }

  async createPayment(request: TokenPayCreatePaymentRequest): Promise<TokenPayPaymentResponse> {
    const timestamp = Math.floor(Date.now() / 1000)
    const params = {
      merchant_id: this.config.merchantId,
      order_id: request.orderId,
      amount: String(request.amount),
      currency: request.currency || 'USDT',
      notify_url: request.notifyUrl,
      redirect_url: request.redirectUrl,
      name: request.name,
      timestamp: String(timestamp),
    }

    const sign = this.generateSign(params)
    const queryString = new URLSearchParams({
      ...params,
      sign,
    }).toString()

    const paymentUrl = `${this.config.apiUrl}?${queryString}`

    return {
      trade_id: request.orderId,
      payment_url: paymentUrl,
      actual_amount: request.amount,
    }
  }

  verifyCallback(data: unknown): boolean {
    const callback = data as TokenPayCallbackData
    if (!callback.sign) return false

    const params = {
      merchant_id: callback.merchant_id,
      order_id: callback.order_id,
      trade_id: callback.trade_id,
      amount: callback.amount,
      currency: callback.currency,
      status: callback.status,
      timestamp: callback.timestamp,
    }

    const expectedSign = this.generateSign(params)
    return expectedSign === callback.sign
  }

  private generateSign(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + this.config.apiKey

    return crypto.createHash('md5').update(signStr).digest('hex')
  }
}

export function createTokenPayClient(config: TokenPayConfig): TokenPayClient {
  return new TokenPayClient(config)
}
