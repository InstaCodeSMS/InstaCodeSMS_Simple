/**
 * 禁止缓存中间件
 * 
 * Why: 防止 CDN 和浏览器缓存私有 API 响应
 * 解决隐私模式下显示其他用户信息的安全问题
 * 
 * Security: 所有包含用户数据的 API 都必须使用此中间件
 */

import { Context, Next } from 'hono'

/**
 * 禁止缓存中间件
 * 设置标准的 HTTP 响应头，禁止所有层级的缓存
 * 
 * Headers:
 * - Cache-Control: no-store, no-cache, must-revalidate, private
 *   - no-store: 不存储任何响应内容
 *   - no-cache: 使用前必须验证
 *   - must-revalidate: 过期后必须重新验证
 *   - private: 仅浏览器可缓存，CDN/代理不可缓存
 * - Pragma: no-cache (HTTP/1.0 兼容)
 * - Expires: 0 (立即过期)
 * - Vary: Cookie, Authorization (不同用户返回不同响应)
 */
export async function noCache(c: Context, next: Next) {
  await next()
  
  // 设置禁止缓存响应头
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  c.header('Vary', 'Cookie, Authorization')
}

/**
 * 私有 API 路径匹配器
 * 用于判断哪些路径需要禁止缓存
 */
export const PRIVATE_API_PATHS = [
  '/api/user',
  '/api/auth',
  '/api/orders',
  '/api/payment',
  '/api/sms',
  '/api/telegram',
] as const

/**
 * 检查路径是否为私有 API
 */
export function isPrivateApiPath(path: string): boolean {
  return PRIVATE_API_PATHS.some(p => path.startsWith(p))
}