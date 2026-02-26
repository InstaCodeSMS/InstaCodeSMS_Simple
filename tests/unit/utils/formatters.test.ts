/**
 * 格式化函数单元测试
 */

import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, formatTimeDiff, formatOrderNumber, maskSensitiveInfo } from '@/utils/formatters'

describe('Formatters', () => {
  describe('formatPrice', () => {
    it('应该格式化价格为两位小数', () => {
      expect(formatPrice(99.5)).toBe('99.50')
      expect(formatPrice(100)).toBe('100.00')
      expect(formatPrice(0.1)).toBe('0.10')
    })

    it('应该处理大数字', () => {
      expect(formatPrice(1000000)).toBe('1000000.00')
    })
  })

  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('01')
      expect(formatted).toContain('15')
    })
  })

  describe('formatOrderNumber', () => {
    it('应该生成有效的订单号', () => {
      const orderNum = formatOrderNumber()
      expect(orderNum).toMatch(/^ORD-\d{14}$/)
    })
  })

  describe('maskSensitiveInfo', () => {
    it('应该隐藏敏感信息', () => {
      const masked = maskSensitiveInfo('13800138000')
      expect(masked).toBe('138****8000')
    })

    it('应该处理短字符串', () => {
      const masked = maskSensitiveInfo('abc')
      expect(masked.length).toBeLessThanOrEqual(3)
    })
  })
})
