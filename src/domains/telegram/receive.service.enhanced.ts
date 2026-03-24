/**
 * Telegram 接码服务（增强版）
 * 使用数据库持久化会话，去除全局变量
 */

import type { Env } from '../../types/env'
import { TelegramUserService } from './user.service'
import { SmsService } from '../sms/sms.service'
import type { ReceiveSession } from './user.schema'

export class ReceiveServiceEnhanced {
  private userService: TelegramUserService
  private smsService: SmsService
  private env: Env

  constructor(env: Env) {
    this.env = env
    this.userService = new TelegramUserService(env)
    this.smsService = new SmsService(env)
  }

  /**
   * 开始接码会话
   */
  async startReceiving(
    userId: number,
    ordernum: string,
    messageId: number
  ): Promise<ReceiveSession> {
    // 注册或更新用户
    await this.userService.updateLastActive(userId)

    // 创建会话
    return await this.userService.startReceiveSession(userId, ordernum, messageId)
  }

  /**
   * 获取活跃会话
   */
  async getActiveSession(userId: number): Promise<ReceiveSession | null> {
    return await this.userService.getActiveSession(userId)
  }

  /**
   * 停止接码
   */
  async stopReceiving(userId: number): Promise<void> {
    const session = await this.userService.getActiveSession(userId)
    if (session) {
      await this.userService.updateSessionStatus(session.id!, 'stopped')
    }
  }

  /**
   * 获取短信验证码
   */
  async getSmsCode(ordernum: string): Promise<any> {
    return await this.smsService.getSmsCode(ordernum)
  }

  /**
   * 更新会话状态为成功
   */
  async markSuccess(sessionId: number, result: any): Promise<void> {
    await this.userService.updateSessionStatus(sessionId, 'success', result)
  }

  /**
   * 更新会话状态为超时
   */
  async markTimeout(sessionId: number): Promise<void> {
    await this.userService.updateSessionStatus(sessionId, 'timeout')
  }

  /**
   * 增加轮询计数
   */
  async incrementPollCount(sessionId: number): Promise<void> {
    await this.userService.incrementPollCount(sessionId)
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await this.userService.cleanupExpiredSessions()
  }
}