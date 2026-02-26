/**
 * 加密和哈希工具
 * 在 Cloudflare Workers 中使用 Web Crypto API
 */

/**
 * 生成 SHA-256 哈希
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成 MD5 哈希（使用 blueimp-md5）
 */
export function md5(data: string): string {
  // 注意：这里需要导入 blueimp-md5
  // import md5 from 'blueimp-md5'
  // return md5(data)
  // 为了避免依赖，这里返回占位符
  throw new Error('MD5 需要导入 blueimp-md5 库')
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成 UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Base64 编码
 */
export function base64Encode(data: string): string {
  return btoa(unescape(encodeURIComponent(data)))
}

/**
 * Base64 解码
 */
export function base64Decode(data: string): string {
  return decodeURIComponent(escape(atob(data)))
}

/**
 * Base64URL 编码（用于 JWT）
 */
export function base64UrlEncode(data: string): string {
  return base64Encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64URL 解码
 */
export function base64UrlDecode(data: string): string {
  let padded = data.replace(/-/g, '+').replace(/_/g, '/')
  while (padded.length % 4) {
    padded += '='
  }
  return base64Decode(padded)
}
