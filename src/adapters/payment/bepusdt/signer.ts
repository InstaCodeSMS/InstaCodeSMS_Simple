/**
 * BEpusdt MD5 签名器
 * 用于生成和验证 BEpusdt API 签名
 */

/**
 * MD5 实现（纯 JavaScript，兼容 Cloudflare Workers）
 * 基于 RFC 1321 标准
 */
function md5(string: string): string {
  function rotateLeft(x: number, n: number) {
    return (x << n) | (x >>> (32 - n))
  }

  function addUnsigned(x: number, y: number) {
    const x8 = x & 0x80000000
    const y8 = y & 0x80000000
    const x4 = x & 0x40000000
    const y4 = y & 0x40000000
    const result = (x & 0x3fffffff) + (y & 0x3fffffff)
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8
      return result ^ 0x40000000 ^ x8 ^ y8
    }
    return result ^ x8 ^ y8
  }

  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z)
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z)
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z)
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function convertToWordArray(str: string) {
    const utf8 = unescape(encodeURIComponent(str))
    const len = utf8.length
    const words = []
    for (let i = 0; i < len; i += 4) {
      words.push(
        (utf8.charCodeAt(i) || 0) |
          ((utf8.charCodeAt(i + 1) || 0) << 8) |
          ((utf8.charCodeAt(i + 2) || 0) << 16) |
          ((utf8.charCodeAt(i + 3) || 0) << 24)
      )
    }
    // 添加长度信息
    const bitLen = len * 8
    words[len >> 2] |= 0x80 << ((len % 4) * 8)
    words[(((len + 8) >>> 6) << 4) + 14] = bitLen
    return words
  }

  function wordToHex(value: number) {
    let hex = ''
    for (let i = 0; i < 4; i++) {
      const byte = (value >>> (i * 8)) & 255
      hex += ('0' + byte.toString(16)).slice(-2)
    }
    return hex
  }

  const x = convertToWordArray(string)
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d

    a = FF(a, b, c, d, x[k], 7, 0xd76aa478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee)
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af)
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821)

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = GG(b, c, d, a, x[k], 20, 0xe9b6c7aa)
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d)
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a)

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c)
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6)
    d = HH(d, a, b, c, x[k], 11, 0xeaa127fa)
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665)

    a = II(a, b, c, d, x[k], 6, 0xf4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97)
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f)
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0)
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82)
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235)
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb)
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

/**
 * BEpusdt 签名器
 */
export class BepusdtSigner {
  private apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  /**
   * 生成签名
   * 签名算法：
   * 1. 筛选所有非空且非 signature 的参数
   * 2. 按参数名 ASCII 码从小到大排序（字典序）
   * 3. 按 key=value 格式拼接，使用 & 连接
   * 4. 在拼接字符串末尾追加 API Token（无 & 符号）
   * 5. 对完整字符串进行 MD5 加密
   * 6. 将结果转为小写即为 signature
   */
  generateSignature(params: Record<string, unknown>): string {
    // 1. 筛选非空且非 signature 的参数
    const filteredParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'signature' && value !== null && value !== undefined && value !== '') {
        filteredParams[key] = String(value)
      }
    }

    // 2. 按 ASCII 码字典序排序
    const sortedKeys = Object.keys(filteredParams).sort()

    // 3. 拼接 key=value&key2=value2
    const signContent = sortedKeys.map((key) => `${key}=${filteredParams[key]}`).join('&')

    // 4. 追加 API Token
    const contentWithToken = signContent + this.apiToken

    // 调试日志
    console.log('[BEpusdt] 签名调试:', {
      sortedKeys,
      signContent,
      contentWithToken: signContent + '(TOKEN)',
      signature: md5(contentWithToken),
    })

    // 5. MD5 加密并转小写
    return md5(contentWithToken)
  }

  /**
   * 验证签名
   * @param params 参数对象（包含 signature 字段）
   * @returns 签名是否有效
   */
  verifySignature(params: Record<string, unknown> | { signature?: unknown; [key: string]: unknown }): boolean {
    const signature = params.signature

    if (!signature || typeof signature !== 'string') {
      return false
    }

    // 移除 signature 字段后生成签名
    const { signature: _, ...restParams } = params
    const expectedSignature = this.generateSignature(restParams as Record<string, unknown>)
    return signature === expectedSignature
  }
}

/**
 * 创建 BEpusdt 签名器实例
 */
export function createSigner(apiToken: string): BepusdtSigner {
  return new BepusdtSigner(apiToken)
}
