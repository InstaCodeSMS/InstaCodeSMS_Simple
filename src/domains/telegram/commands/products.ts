/**
 * /products 命令处理器
 * 显示商品列表
 */

import type { Context } from 'grammy'
import { TelegramService } from '../telegram.service'
import type { Env } from '../../../types/env'
import { ProductService } from '../../product/product.service'

export async function handleProducts(ctx: Context, env: Env) {
  try {
    const service = new TelegramService(env)
    const message = await service.getProductsMessage(5)

    const productService = new ProductService(env)
    const result = await productService.getProductList()
    const products = result.list

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: products.slice(0, 5).map((product) => [
          { text: `${product.title} (¥${product.sales_price})`, callback_data: `product_${product.id}` }
        ])
      }
    })
  } catch (error) {
    console.error('Error in handleProducts:', error)
    await ctx.reply('❌ 获取商品列表失败，请稍后重试')
  }
}
