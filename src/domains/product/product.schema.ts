/**
 * Product 领域 - Zod 校验规则
 * 定义产品和上游产品的数据结构
 */

import { z } from 'zod'

/**
 * 库存类型枚举
 */
export enum StockType {
  UPSTREAM = 'upstream',  // 使用上游库存
  MANUAL = 'manual',      // 手动管理库存
  UNLIMITED = 'unlimited' // 无限库存
}

/**
 * 库存状态枚举
 */
export enum StockStatus {
  SUFFICIENT = 'sufficient',     // 库存充足
  LOW_STOCK = 'low_stock',       // 库存不足
  OUT_OF_STOCK = 'out_of_stock'  // 缺货
}

/**
 * 有效期定价选项 Schema
 */
export const ExpiryOptionSchema = z.object({
  expiry: z.number(),           // 有效期类型 ID
  label: z.string(),            // 显示标签
  price: z.number().min(0),     // 独立价格
})

/**
 * 有效期定价配置 Schema (存储在 products.expiry_pricing 字段)
 */
export const ExpiryPricingSchema = z.object({
  options: z.array(ExpiryOptionSchema),
})

/**
 * 产品分类 Schema
 */
export const ProductCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  parent_id: z.number().nullable(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

/**
 * 上游产品 Schema（对应 upstream_products 表）
 */
export const UpstreamProductSchema = z.object({
  id: z.number(),                    // 上游 app_id
  name: z.string(),                  // 上游原始名称
  cate_id: z.number(),               // 上游分类 ID
  price: z.number().nullable(),      // 上游价格
  num: z.number().default(0),        // 实时库存
  synced_at: z.string().nullable(),  // 最后同步时间
  created_at: z.string().nullable(),
})

/**
 * 完整产品 Schema（优化后的版本）
 */
export const ProductSchema = z.object({
  id: z.string().uuid(),                        // UUID 主键
  upstream_product_id: z.number(),              // 关联的上游产品 ID (改为 NOT NULL)
  category_id: z.number().nullable(),           // 产品分类ID
  title: z.string(),                            // 产品名称
  slug: z.string(),                             // URL友好标识
  description: z.string().nullable(),           // 产品描述
  short_description: z.string().nullable(),     // 简短描述
  icon: z.string().nullable(),                  // 图标
  sales_price: z.number().min(0),               // 销售价格（起步价，改为 NOT NULL）
  cost_price: z.number().min(0).nullable(),     // 成本价
  expiry_pricing: ExpiryPricingSchema.nullable(), // 有效期定价配置
  stock_type: z.enum(['upstream', 'manual', 'unlimited']), // 库存类型
  manual_stock: z.number().min(0).default(0),   // 手动库存
  low_stock_threshold: z.number().min(0).default(10), // 低库存阈值
  total_sales: z.number().min(0).default(0),    // 总销量
  total_revenue: z.number().min(0).default(0),  // 总收入
  sort_order: z.number().default(0),            // 排序权重
  is_active: z.boolean().default(true),         // 是否上架
  is_featured: z.boolean().default(false),      // 是否精选
  is_hot: z.boolean().default(false),           // 是否热门
  meta_title: z.string().nullable(),            // SEO标题
  meta_description: z.string().nullable(),      // SEO描述
  meta_keywords: z.array(z.string()).nullable(), // SEO关键词
  i18n_data: z.record(z.any()).nullable(),      // 多语言数据
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),            // 软删除
})

/**
 * 产品列表项（带库存信息，用于前端展示）
 */
export const ProductListItemSchema = z.object({
  id: z.string().uuid(),                        // products.id
  upstream_product_id: z.number(),              // upstream_products.id
  category_id: z.number().nullable(),           // 分类ID
  category_name: z.string().nullable(),         // 分类名称
  title: z.string(),                            // 产品名称
  slug: z.string(),                             // URL友好标识
  description: z.string().nullable(),
  short_description: z.string().nullable(),
  icon: z.string().nullable(),
  sales_price: z.number(),                      // 销售价格
  expiry_pricing: ExpiryPricingSchema.nullable(),
  sort_order: z.number().default(0),
  is_featured: z.boolean().default(false),
  is_hot: z.boolean().default(false),
  total_sales: z.number().default(0),
  available_stock: z.number(),                  // 计算后的可用库存
  stock_type: z.enum(['upstream', 'manual', 'unlimited']),
  stock_status: z.enum(['sufficient', 'low_stock', 'out_of_stock']), // 计算后的库存状态
  low_stock_threshold: z.number().default(10),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

/**
 * 创建产品请求 Schema
 */
export const CreateProductSchema = z.object({
  upstream_product_id: z.number(),              // 必须关联上游产品
  category_id: z.number().optional(),           // 分类ID
  title: z.string().min(1, '产品名称不能为空'),
  slug: z.string().optional(),                  // 可选，会自动生成
  description: z.string().optional(),
  short_description: z.string().optional(),
  icon: z.string().optional(),
  sales_price: z.number().min(0, '销售价格必须大于等于0'),
  cost_price: z.number().min(0).optional(),     // 成本价
  expiry_pricing: ExpiryPricingSchema.optional(),
  stock_type: z.enum(['upstream', 'manual', 'unlimited']).default('upstream'),
  manual_stock: z.number().min(0).default(0),
  low_stock_threshold: z.number().min(0).default(10),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_hot: z.boolean().default(false),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  i18n_data: z.record(z.any()).optional(),
})

/**
 * 更新产品请求 Schema
 */
export const UpdateProductSchema = z.object({
  category_id: z.number().optional(),
  title: z.string().min(1, '产品名称不能为空').optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  icon: z.string().optional(),
  sales_price: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  expiry_pricing: ExpiryPricingSchema.optional(),
  stock_type: z.enum(['upstream', 'manual', 'unlimited']).optional(),
  manual_stock: z.number().min(0).optional(),
  low_stock_threshold: z.number().min(0).optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_hot: z.boolean().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  i18n_data: z.record(z.any()).optional(),
  deleted_at: z.string().optional(), // 软删除
})

// 导出类型
export type ProductCategory = z.infer<typeof ProductCategorySchema>
export type ExpiryOption = z.infer<typeof ExpiryOptionSchema>
export type ExpiryPricing = z.infer<typeof ExpiryPricingSchema>
export type UpstreamProduct = z.infer<typeof UpstreamProductSchema>
export type Product = z.infer<typeof ProductSchema>
export type ProductListItem = z.infer<typeof ProductListItemSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
