import { z } from 'zod'

/**
 * Cloudflare Workers 环境变量 Schema
 * 所有环境变量必须在此定义并通过 Zod 校验
 */
const envSchema = z.object({
  // 上游 API 配置
  UPSTREAM_API_URL: z.string().url('上游 API URL 必须是有效的 URL'),
  UPSTREAM_API_TOKEN: z.string().min(1, '上游 API Token 不能为空'),

  // 支付配置
  ALIPAY_APP_ID: z.string().optional(),
  ALIPAY_PRIVATE_KEY: z.string().optional(),
  ALIPAY_PUBLIC_KEY: z.string().optional(),

  // Telegram Bot 配置
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().url().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  // 价格配置
  PRICE_MARKUP: z.string().default('1.0'),

  // 日志级别
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type Env = z.infer<typeof envSchema>

/**
 * 验证并返回环境变量
 * @throws 如果环境变量不符合 schema，抛出详细错误
 */
export function validateEnv(env: unknown): Env {
  const result = envSchema.safeParse(env)

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(`环境变量验证失败:\n${errors}`)
  }

  return result.data
}
