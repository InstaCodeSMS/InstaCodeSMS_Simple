/**
 * ProductCard 共享组件
 * Web 和 Mini App 共用的产品卡片组件
 * 
 * Why: 根据 .clinerules 规范，共享组件放在 src/views/components/
 * 支持通过 variant 参数区分 Web 和 Mini App 渲染
 */

import { raw } from 'hono/html'

// 产品数据类型
export interface Product {
  id: string
  title: string
  description?: string
  sales_price: number
  num: number
  upstream_id?: string
  expiry_options?: ExpiryOption[]
}

export interface ExpiryOption {
  expiry: number
  label: string
  price: number
}

export interface ProductCardProps {
  product: Product
  variant: 'web' | 'mini-app'
  lang?: 'zh' | 'en'
}

/**
 * 获取服务图标
 * 根据 ID 生成一致的图标
 */
export function getServiceIcon(id: string): string {
  const emojis = ['📱', '⚡', '🛡️', '🔑', '🚀', '🤖', '💬', '🌌', '📡', '🌐', '📧', '🎮', '🎬', '🎵', '📚']
  const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return emojis[hash % emojis.length]
}

/**
 * ProductCard 组件
 * 支持两种渲染模式：web（完整版）和 mini-app（精简版）
 */
export function ProductCard({ product, variant, lang = 'zh' }: ProductCardProps): string {
  const isMiniApp = variant === 'mini-app'
  const inStock = product.num > 0
  
  // 文案
  const texts = {
    zh: {
      startingPrice: '起售价',
      stock: '库存',
      outOfStock: '售罄',
      buy: '购买',
      addToCart: '加入购物车'
    },
    en: {
      startingPrice: 'Starting at',
      stock: 'Stock',
      outOfStock: 'Out of Stock',
      buy: 'Buy',
      addToCart: 'Add to Cart'
    }
  }
  
  const t = texts[lang]
  
  // 样式差异
  const cardClass = isMiniApp 
    ? 'card bg-base-100 shadow-md hover:shadow-lg transition-shadow p-4'
    : 'group relative flex flex-col h-full p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden card-hover'
  
  const iconClass = isMiniApp
    ? 'w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-base-200'
    : 'w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all duration-500 border'
  
  const priceClass = isMiniApp
    ? 'text-2xl font-bold text-primary'
    : 'text-3xl font-black font-mono tracking-tighter italic'
  
  // Mini App 精简版
  if (isMiniApp) {
    return raw`
      <div class="${cardClass} ${!inStock ? 'opacity-60' : ''}"
           ${inStock ? `onclick="openProductModal('${product.id}')"` : ''}>
        ${!inStock ? raw`<div class="badge badge-error gap-1 absolute top-2 right-2">${t.outOfStock}</div>` : ''}
        
        <div class="flex items-start gap-4">
          <div class="${iconClass}">
            <span>${getServiceIcon(product.id)}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base truncate">${product.title}</h3>
            <p class="text-sm opacity-60 line-clamp-1">${product.description || ''}</p>
          </div>
        </div>
        
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
          <div>
            <span class="text-xs opacity-60">${t.startingPrice}</span>
            <div class="${priceClass}">
              <span class="text-sm font-normal opacity-60">¥</span>
              ${(product.sales_price || 0).toFixed(2)}
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs opacity-60">${t.stock}</span>
            <div class="${inStock ? 'text-success font-bold' : 'text-error font-bold'}">
              ${inStock ? product.num : t.outOfStock}
            </div>
          </div>
        </div>
        
        ${inStock ? raw`
          <button class="btn btn-primary btn-block mt-4" onclick="event.stopPropagation(); openProductModal('${product.id}')">
            ${t.buy}
          </button>
        ` : ''}
      </div>
    `
  }
  
  // Web 完整版
  return raw`
    <div class="${cardClass} ${inStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}"
         ${inStock ? `@click="openModal(${JSON.stringify(product).replace(/"/g, '"')})"` : ''}
         style="background-color: var(--bg-secondary); border-color: var(--border-color); box-shadow: var(--shadow-card);">
      
      ${!inStock ? raw`
        <div class="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
             :class="theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'">
          ${t.outOfStock}
        </div>
      ` : ''}
      
      <div class="flex items-start justify-between mb-10">
        <div class="${iconClass} ${inStock ? 'group-hover:bg-blue-600 group-hover:text-white' : 'grayscale'}"
             style="background-color: var(--bg-tertiary); border-color: var(--border-color);">
          <span>${getServiceIcon(product.id)}</span>
        </div>
        <div class="text-right">
          <div class="text-[9px] font-mono uppercase tracking-widest mb-1 italic" style="color: var(--text-muted);">
            ${t.startingPrice}
          </div>
          <div class="${priceClass}" style="color: var(--text-primary);">
            <span class="text-sm font-normal not-italic opacity-40 mr-1">¥</span>
            ${(product.sales_price || 0).toFixed(2)}
          </div>
        </div>
      </div>
      
      <div class="flex-grow">
        <h3 class="text-xl font-black mb-3 uppercase tracking-tighter transition-colors ${inStock ? 'group-hover:text-blue-500' : ''}"
            style="color: var(--text-primary);">
          ${product.title}
        </h3>
        <p class="text-[11px] leading-relaxed line-clamp-2 min-h-[2.5rem]" style="color: var(--text-muted);">
          ${product.description || (lang === 'zh' ? '提供5天稳定使用保障' : '5-day stable usage guaranteed')}
        </p>
      </div>
      
      <div class="mt-4 pt-4 border-t" style="border-color: var(--border-color);">
        <div class="flex items-center justify-between text-[10px]">
          <span class="uppercase tracking-wider" style="color: var(--text-muted);">${t.stock}</span>
          <span class="${inStock ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}">
            ${inStock ? product.num : t.outOfStock}
          </span>
        </div>
      </div>
    </div>
  `
}

/**
 * ProductGrid 组件
 * 渲染产品网格
 */
export function ProductGrid(products: Product[], variant: 'web' | 'mini-app', lang: 'zh' | 'en' = 'zh'): string {
  const gridClass = variant === 'mini-app'
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full'
  
  return raw`
    <div class="${gridClass}">
      ${products.map(p => ProductCard({ product: p, variant, lang })).join('')}
    </div>
  `
}

export default ProductCard