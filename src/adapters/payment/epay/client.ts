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
      method: 'web',
      device: 'pc',
      type: request.channel || 'alipay',
      out_trade_no: request.orderId,
      notify_url: request.notifyUrl,
      return_url: request.returnUrl,
      name: request.name,
      money: String(request.amount),
      clientip: request.clientIp || '127.0.0.1',
      timestamp: Math.floor(Date.now() / 1000).toString(),
    }

    const sign = this.generateSign(params)

    const formData = new URLSearchParams({
      ...params,
      sign,
      sign_type: this.config.signType || 'MD5',
    })

    const response = await fetch(`${this.config.apiUrl}/api/pay/create`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json() as any

    // 检查易支付返回状态
    if (data.code !== 0) {
      throw new Error(`易支付返回错误: ${data.msg || '未知错误'}`)
    }

    // 处理 pay_info：如果是相对路径，拼接易支付域名
    let payInfo = data.pay_info
    if (payInfo && !payInfo.startsWith('http://') && !payInfo.startsWith('https://') && !payInfo.includes('://')) {
      const path = payInfo.replace(/^\//, '')
      const baseUrl = this.config.apiUrl.replace(/\/$/, '') // 移除结尾斜杠避免双斜杠
      payInfo = `${baseUrl}/${path}`
    }

    // 将 pay_info 转换为二维码图片 URL
    let qrCodeUrl: string | undefined
    if (payInfo) {
      const size = 200
      const encodedData = encodeURIComponent(payInfo)
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`
    }

    return {
      trade_no: data.trade_no || request.orderId,
      out_trade_no: request.orderId,
      payment_url: payInfo,
      qr_code: payInfo,
      qr_code_url: qrCodeUrl,
      payment_amount: request.amount,
    }
  }

  verifyCallback(data: unknown): boolean {
    const callback = data as Record<string, string>
    if (!callback.sign) return false

    // 排除 sign 和 sign_type，包含所有其他参数
    const params: Record<string, string> = {}
    for (const key in callback) {
      if (key !== 'sign' && key !== 'sign_type') {
        params[key] = callback[key]
      }
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
