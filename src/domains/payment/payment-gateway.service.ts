/**
 * 支付网关服务
 *统一支付接口
 */

import type { Env } from '../../types/env'
import { PaymentService } from './payment.service'

export interface PaymentRequest {
  ordernum: string
  amount: number
  product_title: string
  notify_url: string
  return_url: string
}

export interface PaymentResponse {
  success: boolean
  payment_url?: string
  payment_id?: string
  error?: string
}

export class PaymentGatewayService {
  private paymentService: PaymentService

  constructor(env: Env) {
    this.paymentService = new PaymentService(env)
  }

  /**
   * 创建支付订单
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 调用现有的支付服务
      const result = await this.paymentService.createPayment({
        order_id: request.ordernum,
        amount: request.amount,
        payment_method: 'epay' as any,
        product_info: {
          service_id: 'sms_service',
          title: request.product_title,
          quantity: 1,
          expiry: 0,
          expiry_days: '0',
          unit_price: request.amount
        },
        trade_type: 'NATIVE',
        base_url: 'https://your-domain.com'
      })

      return {
        success: true,
        payment_url: result.payment_url,
        payment_id: result.trade_id
      }
    } catch (error) {
      console.error('[PaymentGateway] Create payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  /**
   * 验证支付回调
   */
  async verifyCallback(params: Record<string, any>): Promise<boolean> {
    try {
      // 直接调用支付服务的验证方法
      return await this.paymentService.verifyCallback(params)
    } catch (error) {
      console.error('[PaymentGateway] Verify callback error:', error)
      return false
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(paymentId: string): Promise<any> {
    try {
      // 直接调用支付服务的查询方法
      return await this.paymentService.queryStatus(paymentId)
    } catch (error) {
      console.error('[PaymentGateway] Query status error:', error)
      return null
    }
  }
}
