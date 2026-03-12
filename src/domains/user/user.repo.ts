import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../../types/env'
import { createSupabaseServiceClient } from '../../adapters/database/supabase'

export class UserRepository {
  private supabase: SupabaseClient

  constructor(env: Env) {
    this.supabase = createSupabaseServiceClient(env)
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async create(userData: {
    email: string
    passwordHash: string
    tenantId?: string
    role?: string
  }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: userData.passwordHash,
        tenant_id: userData.tenantId || 'default',
        role: userData.role || 'user'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createSession(sessionId: string, userId: string, expiresAt: Date) {
    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString()
      })
    if (error) throw error
  }

  async findSession(sessionId: string) {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async deleteSession(sessionId: string) {
    const { error } = await this.supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
    
    if (error) throw error
  }
}