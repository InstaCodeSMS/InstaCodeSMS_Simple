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

    // 根据签名类型生成签名
    let sign: string
    if (this.config.signType === 'RSA') {
      const paramsRecord = params as Record<string, string>
      const sortedKeys = Object.keys(paramsRecord).sort()
      const signStr = sortedKeys.map(key => `${key}=${paramsRecord[key]}`).join('&')
      sign = await this.generateRSASign(signStr)
    } else {
      sign = this.generateSign(params as Record<string, string>)
    }

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

  async verifyCallback(data: unknown): Promise<boolean> {
    const callback = data as Record<string, string>
    if (!callback.sign) return false

    // 排除 sign、sign_type 和空值，包含所有其他参数
    const params: Record<string, string> = {}
    for (const key in callback) {
      if (key !== 'sign' && key !== 'sign_type' && callback[key]) {
        params[key] = callback[key]
      }
    }

    // 根据签名类型选择验证方式（使用配置的签名类型，忽略回调中的 sign_type）
    const signType = this.config.signType || 'MD5'
    
    if (signType === 'RSA') {
      // RSA 签名验证
      const sortedKeys = Object.keys(params).sort()
      const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
      return await this.verifyRSASign(signStr, callback.sign)
    } else {
      // MD5 签名验证
      const expectedSign = this.generateSign(params)
      return expectedSign === callback.sign
    }
  }

  private generateSign(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + this.config.key

    return crypto.createHash('md5').update(signStr).digest('hex')
  }

  private async generateRSASign(data: string): Promise<string> {
    if (!this.config.privateKey) {
      throw new Error('RSA private key is required for RSA signature generation')
    }

    try {
      let pemContents = this.config.privateKey.trim()
      
      // 检查是否包含 PEM 头尾标记
      if (pemContents.includes('BEGIN PRIVATE KEY')) {
        // 如果有，去除头尾标记
        pemContents = pemContents
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replace(/\s/g, '')
      } else {
        // 如果没有，说明是纯 base64，直接使用
        pemContents = pemContents.replace(/\s/g, '')
      }
      
      const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      )

      const dataBytes = new TextEncoder().encode(data)
      const signatureBytes = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        dataBytes
      )
      
      return btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    } catch (error) {
      console.error('[E-pay] RSA signature generation error:', error)
      throw error
    }
  }

  private async verifyRSASign(data: string, sign: string): Promise<boolean> {
    if (!this.config.publicKey) {
      throw new Error('RSA public key is required for RSA signature verification')
    }

    try {
      let pemContents = this.config.publicKey.trim()
      
      // 检查是否包含 PEM 头尾标记
      if (pemContents.includes('BEGIN PUBLIC KEY')) {
        // 如果有，去除头尾标记
        pemContents = pemContents
          .replace('-----BEGIN PUBLIC KEY-----', '')
          .replace('-----END PUBLIC KEY-----', '')
          .replace(/\s/g, '')
      } else {
        // 如果没有，说明是纯 base64，直接使用
        pemContents = pemContents.replace(/\s/g, '')
      }
      
      const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
      
      const publicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      )

      const signatureBytes = Uint8Array.from(atob(sign), c => c.charCodeAt(0))
      const dataBytes = new TextEncoder().encode(data)
      
      return await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        signatureBytes,
        dataBytes
      )
    } catch (error) {
      console.error('[E-pay] RSA signature verification error:', error)
      return false
    }
  }
}

export function createEpayClient(config: EpayConfig): EpayClient {
  return new EpayClient(config)
}
