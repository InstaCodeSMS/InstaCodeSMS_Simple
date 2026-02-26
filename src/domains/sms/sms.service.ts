/**
 * 短信领域 - 业务逻辑层
 * 处理短信验证码的获取、轮询、核销等业务逻辑
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createUpstreamClient } from '../../adapters/upstream'
import type { Env } from '../../types/env'

/**
 * 短信服务响应
 */
export interface SmsResponse {
  tel: string
  sms: string
  expired_date: string
  status: 'pending' | 'success' | 'error'
}

/**
 * 短信服务
 * 处理短信验证码的获取和轮询
 */
export class SmsService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * 获取短信验证码
   * 从上游 API 获取订单对应的短信验证码
   */
  async getSmsCode(ordernum: string): Promise<SmsResponse> {
    if (!ordernum) {
      return {
        tel: '',
        sms: '',
        expired_date: '',
        status: 'error',
      }
    }

    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      // 获取订单详情（包含 api URL）
      const orderDetail = await client.getOrderDetail({ ordernum })

      if (!orderDetail.list || orderDetail.list.length === 0) {
        return {
          tel: '',
          sms: '',
          expired_date: '订单号无效或已过期',
          status: 'error',
        }
      }

      // 获取第一个订单项的 api URL
      const orderItem = orderDetail.list[0]

      if (!orderItem.api) {
        return {
          tel: '',
          sms: '',
          expired_date: '该订单暂无验证码信息',
          status: 'error',
        }
      }

      // 代理请求上游 API
      const url = orderItem.api.includes('?')
        ? `${orderItem.api}&format=json3`
        : `${orderItem.api}?format=json3`

      const response = await fetch(url)

      if (!response.ok) {
        return {
          tel: '',
          sms: '',
          expired_date: '网络错误，请稍后重试',
          status: 'error',
        }
      }

      const data = await response.json()

      // format=json3 返回格式
      if (data.code === 1 && data.data && data.data.sms) {
        // 收到验证码
        return {
          tel: data.data.tel || orderItem.tel,
          sms: data.data.sms || '',
          expired_date: data.data.expired_date || orderItem.end_time,
          status: 'success',
        }
      }

      // 暂未收到验证码
      return {
        tel: '',
        sms: '',
        expired_date: '等待短信...',
        status: 'pending',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '系统错误'
      return {
        tel: '',
        sms: '',
        expired_date: message,
        status: 'error',
      }
    }
  }

  /**
   * 验证短信验证码
   * 检查用户输入的验证码是否正确
   */
  async verifySmsCode(ordernum: string, inputCode: string): Promise<boolean> {
    try {
      const smsResponse = await this.getSmsCode(ordernum)

      if (smsResponse.status !== 'success') {
        return false
      }

      // 简单的验证码匹配
      return smsResponse.sms === inputCode
    } catch {
      return false
    }
  }

  /**
   * 获取订单的短信信息
   * 用于前端显示短信状态
   */
  async getOrderSmsInfo(ordernum: string): Promise<{
    ordernum: string
    tel: string
    sms: string
    expired_date: string
    status: 'pending' | 'success' | 'error'
  }> {
    const smsResponse = await this.getSmsCode(ordernum)

    return {
      ordernum,
      ...smsResponse,
    }
  }
}
