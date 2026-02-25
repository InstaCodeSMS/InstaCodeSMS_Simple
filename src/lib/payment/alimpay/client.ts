/**
 * AliMPay API 客户端
 * 实现 CodePay 协议
 */

import {
  type AlimpayConfig,
  type CreatePaymentParams,
  type CreatePaymentResponse,
  type QueryOrderResponse,
  type QueryMerchantResponse,
  type CallbackParams,
} from './types'
import md5 from 'blueimp-md5'

/**
 * AliMPay 错误类
 */
export class AlimpayError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'AlimpayError'
  }
}

/**
 * AliMPay 客户端
 */
export class AlimpayClient {
  private config: AlimpayConfig

  constructor(config: AlimpayConfig) {
    this.config = config
  }

  /**
   * 生成签名
   * CodePay 协议签名算法：
   * 1. 过滤空值参数
   * 2. 按键名升序排序
   * 3. 拼接成 key1=value1&key2=value2 格式
   * 4. 末尾拼接商户密钥
   * 5. 计算 MD5
   */
  generateSign(params: Record<string, string | number | undefined>): string {
    // 过滤空值
    const filteredParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined && value !== null) {
        filteredParams[key] = String(value)
      }
    }

    // 按键名升序排序
    const sortedKeys = Object.keys(filteredParams).sort()

    // 拼接字符串
    const parts = sortedKeys.map(key => `${key}=${filteredParams[key]}`)
    const signStr = parts.join('&')

    // 拼接商户密钥并计算 MD5
    const fullSignStr = signStr + this.config.key
    return md5(fullSignStr)
  }

  /**
   * 验证回调签名
   */
  verifyCallback(params: CallbackParams): boolean {
    const { sign, sign_type, ...restParams } = params
    const expectedSign = this.generateSign(restParams as Record<string, string>)
    return sign === expectedSign
  }

  /**
   * 创建支付订单
   */
  async createPayment(options: {
    orderId: string
    amount: number
    name: string
    notifyUrl: string
    returnUrl: string
    sitename?: string
  }): Promise<CreatePaymentResponse> {
    // 签名参数：使用原始值（不进行 URL 编码）
    // 注意：sign_type 不参与签名计算
    const signParams: Record<string, string | number | undefined> = {
      money: options.amount,
      name: options.name,  // 原始中文字符
      notify_url: options.notifyUrl,
      out_trade_no: options.orderId,
      pid: this.config.pid,
      return_url: options.returnUrl,
      type: 'alipay',
    }

    // 生成签名（使用原始值）
    const sign = this.generateSign(signParams)

    // 构建请求 URL
    // 注意：URL 参数值不进行编码（AliMPay 期望原始 URL）
    const baseUrl = this.config.apiUrl.replace(/\/$/, '')
    
    // 手动构建查询字符串（只对 name 进行 URL 编码）
    const queryParams = [
      `money=${options.amount}`,
      `name=${encodeURIComponent(options.name)}`,  // 只有 name 需要编码
      `notify_url=${options.notifyUrl}`,  // 不编码
      `out_trade_no=${options.orderId}`,
      `pid=${this.config.pid}`,
      `return_url=${options.returnUrl}`,  // 不编码
      `type=alipay`,
      `sign=${sign}`,
    ].join('&')

    const fullUrl = `${baseUrl}/mapi.php?${queryParams}`

    // 调试日志
    console.log('[AliMPay] 创建支付订单:', {
      apiUrl: this.config.apiUrl,
      pid: this.config.pid,
      orderId: options.orderId,
      amount: options.amount,
      name: options.name,
      signStr: this.getSignString(signParams),
      sign: sign,
      fullUrl: fullUrl,
    })

    // 发送请求
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    // 调试响应
    const responseText = await response.text()
    console.log('[AliMPay] 响应状态:', response.status)
    console.log('[AliMPay] 响应内容:', responseText.substring(0, 500))

    if (!response.ok) {
      throw new AlimpayError(`HTTP error: ${response.status}: ${responseText}`, response.status)
    }

    let data: CreatePaymentResponse
    try {
      data = JSON.parse(responseText) as CreatePaymentResponse
    } catch {
      throw new AlimpayError(`JSON 解析失败: ${responseText}`, 500)
    }

    if (data.code !== 1) {
      throw new AlimpayError(data.msg || '创建支付订单失败', 400)
    }

    return data
  }

  /**
   * 获取签名字符串（用于调试）
   */
  private getSignString(params: Record<string, string | number | undefined>): string {
    const filteredParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined && value !== null) {
        filteredParams[key] = String(value)
      }
    }
    const sortedKeys = Object.keys(filteredParams).sort()
    const parts = sortedKeys.map(key => `${key}=${filteredParams[key]}`)
    return parts.join('&') + this.config.key
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderId: string): Promise<QueryOrderResponse> {
    const params: Record<string, string | undefined> = {
      act: 'order',
      pid: this.config.pid,
      key: this.config.key,
      out_trade_no: orderId,
    }

    const url = new URL('/api.php', this.config.apiUrl)
    url.search = new URLSearchParams(params as Record<string, string>).toString()

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new AlimpayError(`HTTP error: ${response.status}`, response.status)
    }

    return response.json() as Promise<QueryOrderResponse>
  }

  /**
   * 查询商户信息
   */
  async queryMerchant(): Promise<QueryMerchantResponse> {
    const params: Record<string, string> = {
      act: 'query',
      pid: this.config.pid,
      key: this.config.key,
    }

    const url = new URL('/api.php', this.config.apiUrl)
    url.search = new URLSearchParams(params).toString()

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new AlimpayError(`HTTP error: ${response.status}`, response.status)
    }

    return response.json() as Promise<QueryMerchantResponse>
  }

}

/**
 * 创建 AliMPay 客户端实例
 */
export function createAlimpayClient(config: AlimpayConfig): AlimpayClient {
  return new AlimpayClient(config)
}
