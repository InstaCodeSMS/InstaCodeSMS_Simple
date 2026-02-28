// Cloudflare Pages 环境变量类型定义

import type { AuthenticatedUser } from './telegram'

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
  SHOP_URL?: string // 商城网页 URL

  // 管理员配置
  ADMIN_SECRET?: string // 管理员操作密钥

  // API 基础 URL
  API_BASE_URL: string
}

// 扩展 Hono 的环境类型
declare module 'hono' {
  interface ContextVariableMap {
    env: Env
    csrfToken: string  // CSRF Token，由 CSRF 中间件自动注入
  }
}
