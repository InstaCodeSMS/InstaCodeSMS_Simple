/**
 * BEpusdt API 客户端
 * 用于与 BEpusdt 服务端进行通信
 */

import type { Env } from '../../../types/env'
import {
  type BepusdtApiResponse,
  type BepusdtCreateTransactionRequest,
  type BepusdtTransactionData,
  type BepusdtCancelTransactionRequest,
  type BepusdtCallbackData,
  type BepusdtMethodsData,
  type TradeType,
} from './types'
import { BepusdtSigner } from './signer'

/**
 * BEpusdt API 错误
 */
export class BepusdtError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'BepusdtError'
    this.statusCode = statusCode
  }
}

/**
 * BEpusdt 客户端配置
 */
export interface BepusdtClientConfig {
  apiUrl: string
  apiToken: string
  notifyUrl?: string
}

/**
 * BEpusdt API 客户端
 */
export class BepusdtClient {
  private apiUrl: string
  private apiToken: string
  private notifyUrl?: string
  private signer: BepusdtSigner

  constructor(config: BepusdtClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // 移除末尾斜杠
    this.apiToken = config.apiToken
    this.notifyUrl = config.notifyUrl
    this.signer = new BepusdtSigner(config.apiToken)
  }

  /**
   * 发送 API 请求
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<BepusdtApiResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`

    // 调试日志
    console.log('[BEpusdt] 请求:', {
      url,
      params: { ...params, signature: '(hidden)' },
    })

    // 创建超时控制器（60 秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 调试响应
      const responseText = await response.text()
      console.log('[BEpusdt] 响应状态:', response.status)
      console.log('[BEpusdt] 响应内容:', responseText.substring(0, 500))

      if (!response.ok) {
        throw new BepusdtError(`HTTP 请求失败: ${response.status}: ${responseText}`, response.status)
      }

      let data: BepusdtApiResponse<T>
      try {
        data = JSON.parse(responseText) as BepusdtApiResponse<T>
      } catch {
        throw new BepusdtError(`JSON 解析失败: ${responseText}`, 500)
      }

      if (data.status_code !== 200) {
        throw new BepusdtError(data.message || 'API 请求失败', data.status_code)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof BepusdtError) {
        throw error
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BepusdtError('请求超时（30秒）', 504)
      }
      throw new BepusdtError(`请求失败: ${error instanceof Error ? error.message : String(error)}`, 500)
    }
  }

  /**
   * 创建交易订单
   * 创建支付订单并获取收银台付款地址
   */
  async createTransaction(options: {
    orderId: string
    amount: number
    notifyUrl: string
    redirectUrl: string
    tradeType?: TradeType
    fiat?: 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY'
    name?: string
    timeout?: number
  }): Promise<BepusdtTransactionData> {
    const params: Record<string, unknown> = {
      order_id: options.orderId,
      amount: options.amount,
      notify_url: options.notifyUrl,
      redirect_url: options.redirectUrl,
    }

    // 可选参数
    if (options.tradeType) params.trade_type = options.tradeType
    if (options.fiat) params.fiat = options.fiat
    if (options.name) params.name = options.name
    if (options.timeout) params.timeout = options.timeout

    // 生成签名
    params.signature = this.signer.generateSignature(params)

    const response = await this.request<BepusdtTransactionData>(
      '/api/v1/order/create-transaction',
      params
    )

    if (!response.data) {
      throw new BepusdtError('创建订单失败：未返回订单数据')
    }

    return response.data
  }

  /**
   * 取消交易订单
   */
  async cancelTransaction(tradeId: string): Promise<void> {
    const params: Record<string, unknown> = {
      trade_id: tradeId,
    }

    params.signature = this.signer.generateSignature(params)

    await this.request('/api/v1/order/cancel-transaction', params)
  }

  /**
   * 获取可用付款方式
   */
  async getPaymentMethods(tradeId: string, currency?: string): Promise<BepusdtMethodsData> {
    const params: Record<string, unknown> = {
      trade_id: tradeId,
    }

    if (currency) {
      params.currency = currency
    }

    const response = await this.request<BepusdtMethodsData>('/api/v1/pay/methods', params)

    if (!response.data) {
      throw new BepusdtError('获取付款方式失败：未返回数据')
    }

    return response.data
  }

  /**
   * 验证回调签名
   */
  verifyCallback(data: BepusdtCallbackData): boolean {
    return this.signer.verifySignature(data as unknown as Record<string, unknown>)
  }
}

/**
 * 从环境变量创建 BEpusdt 客户端
 */
export function createBepusdtClient(env: Env): BepusdtClient {
  return new BepusdtClient({
    apiUrl: env.BEPUSDT_API_URL,
    apiToken: env.BEPUSDT_API_TOKEN,
    notifyUrl: env.BEPUSDT_NOTIFY_URL,
  })
}