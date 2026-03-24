/**
 * Product 领域 - 优化后的业务逻辑层
 * 支持产品分类、库存管理、销售统计等新功能
 */

import { createSupabaseClient, createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createUpstreamClient } from '../../adapters/upstream'
import { ProductCategoryRepository, OptimizedProductRepository } from './product.repo.optimized'
import type { 
  ProductListItem, 
  CreateProductInput, 
  UpdateProductInput,
  ProductCategory
} from './product.schema'
import type { Env } from '../../types/env'

/**
 * 产品服务响应类型
 */
export interface ProductListResult {
  list: ProductListItem[]
  total: number
}

export interface SyncResult {
  success: boolean
  message: string
  syncedCount: number
  timestamp: string
}

export interface ProductStats {
  total_products: number
  active_products: number
  featured_products: number
  hot_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_sales: number
  total_revenue: number
}

/**
 * 优化后的 ProductService
 * 支持产品分类、库存管理、销售统计等新功能
 */
export class OptimizedProductService {
  private categoryRepo: ProductCategoryRepository
  private productRepo: OptimizedProductRepository
  private env: Env

  constructor(env: Env) {
    const db = createSupabaseClient(env)
    this.categoryRepo = new ProductCategoryRepository(db)
    this.productRepo = new OptimizedProductRepository(db)
    this.env = env
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<ProductCategory[]> {
    return this.categoryRepo.getAll()
  }

  /**
   * 创建分类
   */
  async createCategory(category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ProductCategory> {
    return this.categoryRepo.create(category)
  }

  /**
   * 获取活跃产品列表
   */
  async getActiveProducts(): Promise<ProductListResult> {
    const list = await this.productRepo.getActiveProducts()
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 根据分类获取产品
   */
  async getProductsByCategory(categoryId: number): Promise<ProductListResult> {
    const list = await this.productRepo.getProductsByCategory(categoryId)
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 获取精选产品
   */
  async getFeaturedProducts(): Promise<ProductListResult> {
    const list = await this.productRepo.getFeaturedProducts()
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 获取热门产品
   */
  async getHotProducts(): Promise<ProductListResult> {
    const list = await this.productRepo.getHotProducts()
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 搜索产品
   */
  async searchProducts(query: string, limit: number = 20): Promise<ProductListResult> {
    const list = await this.productRepo.searchProducts(query, limit)
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 根据 ID 获取产品详情
   */
  async getProductById(id: string): Promise<ProductListItem | null> {
    return this.productRepo.getProductById(id)
  }

  /**
   * 根据 slug 获取产品
   */
  async getProductBySlug(slug: string): Promise<ProductListItem | null> {
    return this.productRepo.getProductBySlug(slug)
  }

  /**
   * 创建产品
   */
  async createProduct(input: CreateProductInput) {
    // 验证分类是否存在
    if (input.category_id) {
      const category = await this.categoryRepo.getById(input.category_id)
      if (!category) {
        throw new Error(`分类 ID ${input.category_id} 不存在`)
      }
    }

    return this.productRepo.createProduct(input)
  }

  /**
   * 更新产品
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    // 如果要更新 category_id，验证是否存在
    if (input.category_id !== undefined && input.category_id !== null) {
      const category = await this.categoryRepo.getById(input.category_id)
      if (!category) {
        throw new Error(`分类 ID ${input.category_id} 不存在`)
      }
    }

    return this.productRepo.updateProduct(id, input)
  }

  /**
   * 软删除产品
   */
  async softDeleteProduct(id: string) {
    return this.productRepo.softDeleteProduct(id)
  }

  /**
   * 恢复软删除的产品
   */
  async restoreProduct(id: string) {
    return this.productRepo.restoreProduct(id)
  }

  /**
   * 减少手动库存
   */
  async decrementManualStock(productId: string, quantity: number = 1) {
    return this.productRepo.decrementManualStock(productId, quantity)
  }

  /**
   * 获取产品统计信息
   */
  async getProductStats(): Promise<ProductStats> {
    return this.productRepo.getProductStats()
  }

  /**
   * 获取库存不足的产品
   */
  async getLowStockProducts(): Promise<ProductListResult> {
    const list = await this.productRepo.getLowStockProducts()
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 获取缺货的产品
   */
  async getOutOfStockProducts(): Promise<ProductListResult> {
    const list = await this.productRepo.getOutOfStockProducts()
    return {
      list,
      total: list.length,
    }
  }

  /**
   * 同步上游产品
   * 从上游 API 拉取产品列表并写入 upstream_products 表
   * 使用 Service Key 绕过 RLS
   */
  async syncUpstreamProducts(): Promise<SyncResult> {
    try {
      const client = createUpstreamClient({
        UPSTREAM_API_URL: this.env.UPSTREAM_API_URL,
        UPSTREAM_API_TOKEN: this.env.UPSTREAM_API_TOKEN,
      })

      // 获取上游产品列表
      const data = await client.getAppList({})

      // 转换为数据库格式
      const products = data.list.map((item) => ({
        id: item.id,
        name: item.name,
        cate_id: item.cate_id,
        price: parseFloat(item.price),
        num: item.num,
      }))

      // 使用 Service Client 绕过 RLS 进行写入
      const serviceDb = createSupabaseServiceClient(this.env)
      const serviceUpstreamRepo = new (await import('./product.repo')).UpstreamProductRepository(serviceDb)
      const syncedCount = await serviceUpstreamRepo.upsertMany(products)

      return {
        success: true,
        message: `成功同步 ${syncedCount} 个上游产品`,
        syncedCount,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败'
      return {
        success: false,
        message,
        syncedCount: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus() {
    const lastSyncTime = await (await import('./product.repo')).UpstreamProductRepository.prototype.getLastSyncTime.call(this.productRepo)
    const upstreamProducts = await (await import('./product.repo')).UpstreamProductRepository.prototype.getAll.call(this.productRepo)

    return {
      lastSyncTime,
      totalUpstreamProducts: upstreamProducts.length,
    }
  }

  /**
   * 获取所有上游产品（用于管理界面选择）
   */
  async getUpstreamProducts() {
    return (await import('./product.repo')).UpstreamProductRepository.prototype.getAll.call(this.productRepo)
  }
}