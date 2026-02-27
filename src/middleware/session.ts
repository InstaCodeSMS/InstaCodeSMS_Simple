/**
 * Telegram Mini App 会话管理
 * 使用内存存储（生产环境应使用 Redis 或数据库）
 */

export interface TelegramUser {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  isPremium?: boolean
}

export interface Session {
  user: TelegramUser
  initData: string
  createdAt: number
  expiresAt: number
}

// 内存会话存储（生产环境应使用 Redis）
const sessions = new Map<string, Session>()

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 创建会话
 */
export function createSession(user: TelegramUser, initData: string): string {
  const sessionId = generateSessionId()
  const now = Date.now()
  const expiresAt = now + 24 * 60 * 60 * 1000 // 24 小时过期

  sessions.set(sessionId, {
    user,
    initData,
    createdAt: now,
    expiresAt,
  })

  return sessionId
}

/**
 * 获取会话
 */
export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId)

  if (!session) {
    return null
  }

  // 检查是否过期
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId)
    return null
  }

  return session
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

/**
 * 清理过期会话
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId)
    }
  }
}

// 注意：Cloudflare Workers 不允许在全局作用域使用 setInterval
// 过期会话会在 getSession 调用时被检查并清理
