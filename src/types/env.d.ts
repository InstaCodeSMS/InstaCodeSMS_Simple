// Cloudflare Pages 环境变量类型定义

export interface Env {
  // 上游 API 配置
  UPSTREAM_API_URL: string
  UPSTREAM_API_TOKEN: string

  // 价格加成配置（可选，默认 1.5）
  PRICE_MARKUP?: string

  // Supabase 配置
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SERVICE_KEY: string

  // BEpusdt 支付配置
  BEPUSDT_API_URL: string
  BEPUSDT_API_TOKEN: string
  BEPUSDT_NOTIFY_URL?: string // 可选，支付回调地址

  // AliMPay 支付配置
  ALIMPAY_API_URL?: string // AliMPay 部署地址
  ALIMPAY_PID?: string // 商户 ID
  ALIMPAY_KEY?: string // 商户密钥

  // Telegram Bot 配置
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_WEBHOOK_URL?: string
  TELEGRAM_WEBHOOK_SECRET?: string
}

// 导入 Telegram 认证用户类型
import type { AuthenticatedUser } from './telegram'

// 扩展 Hono 的环境类型
declare module 'hono' {
  interface ContextVariableMap {
    env: Env
    csrfToken: string  // CSRF Token，由 CSRF 中间件自动注入
    telegramUser?: AuthenticatedUser  // Telegram 认证用户，由 telegram-auth 中间件注入
  }
}
