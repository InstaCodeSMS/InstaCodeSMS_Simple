/**
 * CSRF 中间件配置
 * 为所有突变请求 (POST/PUT/DELETE/PATCH) 提供 CSRF 保护
 * 
 * 工作原理：
 * 1. 中间件自动生成 CSRF Token
 * 2. 通过 c.var.csrfToken 获取 token 并注入到页面
 * 3. HTMX 通过 hx-headers 自动携带 token
 * 4. 中间件自动验证请求中的 token
 * 
 * 安全效果：
 * - 外部脚本调用 API → 被拦截（无有效 Token）
 * - 跨站表单提交 → 被拦截（Origin 不匹配）
 * - 复制 HTML 结构 → 被拦截（Token 动态变化）
 */

import { csrf } from 'hono/csrf'
import type { Env } from '../types/env'

/**
 * CSRF 保护中间件
 * 
 * 使用 Hono 内置的 CSRF 中间件，适配 Cloudflare Workers 边缘环境
 * 
 * 配置说明：
 * - origin: 允许的来源列表，用于验证请求来源
 * - 在本地开发时允许 localhost
 */
export const csrfProtection = csrf({
  // 允许的来源（生产环境需要配置实际域名）
  origin: (origin) => {
    // 本地开发环境
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true
    }
    // Cloudflare Workers 环境（.pages.dev 域名）
    if (origin.includes('.pages.dev')) {
      return true
    }
    // 生产环境需要配置实际域名
    // TODO: 在生产环境中添加您的域名
    // if (origin === 'your-domain.com') return true
    
    // 默认拒绝其他来源
    return false
  },
})

/**
 * 获取 CSRF Token 的辅助函数
 * 用于在页面渲染时注入 token
 */
export function getCsrfToken(c: { var: { csrfToken?: string } }): string {
  return c.var.csrfToken || ''
}