/**
 * Product 领域 - 优化后的数据访问层
 * 支持产品分类、库存管理、销售统计等新功能
 */

import type { SupabaseClient } from '../../adapters/database/supabase'
import type { 
  Product, 
  UpstreamProduct, 
  ProductListItem, 
  CreateProductInput, 
  UpdateProductInput,
  ProductCategory,
  ExpiryOption
} from './product.schema'

/**
 * 产品分类 Repository
 */
export class ProductCategoryRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * 获取所有分类
   */
  async getAll(): Promise<ProductCategory[]> {
    const { data, error } = await this.db
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[ProductCategoryRepo] 获取分类列表失败:', error)
      throw new Error(`获取分类列表失败: ${error.message}`)
    }

    return data as ProductCategory[]
  }

  /**
   * 根据 ID 获取分类
   */
  async getById(id: number): Promise<ProductCategory | null> {
    const { data, error } = await this.db
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[ProductCategoryRepo] 获取分类详情失败:', error)
      throw new Error(`获取分类详情失败: ${error.message}`)
    }

    return data as ProductCategory
  }

  /**
   * 创建分类
   */
  async create(category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ProductCategory> {
    const { data, error } = await this.db
      .from('product_categories')
      .insert({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        parent_id: category.parent_id,
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[ProductCategoryRepo] 创建分类失败:', error)
      throw new Error(`创建分类失败: ${error.message}`)
    }

    return data as ProductCategory
  }
}

/**
 * 优化后的 Product Repository
 * 支持产品分类、库存管理、销售统计等新功能
 */
export class OptimizedProductRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * 获取活跃产品列表（使用 v_active_products 视图）
   */
  async getActiveProducts(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 获取活跃产品列表失败:', error)
      throw new Error(`获取活跃产品列表失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 根据分类获取产品
   */
  async getProductsByCategory(categoryId: number): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 根据分类获取产品失败:', error)
      throw new Error(`根据分类获取产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 获取精选产品
   */
  async getFeaturedProducts(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 获取精选产品失败:', error)
      throw new Error(`获取精选产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 获取热门产品
   */
  async getHotProducts(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('is_hot', true)
      .order('total_sales', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 获取热门产品失败:', error)
      throw new Error(`获取热门产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 搜索产品
   */
  async searchProducts(query: string, limit: number = 20): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .rpc('search_products', { search_query: query, result_limit: limit })

    if (error) {
      console.error('[OptimizedProductRepo] 搜索产品失败:', error)
      throw new Error(`搜索产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 根据 ID 获取产品详情
   */
  async getProductById(id: string): Promise<ProductListItem | null> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[OptimizedProductRepo] 获取产品详情失败:', error)
      throw new Error(`获取产品详情失败: ${error.message}`)
    }

    return data as ProductListItem
  }

  /**
   * 根据 slug 获取产品
   */
  async getProductBySlug(slug: string): Promise<ProductListItem | null> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[OptimizedProductRepo] 根据 slug 获取产品失败:', error)
      throw new Error(`根据 slug 获取产品失败: ${error.message}`)
    }

    return data as ProductListItem
  }

  /**
   * 创建产品
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .insert({
        upstream_product_id: input.upstream_product_id,
        category_id: input.category_id,
        title: input.title,
        slug: input.slug,
        description: input.description,
        short_description: input.short_description,
        icon: input.icon,
        sales_price: input.sales_price,
        cost_price: input.cost_price,
        expiry_pricing: input.expiry_pricing,
        stock_type: input.stock_type ?? 'upstream',
        manual_stock: input.manual_stock ?? 0,
        low_stock_threshold: input.low_stock_threshold ?? 10,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
        is_featured: input.is_featured ?? false,
        is_hot: input.is_hot ?? false,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
        meta_keywords: input.meta_keywords,
        i18n_data: input.i18n_data,
      })
      .select()
      .single()

    if (error) {
      console.error('[OptimizedProductRepo] 创建产品失败:', error)
      throw new Error(`创建产品失败: ${error.message}`)
    }

    return data as Product
  }

  /**
   * 更新产品
   */
  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.category_id !== undefined) updateData.category_id = input.category_id
    if (input.title !== undefined) updateData.title = input.title
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.description !== undefined) updateData.description = input.description
    if (input.short_description !== undefined) updateData.short_description = input.short_description
    if (input.icon !== undefined) updateData.icon = input.icon
    if (input.sales_price !== undefined) updateData.sales_price = input.sales_price
    if (input.cost_price !== undefined) updateData.cost_price = input.cost_price
    if (input.expiry_pricing !== undefined) updateData.expiry_pricing = input.expiry_pricing
    if (input.stock_type !== undefined) updateData.stock_type = input.stock_type
    if (input.manual_stock !== undefined) updateData.manual_stock = input.manual_stock
    if (input.low_stock_threshold !== undefined) updateData.low_stock_threshold = input.low_stock_threshold
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order
    if (input.is_active !== undefined) updateData.is_active = input.is_active
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured
    if (input.is_hot !== undefined) updateData.is_hot = input.is_hot
    if (input.meta_title !== undefined) updateData.meta_title = input.meta_title
    if (input.meta_description !== undefined) updateData.meta_description = input.meta_description
    if (input.meta_keywords !== undefined) updateData.meta_keywords = input.meta_keywords
    if (input.i18n_data !== undefined) updateData.i18n_data = input.i18n_data
    if (input.deleted_at !== undefined) updateData.deleted_at = input.deleted_at

    const { data, error } = await this.db
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[OptimizedProductRepo] 更新产品失败:', error)
      throw new Error(`更新产品失败: ${error.message}`)
    }

    return data as Product
  }

  /**
   * 软删除产品
   */
  async softDeleteProduct(id: string): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[OptimizedProductRepo] 软删除产品失败:', error)
      throw new Error(`软删除产品失败: ${error.message}`)
    }
  }

  /**
   * 恢复软删除的产品
   */
  async restoreProduct(id: string): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) {
      console.error('[OptimizedProductRepo] 恢复产品失败:', error)
      throw new Error(`恢复产品失败: ${error.message}`)
    }
  }

  /**
   * 减少手动库存
   */
  async decrementManualStock(productId: string, quantity: number = 1): Promise<void> {
    const { error } = await this.db.rpc('decrement_product_stock', {
      product_id: productId,
      decrement_by: quantity
    })

    if (error) {
      console.error('[OptimizedProductRepo] 减少库存失败:', error)
      throw new Error(`减少库存失败: ${error.message}`)
    }
  }

  /**
   * 获取产品统计信息
   */
  async getProductStats(): Promise<{
    total_products: number
    active_products: number
    featured_products: number
    hot_products: number
    low_stock_products: number
    out_of_stock_products: number
    total_sales: number
    total_revenue: number
  }> {
    const { data, error } = await this.db.rpc('get_product_stats')

    if (error) {
      console.error('[OptimizedProductRepo] 获取产品统计失败:', error)
      throw new Error(`获取产品统计失败: ${error.message}`)
    }

    return data[0]
  }

  /**
   * 获取库存不足的产品
   */
  async getLowStockProducts(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('stock_status', 'low_stock')
      .order('total_sales', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 获取库存不足产品失败:', error)
      throw new Error(`获取库存不足产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }

  /**
   * 获取缺货的产品
   */
  async getOutOfStockProducts(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('v_active_products')
      .select('*')
      .eq('stock_status', 'out_of_stock')
      .order('total_sales', { ascending: false })

    if (error) {
      console.error('[OptimizedProductRepo] 获取缺货产品失败:', error)
      throw new Error(`获取缺货产品失败: ${error.message}`)
    }

    return data as ProductListItem[]
  }
}