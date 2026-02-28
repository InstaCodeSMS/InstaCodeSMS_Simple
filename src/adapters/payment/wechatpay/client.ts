/**
 * WeChat Pay 客户端
 */

import crypto from 'node:crypto'
import type { WeChatPayConfig, WeChatPayCreatePaymentRequest, WeChatPaymentResponse } from './types'

export class WeChatPayClient {
  private config: WeChatPayConfig
  private apiUrl = 'https://api.mch.weixin.qq.com/v3'

  constructor(config: WeChatPayConfig) {
    this.config = config
  }

  async createPayment(request: WeChatPayCreatePaymentRequest): Promise<WeChatPaymentResponse> {
    const tradeType = request.tradeType || 'NATIVE'
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = this.generateNonce()

    const body = {
      mchid: this.config.merchantId,
      out_trade_no: request.orderId,
      appid: 'wx_app_id', // 需要从环境变量获取
      description: request.name,
      notify_url: request.notifyUrl,
      amount: {
        total: Math.round(request.amount * 100),
        currency: 'CNY',
      },
      scene_info: {
        payer_client_ip: '127.0.0.1',
      },
    }

    const signature = this.generateSignature('POST', `/v3/pay/transactions/${tradeType.toLowerCase()}`, timestamp, nonce, JSON.stringify(body))
    const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.merchantId}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}"`

    const response = await fetch(`${this.apiUrl}/pay/transactions/${tradeType.toLowerCase()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'WeChat Pay Client',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`WeChat Pay API error: ${response.statusText}`)
    }

    const data = await response.json() as any
    return {
      trade_id: data.prepay_id || request.orderId,
      qr_code: data.code_url,
      payment_url: request.redirectUrl,
      actual_amount: request.amount,
    }
  }

  verifyWebhook(body: string, signature: string, timestamp: string, nonce: string): boolean {
    const message = `${timestamp}\n${nonce}\n${body}\n`
    const hash = crypto
      .createVerify('sha256WithRSAEncryption')
      .update(message)
      .verify(this.config.certificate, signature, 'base64')

    return hash
  }

  private generateSignature(method: string, path: string, timestamp: number, nonce: string, body: string): string {
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`
    const sign = crypto
      .createSign('sha256WithRSAEncryption')
      .update(message)
      .sign(this.config.privateKey, 'base64')

    return sign
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex')
  }
}

export function createWeChatPayClient(config: WeChatPayConfig): WeChatPayClient {
  return new WeChatPayClient(config)
}
