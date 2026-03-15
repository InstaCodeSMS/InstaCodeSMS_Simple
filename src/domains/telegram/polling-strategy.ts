/**
 * 智能轮询策略
 * 动态调整轮询间隔，优化性能
 */

export interface PollingConfig {
  initialInterval: number  // 初始间隔（毫秒）
  maxInterval: number      // 最大间隔
  maxAttempts: number      // 最大尝试次数
  backoffMultiplier: number // 退避倍数
}

export class PollingStrategy {
  private config: PollingConfig
  private currentAttempt: number = 0
  private currentInterval: number

  constructor(config?: Partial<PollingConfig>) {
    this.config = {
      initialInterval: 5000,// 5秒
      maxInterval: 30000,       // 30秒
      maxAttempts: 60,          // 最多60次
      backoffMultiplier: 1.5,   // 指数退避
      ...config
    }
    this.currentInterval = this.config.initialInterval
  }

  /**
   * 获取下一次轮询间隔
   */
  getNextInterval(): number {
    this.currentAttempt++
    
    if (this.currentAttempt > this.config.maxAttempts) {
      return -1 // 超时
    }

    // 指数退避算法
    if (this.currentAttempt > 10) {
      this.currentInterval = Math.min(
        this.currentInterval * this.config.backoffMultiplier,
        this.config.maxInterval
      )
    }

    return this.currentInterval
  }

  /**
   * 重置策略
   */
  reset(): void {
    this.currentAttempt = 0
    this.currentInterval = this.config.initialInterval
  }

  /**
   * 是否应该继续轮询
   */
  shouldContinue(): boolean {
    return this.currentAttempt < this.config.maxAttempts
  }

  /**
   * 获取当前尝试次数
   */
  getAttemptCount(): number {
    return this.currentAttempt
  }
}