// Cloudflare Pages 环境变量类型定义

import type { AuthenticatedUser } from './telegram'

export interface Env {
  // 上游 API 配置
  UPSTREAM_API_URL: string
  UPSTREAM_API_TOKEN: string
  SMS_API_URL?: string // 验证码 API 域名（可选）

  // 价格加成配置（可选，默认 1.5）
  PRICE_MARKUP?: string

  // Supabase 配置
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SERVICE_KEY: string

  // Better Auth 配置
  DATABASE_URL?: string // Supabase 直连 URL（用于 Better Auth）
  BASE_URL?: string // 应用基础 URL
  SITE_URL?: string // 站点 URL（备用）

  // BEpusdt 支付配置
  BEPUSDT_API_URL: string
  BEPUSDT_API_TOKEN: string
  BEPUSDT_NOTIFY_URL?: string // 可选，支付回调地址

  // AliMPay 支付配置
  ALIMPAY_API_URL?: string // AliMPay 部署地址
  ALIMPAY_PID?: string // 商户 ID
  ALIMPAY_KEY?: string // 商户密钥

  // E-pay 支付配置
  EPAY_API_URL?: string // E-pay API 地址
  EPAY_PID?: string // 商户 ID
  EPAY_KEY?: string // 商户密钥
  EPAY_SIGN_TYPE?: string // 签名类型 (MD5 或 RSA)
  EPAY_PUBLIC_KEY?: string // 平台公钥（RSA 验证用）
  EPAY_PRIVATE_KEY?: string // 商户私钥（RSA 签名用）

  // Token Pay 支付配置
  TOKENPAY_API_URL?: string // Token Pay API 地址
  TOKENPAY_MERCHANT_ID?: string // 商户 ID
  TOKENPAY_API_KEY?: string // API 密钥

  // PayPal 支付配置
  PAYPAL_CLIENT_ID?: string // PayPal Client ID
  PAYPAL_CLIENT_SECRET?: string // PayPal Client Secret
  PAYPAL_MODE?: string // 模式 (sandbox 或 live)

  // Stripe 支付配置
  STRIPE_SECRET_KEY?: string // Stripe Secret Key
  STRIPE_PUBLISHABLE_KEY?: string // Stripe Publishable Key
  STRIPE_WEBHOOK_SECRET?: string // Stripe Webhook Secret

  // WeChat Pay 支付配置
  WECHATPAY_MERCHANT_ID?: string // 商户 ID
  WECHATPAY_API_V3_KEY?: string // API v3 密钥
  WECHATPAY_PRIVATE_KEY?: string // 私钥
  WECHATPAY_CERTIFICATE?: string // 证书

  // Telegram Bot 配置
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_WEBHOOK_URL?: string
  TELEGRAM_WEBHOOK_SECRET?: string // Webhook Secret Token (用于验证请求来源)
  SHOP_URL?: string // 商城网页 URL

  // 管理员配置
  TELEGRAM_ADMIN_SECRET?: string // Telegram 管理员操作密钥

  // API 基础 URL
  API_BASE_URL: string

  // Cloudflare Hyperdrive（用于 Better Auth 数据库连接）
  HYPERDRIVE?: {
    connectionString: string
  }
}

// 用户类型定义
export interface User {
  id: string
  email: string
  role: string
  telegramId?: number
  created_at: string
}

// 扩展 Hono 的环境类型
declare module 'hono' {
  interface ContextVariableMap {
    env: Env
    csrfToken: string  // CSRF Token，由 CSRF 中间件自动注入
    user: User         // 用户信息，由认证中间件注入
    sessionId: string  // 会话 ID，由认证中间件注入
  }
}
