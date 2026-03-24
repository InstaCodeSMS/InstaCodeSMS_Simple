/**
 * Product 领域 - 增强版数据访问层
 * 支持新的优化表结构和视图
 */

import type { SupabaseClient } from '../../adapters/database/supabase'
import type { 
  Product, 
  ProductListItem, 
  ProductCategory,
  CreateProductInput, 
  UpdateProductInput,
  StockType,
  StockStatus
} from './product.schema'

/**
 * 增强版产品 Repository
 * 提供更高效的查询和新功能支持
 */
export class EnhancedProductRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * 获取活跃产品列表（使用优化视图）
   */
  async getActiveProducts(options?: {
    categoryId?: number
    isFeatured?: boolean
    isHot?: boolean
    stockStatus?: StockStatus
    limit?: number
    offset?: number
    sortBy?: 'sales' | 'price' | 'created_at' | 'sort_order'
    sortOrder?: 'asc' | 'desc'
  }): Promise<ProductListItem[]> {
    let query = this.db.from('v_active_products').select('*')

    // 筛选条件
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }
    if (options?.isFeatured) {
      query = query.eq('is_featured', true)
    }
    if (options?.isHot) {
      query = query.eq('is_hot', true)
    }
    if (options?.stockStatus) {
      query = query.eq('stock_status', options.stockStatus)
    }

    // 排序
    let sortField = 'sort_order'
    let sortAscending = false

    switch (options?.sortBy) {
      case 'sales':
        sortField = 'total_sales'
        sortAscending = options.sortOrder === 'asc'
        break
      case 'price':
        sortField = 'sales_price'
        sortAscending = options.sortOrder === 'asc'
        break
      case 'created_at':
        sortField = 'created_at'
        sortAscending = options.sortOrder === 'asc'
        break
      case 'sort_order':
      default:
        sortField = 'sort_order'
        sortAscending = options.sortOrder === 'asc'
        break
    }

    query = query.order(sortField, { ascending: sortAscending })

    // 分页
    if (options?.limit) {
      if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + options.limit - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[EnhancedProductRepo] 获取产品列表失败:', error)
      throw new Error(`获取产品列表失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 根据 slug 获取产品详情
   */
  async getBySlug(slug: string): Promise<ProductListItem | null> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[EnhancedProductRepo] 获取产品详情失败:', error)
      throw new Error(`获取产品详情失败: ${error.message}`)
    }

    return data as ProductListItem
  }

  /**
   * 全文搜索产品
   */
  async searchProducts(keyword: string, options?: {
    categoryId?: number
    stockStatus?: StockStatus
    limit?: number
    offset?: number
  }): Promise<ProductListItem[]> {
    const { data, error } = await this.db.rpc('search_products', {
      search_query: keyword,
      result_limit: options?.limit || 20
    })

    if (error) {
      console.error('[EnhancedProductRepo] 搜索产品失败:', error)
      throw new Error(`搜索产品失败: ${error.message}`)
    }

    let results = data as ProductListItem[]

    // 应用额外筛选
    if (options?.categoryId) {
      results = results.filter(p => p.category_id === options.categoryId)
    }
    if (options?.stockStatus) {
      results = results.filter(p => p.stock_status === options.stockStatus)
    }

    return results
  }

  /**
   * 获取热门产品（按销量排序）
   */
  async getHotProducts(limit: number = 10): Promise<ProductListItem[]> {
    return this.getActiveProducts({
      isHot: true,
      sortBy: 'sales',
      sortOrder: 'desc',
      limit
    })
  }

  /**
   * 获取精选产品
   */
  async getFeaturedProducts(limit: number = 10): Promise<ProductListItem[]> {
    return this.getActiveProducts({
      isFeatured: true,
      sortBy: 'sales',
      sortOrder: 'desc',
      limit
    })
  }

  /**
   * 获取低库存产品
   */
  async getLowStockProducts(): Promise<ProductListItem[]> {
    return this.getActiveProducts({
      stockStatus: 'low_stock' as StockStatus
    })
  }

  /**
   * 获取缺货产品
   */
  async getOutOfStockProducts(): Promise<ProductListItem[]> {
    return this.getActiveProducts({
      stockStatus: 'out_of_stock' as StockStatus
    })
  }

  /**
   * 获取分类下的产品
   */
  async getProductsByCategory(categoryId: number, options?: {
    stockStatus?: StockStatus
    limit?: number
    offset?: number
  }): Promise<ProductListItem[]> {
    return this.getActiveProducts({
      categoryId,
      stockStatus: options?.stockStatus,
      limit: options?.limit,
      offset: options?.offset
    })
  }

  /**
   * 获取产品统计信息
   */
  async getProductStats(): Promise<{
    totalProducts: number
    activeProducts: number
    featuredProducts: number
    hotProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    totalSales: number
    totalRevenue: number
  }> {
    const { data, error } = await this.db.rpc('get_product_stats')

    if (error) {
      console.error('[EnhancedProductRepo] 获取产品统计失败:', error)
      throw new Error(`获取产品统计失败: ${error.message}`)
    }

    return data as any
  }

  /**
   * 更新产品库存（手动库存模式）
   */
  async updateStock(id: string, quantity: number): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ 
        manual_stock: quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('stock_type', 'manual')

    if (error) {
      console.error('[EnhancedProductRepo] 更新库存失败:', error)
      throw new Error(`更新库存失败: ${error.message}`)
    }
  }

  /**
   * 减少库存（购买时调用）
   */
  async decrementStock(id: string, quantity: number = 1): Promise<void> {
    const { error } = await this.db.rpc('decrement_product_stock', {
      product_id: id,
      decrement_by: quantity
    })

    if (error) {
      console.error('[EnhancedProductRepo] 减少库存失败:', error)
      throw new Error(`减少库存失败: ${error.message}`)
    }
  }

  /**
   * 批量更新产品状态
   */
  async batchUpdateStatus(productIds: string[], isActive: boolean): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)

    if (error) {
      console.error('[EnhancedProductRepo] 批量更新状态失败:', error)
      throw new Error(`批量更新状态失败: ${error.message}`)
    }
  }

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await this.db
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[EnhancedProductRepo] 获取分类列表失败:', error)
      throw new Error(`获取分类列表失败: ${error.message}`)
    }

    return data as ProductCategory[]
  }

  /**
   * 根据分类 slug 获取分类
   */
  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    const { data, error } = await this.db
      .from('product_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[EnhancedProductRepo] 获取分类失败:', error)
      throw new Error(`获取分类失败: ${error.message}`)
    }

    return data as ProductCategory
  }
}

/**
 * 创建增强版产品仓库实例
 */
export function createEnhancedProductRepository(client: SupabaseClient): EnhancedProductRepository {
  return new EnhancedProductRepository(client)
}