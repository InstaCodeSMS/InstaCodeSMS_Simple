/**
 * Mini App 路由
 * Telegram Mini App 专用路由
 * 
 * Why: Mini App 需要独立的路由入口
 * 使用共享组件的服务器端渲染
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import MiniAppLayout from '@/views/layouts/MiniAppLayout'
import MiniAppPurchasePage from '@/views/pages/MiniAppPurchasePage'
import { createSupabaseClient } from '@/adapters/database/supabase'
import type { Env } from '@/types/env'
import type { Product } from '@/views/components/ProductCard'

const miniApp = new Hono<{ Bindings: Env }>()

// 启用 CORS
miniApp.use('*', cors())

/**
 * Mini App 首页 - 产品列表
 */
miniApp.get('/', async (c) => {
  const lang = c.req.query('lang') === 'en' ? 'en' : 'zh'
  const csrfToken = c.get('csrfToken') || ''
  
  try {
    // 获取产品数据
    const supabase = createSupabaseClient(c.env)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, description, sales_price, stock, upstream_id, expiry_options')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Failed to fetch products:', error)
    }
    
    // 转换为 Product 格式
    const productList: Product[] = (products || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      sales_price: p.sales_price || 0,
      num: p.stock || 0,
      upstream_id: p.upstream_id,
      expiry_options: p.expiry_options || []
    }))
    
    const content = MiniAppPurchasePage({ products: productList, lang, csrfToken })
    
    return c.html(MiniAppLayout({
      title: lang === 'zh' ? '购买服务' : 'Purchase',
      children: content,
      lang,
      csrfToken
    }))
  } catch (error) {
    console.error('Mini App error:', error)
    return c.html(MiniAppLayout({
      title: 'Error',
      children: '<div class="text-center py-12"><p class="text-red-500">加载失败，请重试</p></div>',
      lang,
      csrfToken: ''
    }))
  }
})

/**
 * Mini App 购买页面
 */
miniApp.get('/purchase', async (c) => {
  const lang = c.req.query('lang') === 'en' ? 'en' : 'zh'
  // 复用首页逻辑
  return c.redirect('/mini-app?lang=' + lang)
})

/**
 * Mini App API - 获取产品列表
 */
miniApp.get('/api/products', async (c) => {
  // 复用现有 API
  const response = await fetch(new URL('/api/services', c.req.url))
  return response
})

/**
 * Mini App API - 搜索产品
 */
miniApp.get('/api/products/search', async (c) => {
  const query = c.req.query('q') || ''
  const response = await fetch(new URL(`/api/services?search=${encodeURIComponent(query)}`, c.req.url))
  return response
})

export default miniApp