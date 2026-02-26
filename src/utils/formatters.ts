/**
 * 格式化函数
 */

/**
 * 格式化金额（直接格式化为两位小数）
 */
export function formatPrice(amount: number): string {
  return amount.toFixed(2)
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 格式化时间差（返回人类可读的格式）
 */
export function formatTimeDiff(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return `${seconds}秒前`
}

/**
 * 格式化订单号（添加前缀和时间戳）
 */
export function formatOrderNumber(prefix: string = 'ORD'): string {
  const timestamp = Date.now().toString().padStart(14, '0').slice(-14)
  return `${prefix}-${timestamp}`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 隐藏敏感信息（如电话号码、邮箱）
 */
export function maskSensitiveInfo(value: string, type: 'phone' | 'email' = 'phone'): string {
  if (type === 'phone') {
    // 隐藏中间 4 位
    return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  if (type === 'email') {
    // 隐藏 @ 前的部分
    const [local, domain] = value.split('@')
    const masked = local.substring(0, 2) + '*'.repeat(Math.max(0, local.length - 2))
    return `${masked}@${domain}`
  }
  return value
}
