/**
 * 支付服务 - 最小MVP版本
 * 直接调用易支付API
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { OrderRepository } from '../order/order.repo'
import { PaymentStatus, PaymentMethod, type CreatePaymentInput, type PaymentOrderResponse } from './payment.schema'
import { PaymentOrderStatus } from '../order/order.schema'
import { createEpayClient } from '../../adapters/payment/epay/client'
import type { Env } from '../../types/env'

export class PaymentService {
  private orderRepo: OrderRepository
  private env: Env

  constructor(db: SupabaseClient, env: Env) {
    this.orderRepo = new OrderRepository(db)
    this.env = env
  }

  async createPayment(input: CreatePaymentInput): Promise<{
    trade_id: string
    qr_code_url?: string
    payment_url?: string
    actual_amount: string
  }> {
    if (!this.env.API_BASE_URL) {
      throw new Error('缺少环境变量：API_BASE_URL')
    }

    if (!this.env.EPAY_API_URL || !this.env.EPAY_PID || !this.env.EPAY_KEY) {
      throw new Error('易支付未配置')
    }

    const epayClient = createEpayClient({
      apiUrl: this.env.EPAY_API_URL,
      pid: this.env.EPAY_PID,
      key: this.env.EPAY_KEY,
      signType: (this.env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
    })

    // 支付方式映射到易支付 channel
    const channelMap: Record<string, 'alipay' | 'wxpay' | 'qqpay' | 'usdt.trc20'> = {
      'alipay': 'alipay',
      'epay': 'alipay',
      'usdt': 'usdt.trc20',
    }
    const channel = channelMap[input.payment_method] || 'alipay'

    const baseUrl = this.env.API_BASE_URL
    const payment = await epayClient.createPayment({
      orderId: input.order_id,
      amount: input.amount,
      name: input.product_info.title,
      notifyUrl: `${baseUrl}/api/payment/callback/epay`,
      returnUrl: `${baseUrl}/success?order_id=${input.order_id}`,
      channel,
      clientIp: '127.0.0.1',
    })

    await this.orderRepo.create({
      trade_id: payment.trade_no!,
      order_id: input.order_id,
      payment_method: PaymentMethod.ALIPAY,
      amount: input.amount,
      actual_amount: payment.payment_amount || input.amount,
      status: PaymentOrderStatus.PENDING,
      product_info: input.product_info as any,
      token: payment.payment_url,
      trade_type: 'alipay',
      expiration_time: 300,
    })

    return {
      trade_id: payment.trade_no!,
      qr_code_url: payment.qr_code_url,
      payment_url: payment.payment_url,
      actual_amount: String(payment.payment_amount || input.amount),
    }
  }

  async queryPaymentStatus(tradeId: string): Promise<PaymentOrderResponse> {
    const order = await this.orderRepo.findByTradeId(tradeId)
    if (!order) {
      throw new Error(`订单不存在: ${tradeId}`)
    }

    return {
      trade_id: order.trade_id,
      order_id: order.order_id,
      status: order.status as unknown as PaymentStatus,
      amount: order.amount,
      actual_amount: order.actual_amount,
      payment_method: order.payment_method,
      paid_at: order.paid_at,
      block_transaction_id: order.block_transaction_id,
    }
  }

  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    await this.orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }

  async markAsTimeout(tradeId: string): Promise<void> {
    await this.orderRepo.markAsTimeout(tradeId)
  }

  /**
   * 验证支付回调
   */
  async verifyCallback(params: Record<string, any>): Promise<boolean> {
    try {
      const epayClient = createEpayClient({
        apiUrl: this.env.EPAY_API_URL!,
        pid: this.env.EPAY_PID!,
        key: this.env.EPAY_KEY!,
        signType: (this.env.EPAY_SIGN_TYPE as 'MD5' | 'RSA') || 'MD5',
      })
      
      return await epayClient.verifyCallback(params)
    } catch (error) {
      console.error('[PaymentService] Verify callback error:', error)
      return false
    }
  }

  /**
   * 查询支付状态
   */
  async queryStatus(paymentId: string): Promise<any> {
    try {
      const order = await this.orderRepo.findByTradeId(paymentId)
      if (!order) {
        return null
      }

      return {
        trade_id: order.trade_id,
        order_id: order.order_id,
        status: order.status,
        amount: order.amount,
        actual_amount: order.actual_amount,
        payment_method: order.payment_method,
        paid_at: order.paid_at,
        created_at: order.created_at
      }
    } catch (error) {
      console.error('[PaymentService] Query status error:', error)
      return null
    }
  }
}
