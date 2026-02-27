/**
 * Telegram 接码服务
 * 管理用户的接码会话和轮询逻辑
 */

import { SmsService } from '../sms/sms.service'
import type { Env } from '../../types/env'

/**
 * 接码会话管理
 */
interface ReceiveSession {
  userId: number
  ordernum: string
  messageId: number
  isPolling: boolean
  pollCount: number
  startTime: Date
  lastPollTime?: Date
}

export class ReceiveService {
  private smsService: SmsService
  private sessions: Map<number, ReceiveSession> = new Map()
  private pollIntervals: Map<number, NodeJS.Timeout> = new Map()
  private env: Env

  constructor(env: Env) {
    this.env = env
    this.smsService = new SmsService(env)
  }

  /**
   * 开始接码会话
   */
  async startReceiving(userId: number, ordernum: string, messageId: number) {
    // 停止之前的会话
    this.stopReceiving(userId)

    // 创建新会话
    const session: ReceiveSession = {
      userId,
      ordernum,
      messageId,
      isPolling: true,
      pollCount: 0,
      startTime: new Date()
    }

    this.sessions.set(userId, session)
    console.log(`[Telegram] Started receiving session for user ${userId}, ordernum: ${ordernum}`)
    return session
  }

  /**
   * 停止接码会话
   */
  stopReceiving(userId: number) {
    const interval = this.pollIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      this.pollIntervals.delete(userId)
    }
    this.sessions.delete(userId)
    console.log(`[Telegram] Stopped receiving session for user ${userId}`)
  }

  /**
   * 获取当前会话
   */
  getSession(userId: number): ReceiveSession | undefined {
    return this.sessions.get(userId)
  }

  /**
   * 获取短信验证码
   */
  async getSmsCode(ordernum: string) {
    return await this.smsService.getSmsCode(ordernum)
  }

  /**
   * 设置轮询间隔
   */
  setPollingInterval(userId: number, interval: NodeJS.Timeout) {
    this.pollIntervals.set(userId, interval)
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): ReceiveSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isPolling)
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(maxDurationMs: number = 5 * 60 * 1000) {
    const now = Date.now()
    const expiredUserIds: number[] = []

    this.sessions.forEach((session, userId) => {
      if (now - session.startTime.getTime() > maxDurationMs) {
        expiredUserIds.push(userId)
      }
    })

    expiredUserIds.forEach(userId => {
      this.stopReceiving(userId)
    })

    return expiredUserIds
  }
}
