/**
 * 支付策略接口
 * 所有支付方式必须实现此接口
 */

import type { CreatePaymentInput } from '../../domains/payment/payment.schema'

export interface PaymentResult {
  trade_id: string
  payment_url?: string
  qr_code?: string
  qr_code_url?: string
  actual_amount: string
}

export interface PaymentCallbackData {
  trade_id: string
  actual_amount: number
  block_transaction_id?: string
}

export interface PaymentStrategy {
  name: string
  createPayment(input: CreatePaymentInput, baseUrl: string): Promise<PaymentResult>
  verifyCallback(data: unknown): boolean
  markAsPaid(tradeId: string, actualAmount: number, blockTransactionId: string): Promise<void>
}
