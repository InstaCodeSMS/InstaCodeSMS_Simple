/**
 * Telegram 业务服务
 * 处理 Bot 的业务逻辑编排
 */

import type { Env } from '../../types/env'
import { ProductService } from '../product/product.service'

export class TelegramService {
  private productService: ProductService
  private env: Env

  constructor(env: Env) {
    this.env = env
    this.productService = new ProductService(env)
  }

  /**
   * 获取欢迎消息
   */
  getWelcomeMessage(): string {
    return `
👋 欢迎使用 SimpleFaka Bot！

我可以帮你：
🛍️ 查看商品列表
🔍 搜索商品
📦 查看订单
📱 接收短信验证码

选择下方菜单开始吧！
    `.trim()
  }

  /**
   * 获取帮助信息
   */
  getHelpMessage(): string {
    return `
📖 使用帮助

/start - 显示欢迎信息
/products - 查看所有商品
/search <关键词> - 搜索商品
/orders - 查看我的订单
/receive - 进入接码终端
/stop - 停止接码
/help - 显示此帮助信息

💡 提示：
- 点击"打开商城"按钮可以在 Mini App 中购物
- 接码时会实时推送验证码
- 所有订单信息都会保存在账户中
    `.trim()
  }

  /**
   * 获取商品列表消息
   */
  async getProductsMessage(limit: number = 5): Promise<string> {
    try {
      const result = await this.productService.getProductList()
      const products = result.list

      if (products.length === 0) {
        return '暂无可用商品'
      }

      let message = '📦 可用商品列表\n\n'
      products.slice(0, limit).forEach((product, index) => {
        message += `${index + 1}. ${product.title}\n`
        message += `   💰 ¥${product.sales_price}\n`
        message += `   📊 库存: ${product.num}\n\n`
      })

      if (products.length > limit) {
        message += `\n... 还有 ${products.length - limit} 个商品`
      }

      return message
    } catch (error) {
      console.error('Failed to get products message:', error)
      return '❌ 获取商品列表失败，请稍后重试'
    }
  }

  /**
   * 获取搜索结果消息
   */
  async getSearchResultsMessage(query: string, limit: number = 5): Promise<string> {
    try {
      const result = await this.productService.getProductList()
      const products = result.list
      const filtered = products.filter(
        p => p.title.includes(query) || (p.description && p.description.includes(query))
      )

      if (filtered.length === 0) {
        return `❌ 未找到包含 "${query}" 的商品`
      }

      let message = `🔍 搜索结果 (${filtered.length} 个)\n\n`
      filtered.slice(0, limit).forEach((product, index) => {
        message += `${index + 1}. ${product.title}\n`
        message += `   💰 ¥${product.sales_price}\n`
        message += `   📊 库存: ${product.num}\n\n`
      })

      if (filtered.length > limit) {
        message += `\n... 还有 ${filtered.length - limit} 个结果`
      }

      return message
    } catch (error) {
      console.error('Failed to get search results:', error)
      return '❌ 搜索失败，请稍后重试'
    }
  }

  /**
   * 获取订单列表消息
   */
  getOrdersMessage(): string {
    return `
📦 我的订单

(功能开发中...)

💡 提示：
- 订单信息会在支付成功后显示
- 点击订单可查看详情和卡密
    `.trim()
  }

  /**
   * 获取接码终端提示
   */
  getReceivePrompt(): string {
    return `
📱 接码终端

请输入订单号开始监听短信验证码：
    `.trim()
  }
}
