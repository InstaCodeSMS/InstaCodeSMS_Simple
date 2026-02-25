/**
 * Product 领域 - 数据访问层
 * 封装所有与 Supabase 的数据库操作
 */

import type { SupabaseClient } from '../../adapters/database/supabase'
import type { Product, UpstreamProduct, ProductListItem, CreateProductInput, UpdateProductInput } from './product.schema'

/**
 * 数据库查询结果类型（products 关联 upstream_products）
 */
interface ProductWithUpstream {
  id: string
  upstream_product_id: number | null
  title: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  sales_price: number | null
  expiry_pricing: { options: Array<{ expiry: number; label: string; price: number }> } | null
  created_at: string | null
  updated_at: string | null
  upstream_products: {
    id: number
    name: string
    cate_id: number
    price: number | null
    num: number
  } | null
}

/**
 * Product Repository
 * 提供产品的 CRUD 操作和查询
 */
export class ProductRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * 获取产品列表（关联上游产品信息）
   * 只返回 is_active = true 的产品
   */
  async getProductList(): Promise<ProductListItem[]> {
    const { data, error } = await this.db
      .from('products')
      .select(`
        id,
        upstream_product_id,
        title,
        description,
        icon,
        sort_order,
        is_active,
        sales_price,
        expiry_pricing,
        created_at,
        updated_at,
        upstream_products (
          id,
          name,
          cate_id,
          price,
          num
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: false })

    if (error) {
      console.error('[ProductRepo] 获取产品列表失败:', error)
      throw new Error(`获取产品列表失败: ${error.message}`)
    }

    // 转换为 ProductListItem 格式
    return (data as unknown as ProductWithUpstream[]).map((item) => ({
      id: item.id,
      upstream_id: item.upstream_products?.id ?? null,
      cate_id: item.upstream_products?.cate_id ?? null,
      title: item.title,
      description: item.description,
      icon: item.icon,
      sort_order: item.sort_order,
      is_active: item.is_active,
      sales_price: item.sales_price,
      num: item.upstream_products?.num ?? 0,
      expiry_pricing: item.expiry_pricing,
    }))
  }

  /**
   * 根据 ID 获取单个产品
   */
  async getProductById(id: string): Promise<ProductListItem | null> {
    const { data, error } = await this.db
      .from('products')
      .select(`
        id,
        upstream_product_id,
        title,
        description,
        icon,
        sort_order,
        is_active,
        sales_price,
        expiry_pricing,
        created_at,
        updated_at,
        upstream_products (
          id,
          name,
          cate_id,
          price,
          num
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // 未找到
      console.error('[ProductRepo] 获取产品详情失败:', error)
      throw new Error(`获取产品详情失败: ${error.message}`)
    }

    const item = data as unknown as ProductWithUpstream
    return {
      id: item.id,
      upstream_id: item.upstream_products?.id ?? null,
      cate_id: item.upstream_products?.cate_id ?? null,
      title: item.title,
      description: item.description,
      icon: item.icon,
      sort_order: item.sort_order,
      is_active: item.is_active,
      sales_price: item.sales_price,
      num: item.upstream_products?.num ?? 0,
      expiry_pricing: item.expiry_pricing,
    }
  }

  /**
   * 创建产品
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .insert({
        upstream_product_id: input.upstream_product_id,
        title: input.title,
        description: input.description ?? null,
        icon: input.icon ?? null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
        sales_price: input.sales_price ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[ProductRepo] 创建产品失败:', error)
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

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.icon !== undefined) updateData.icon = input.icon
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order
    if (input.is_active !== undefined) updateData.is_active = input.is_active
    if (input.sales_price !== undefined) updateData.sales_price = input.sales_price
    if (input.upstream_product_id !== undefined) updateData.upstream_product_id = input.upstream_product_id

    const { data, error } = await this.db
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ProductRepo] 更新产品失败:', error)
      throw new Error(`更新产品失败: ${error.message}`)
    }

    return data as Product
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.db.from('products').delete().eq('id', id)

    if (error) {
      console.error('[ProductRepo] 删除产品失败:', error)
      throw new Error(`删除产品失败: ${error.message}`)
    }
  }
}

/**
 * UpstreamProduct Repository
 * 提供上游产品的同步和查询操作
 */
export class UpstreamProductRepository {
  constructor(private db: SupabaseClient) {}

  /**
   * 获取所有上游产品
   */
  async getAll(): Promise<UpstreamProduct[]> {
    const { data, error } = await this.db.from('upstream_products').select('*').order('id')

    if (error) {
      console.error('[UpstreamProductRepo] 获取上游产品列表失败:', error)
      throw new Error(`获取上游产品列表失败: ${error.message}`)
    }

    return data as UpstreamProduct[]
  }

  /**
   * 根据 ID 获取上游产品
   */
  async getById(id: number): Promise<UpstreamProduct | null> {
    const { data, error } = await this.db.from('upstream_products').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[UpstreamProductRepo] 获取上游产品详情失败:', error)
      throw new Error(`获取上游产品详情失败: ${error.message}`)
    }

    return data as UpstreamProduct
  }

  /**
   * 批量更新或插入上游产品（Upsert）
   * 用于同步操作
   */
  async upsertMany(products: Array<{
    id: number
    name: string
    cate_id: number
    price: number
    num: number
  }>): Promise<number> {
    const now = new Date().toISOString()
    const records = products.map((p) => ({
      id: p.id,
      name: p.name,
      cate_id: p.cate_id,
      price: p.price,
      num: p.num,
      synced_at: now,
    }))

    const { error } = await this.db.from('upstream_products').upsert(records, { onConflict: 'id' })

    if (error) {
      console.error('[UpstreamProductRepo] 同步上游产品失败:', error)
      throw new Error(`同步上游产品失败: ${error.message}`)
    }

    return records.length
  }

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime(): Promise<Date | null> {
    const { data, error } = await this.db
      .from('upstream_products')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[UpstreamProductRepo] 获取同步时间失败:', error)
      return null
    }

    return data.synced_at ? new Date(data.synced_at) : null
  }
}