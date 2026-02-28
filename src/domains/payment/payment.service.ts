/**
 * 支付领域 - 业务逻辑层
 * 协调支付适配器和订单仓库，处理支付流程
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createBepusdtClient, BepusdtError } from '../../adapters/payment/bepusdt/client'
import { createAlimpayClient, AlimpayError } from '../../adapters/payment/alimpay/client'
import { OrderRepository } from '../order/order.repo'
import { PaymentOrderStatus, type ProductSnapshot } from '../order/order.schema'
import { PaymentMethod, PaymentStatus, type CreatePaymentInput, type PaymentOrderResponse } from './payment.schema'
import type { Env } from '../../types/env'
import { PAYMENT_TIMEOUT } from '../../constants/business'

/**
 * 支付服务
 * 处理支付订单的创建、查询、回调等业务逻辑
 */
export class PaymentService {
  private orderRepo: OrderRepository
  private env: Env

  constructor(db: SupabaseClient, env: Env) {
    this.orderRepo = new OrderRepository(db)
    this.env = env
  }

  /**
   * 创建支付订单
   * 根据支付方式调用相应的支付网关
   */
  async createPayment(input: CreatePaymentInput): Promise<{
    trade_id: string
    payment_url?: string
    qr_code?: string
    qr_code_url?: string
    actual_amount: string
  }> {
    if (!this.env.API_BASE_URL) {
      throw new Error('缺少环境变量：API_BASE_URL')
    }

    const baseUrl = this.env.API_BASE_URL

    if (input.payment_method === PaymentMethod.ALIPAY) {
      return this.createAlipayPayment(input, baseUrl)
    } else if (input.payment_method === PaymentMethod.USDT) {
      return this.createUsdtPayment(input, baseUrl)
    }

    throw new Error(`不支持的支付方式: ${input.payment_method}`)
  }

  /**
   * 创建支付宝支付订单
   */
  private async createAlipayPayment(input: CreatePaymentInput, baseUrl: string) {
    if (!this.env.ALIMPAY_API_URL || !this.env.ALIMPAY_PID || !this.env.ALIMPAY_KEY) {
      throw new Error('支付宝支付未配置')
    }

    const alimpayClient = createAlimpayClient({
      apiUrl: this.env.ALIMPAY_API_URL,
      pid: this.env.ALIMPAY_PID,
      key: this.env.ALIMPAY_KEY,
    })

    const notifyUrl = `${baseUrl}/api/payment/callback/alipay`
    const returnUrl = `${baseUrl}/success`

    try {
      const payment = await alimpayClient.createPayment({
        orderId: input.order_id,
        amount: input.amount,
        name: input.product_info.title,
        notifyUrl,
        returnUrl,
      })

      // 存储订单到数据库
      await this.orderRepo.create({
        trade_id: payment.trade_no!,
        order_id: input.order_id,
        payment_method: PaymentMethod.ALIPAY,
        amount: input.amount,
        actual_amount: payment.payment_amount || input.amount,
        status: PaymentOrderStatus.PENDING,
        product_info: input.product_info as ProductSnapshot,
        token: payment.qr_code_url || payment.qr_code,
        trade_type: 'alipay',
        expiration_time: PAYMENT_TIMEOUT.ALIPAY,
      })

      return {
        trade_id: payment.trade_no!,
        payment_url: payment.payment_url,
        qr_code: payment.qr_code,
        qr_code_url: payment.qr_code_url,
        actual_amount: String(payment.payment_amount || input.amount),
      }
    } catch (error) {
      if (error instanceof AlimpayError) {
        throw new Error(`支付宝支付失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 创建 USDT 支付订单
   */
  private async createUsdtPayment(input: CreatePaymentInput, baseUrl: string) {
    if (!this.env.BEPUSDT_API_URL || !this.env.BEPUSDT_API_TOKEN) {
      throw new Error('USDT支付未配置')
    }

    const bepusdtClient = createBepusdtClient(this.env)
    const notifyUrl = this.env.BEPUSDT_NOTIFY_URL || `${baseUrl}/api/payment/callback`
    const redirectUrl = `${baseUrl}/success`

    try {
      const transaction = await bepusdtClient.createTransaction({
        orderId: input.order_id,
        amount: input.amount,
        notifyUrl,
        redirectUrl,
        tradeType: input.trade_type as 'usdt.trc20' | undefined,
        name: input.product_info.title,
        timeout: 600, // 10分钟
      })

      // 存储订单到数据库
      await this.orderRepo.create({
        trade_id: transaction.trade_id,
        order_id: input.order_id,
        payment_method: PaymentMethod.USDT,
        amount: input.amount,
        actual_amount: parseFloat(transaction.actual_amount),
        status: PaymentOrderStatus.PENDING,
        product_info: input.product_info as ProductSnapshot,
        token: transaction.token,
        trade_type: input.trade_type,
        expiration_time: PAYMENT_TIMEOUT.USDT,
      })

      return {
        trade_id: transaction.trade_id,
        payment_url: transaction.payment_url,
        actual_amount: transaction.actual_amount,
      }
    } catch (error) {
      if (error instanceof BepusdtError) {
        throw new Error(`USDT支付失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 查询支付状态
   */
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
      payment_method: order.payment_method as PaymentMethod,
      paid_at: order.paid_at,
      block_transaction_id: order.block_transaction_id,
    }
  }

  /**
   * 标记订单为已支付
   */
  async markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void> {
    await this.orderRepo.markAsPaid(tradeId, actualAmount, blockTransactionId)
  }

  /**
   * 标记订单为已超时
   */
  async markAsTimeout(tradeId: string): Promise<void> {
    await this.orderRepo.markAsTimeout(tradeId)
  }
}
