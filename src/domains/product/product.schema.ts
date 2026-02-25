/**
 * Product 领域 - Zod 校验规则
 * 定义产品和上游产品的数据结构
 */

import { z } from 'zod'

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
 * 产品 Schema（对应 products 表）
 */
export const ProductSchema = z.object({
  id: z.string().uuid(),                        // UUID 主键
  upstream_product_id: z.number().nullable(),   // 关联的上游产品 ID
  title: z.string(),                            // 产品名称
  description: z.string().nullable(),           // 产品描述
  icon: z.string().nullable(),                  // 图标
  sort_order: z.number().default(0),            // 排序权重
  is_active: z.boolean().default(true),         // 是否上架
  sales_price: z.number().nullable(),           // 销售价格（起步价）
  expiry_pricing: ExpiryPricingSchema.nullable(), // 有效期定价配置
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

/**
 * 产品列表项（包含上游信息，用于前端展示）
 */
export const ProductListItemSchema = z.object({
  id: z.string().uuid(),                        // products.id
  upstream_id: z.number().nullable(),           // upstream_products.id
  cate_id: z.number().nullable(),               // upstream_products.cate_id
  title: z.string(),                            // 产品名称
  description: z.string().nullable(),
  icon: z.string().nullable(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  sales_price: z.number().nullable(),           // 销售价格（起步价）
  num: z.number().default(0),                   // 实时库存
  expiry_pricing: ExpiryPricingSchema.nullable(), // 有效期定价配置
})

/**
 * 创建产品请求 Schema
 */
export const CreateProductSchema = z.object({
  upstream_product_id: z.number(),              // 必须关联上游产品
  title: z.string().min(1, '产品名称不能为空'),
  description: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  sales_price: z.number().min(0).optional(),    // 销售价格
})

/**
 * 更新产品请求 Schema
 */
export const UpdateProductSchema = z.object({
  title: z.string().min(1, '产品名称不能为空').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  sales_price: z.number().min(0).optional(),    // 销售价格
  upstream_product_id: z.number().optional(),
})

// 导出类型
export type ExpiryOption = z.infer<typeof ExpiryOptionSchema>
export type ExpiryPricing = z.infer<typeof ExpiryPricingSchema>
export type UpstreamProduct = z.infer<typeof UpstreamProductSchema>
export type Product = z.infer<typeof ProductSchema>
export type ProductListItem = z.infer<typeof ProductListItemSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
