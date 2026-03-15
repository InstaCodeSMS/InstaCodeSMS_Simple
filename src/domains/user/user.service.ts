import bcrypt from 'bcryptjs'
import { RegisterSchema, LoginSchema } from './user.schema'
import { UserRepository } from './user.repo'
import type { Env } from '../../types/env'

export class UserService {
  private repo: UserRepository

  constructor(env: Env) {
    this.repo = new UserRepository(env)
  }

  async register(data: any) {
    const validatedData = RegisterSchema.parse(data)
    
    const existingUser = await this.repo.findByEmail(validatedData.email)
    if (existingUser) {
      throw new Error('该邮箱已被注册')
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    const user = await this.repo.create({
      email: validatedData.email,
      passwordHash
    })

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
    await this.repo.createSession(sessionId, user.id, expiresAt)
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      sessionId,
      expiresAt
    }
  }

  async login(data: any) {
    const validatedData = LoginSchema.parse(data)
    
    const user = await this.repo.findByEmail(validatedData.email)
    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('邮箱或密码错误')
    }

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
    await this.repo.createSession(sessionId, user.id, expiresAt)
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      sessionId,
      expiresAt
    }
  }

  async logout(sessionId: string) {
    await this.repo.deleteSession(sessionId)
  }

  async validateSession(sessionId: string) {
    const session = await this.repo.findSession(sessionId)
    if (!session) {
      return null
    }

    if (new Date(session.expires_at) < new Date()) {
      await this.repo.deleteSession(sessionId)
      return null
    }

    const user = await this.repo.findById(session.user_id)
    if (!user) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        telegramId: user.telegram_id,
        created_at: user.created_at
      },
      session
    }
  }
}