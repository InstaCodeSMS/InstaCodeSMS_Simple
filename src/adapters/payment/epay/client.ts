/**
 * E-pay 客户端
 */

import crypto from 'node:crypto'
import type { EpayConfig, EpayCreatePaymentRequest, EpayPaymentResponse, EpayCallbackData } from './types'

export class EpayClient {
  private config: EpayConfig

  constructor(config: EpayConfig) {
    this.config = config
  }

  async createPayment(request: EpayCreatePaymentRequest): Promise<EpayPaymentResponse> {
    const params = {
      pid: this.config.pid,
      type: request.channel || 'alipay',
      out_trade_no: request.orderId,
      notify_url: request.notifyUrl,
      return_url: request.returnUrl,
      name: request.name,
      money: String(request.amount),
    }

    const sign = this.generateSign(params)
    const queryString = new URLSearchParams({
      ...params,
      sign,
      sign_type: this.config.signType || 'MD5',
    }).toString()

    const paymentUrl = `${this.config.apiUrl}?${queryString}`

    return {
      trade_no: request.orderId,
      payment_url: paymentUrl,
      payment_amount: request.amount,
    }
  }

  verifyCallback(data: unknown): boolean {
    const callback = data as EpayCallbackData
    if (!callback.sign) return false

    const params = {
      pid: callback.pid,
      trade_no: callback.trade_no,
      out_trade_no: callback.out_trade_no,
      type: callback.type,
      name: callback.name,
      money: callback.money,
      trade_status: callback.trade_status,
    }

    const expectedSign = this.generateSign(params)
    return expectedSign === callback.sign
  }

  private generateSign(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + this.config.key

    return crypto.createHash('md5').update(signStr).digest('hex')
  }
}

export function createEpayClient(config: EpayConfig): EpayClient {
  return new EpayClient(config)
}
