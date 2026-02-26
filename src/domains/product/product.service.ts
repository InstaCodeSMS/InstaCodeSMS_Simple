/**
 * Product 领域 - 业务逻辑层
 * 协调 Supabase 和上游 API 的数据合并
 */

import { createSupabaseClient, createSupabaseServiceClient } from '../../adapters/database/supabase'
import { createUpstreamClient } from '../../adapters/upstream'
import { ProductRepository, UpstreamProductRepository } from './product.repo'
import type { ProductListItem, CreateProductInput, UpdateProductInput } from './product.schema'
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

/**
 * ProductService
 * 提供产品相关的业务逻辑
 */
export class ProductService {
  private productRepo: ProductRepository
  private upstreamProductRepo: UpstreamProductRepository
  private env: Env

  constructor(env: Env) {
    const db = createSupabaseClient(env)
    this.productRepo = new ProductRepository(db)
    this.upstreamProductRepo = new UpstreamProductRepository(db)
    this.env = env
  }

  /**
   * 获取产品列表
   * 从 Supabase 获取产品，sales_price 直接从 products 表读取
   */
  async getProductList(): Promise<ProductListResult> {
    const list = await this.productRepo.getProductList()
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
   * 创建产品
   */
  async createProduct(input: CreateProductInput) {
    // 验证上游产品是否存在
    const upstreamProduct = await this.upstreamProductRepo.getById(input.upstream_product_id)
    if (!upstreamProduct) {
      throw new Error(`上游产品 ID ${input.upstream_product_id} 不存在，请先同步上游产品`)
    }

    return this.productRepo.createProduct(input)
  }

  /**
   * 更新产品
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    // 如果要更新 upstream_product_id，验证是否存在
    if (input.upstream_product_id !== undefined) {
      const upstreamProduct = await this.upstreamProductRepo.getById(input.upstream_product_id)
      if (!upstreamProduct) {
        throw new Error(`上游产品 ID ${input.upstream_product_id} 不存在`)
      }
    }

    return this.productRepo.updateProduct(id, input)
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: string) {
    return this.productRepo.deleteProduct(id)
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
      const serviceUpstreamRepo = new UpstreamProductRepository(serviceDb)
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
    const lastSyncTime = await this.upstreamProductRepo.getLastSyncTime()
    const upstreamProducts = await this.upstreamProductRepo.getAll()

    return {
      lastSyncTime,
      totalUpstreamProducts: upstreamProducts.length,
    }
  }

  /**
   * 获取所有上游产品（用于管理界面选择）
   */
  async getUpstreamProducts() {
    return this.upstreamProductRepo.getAll()
  }
}
