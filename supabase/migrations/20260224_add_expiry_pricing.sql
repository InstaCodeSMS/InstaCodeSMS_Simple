-- 添加 expiry_pricing 字段到 products 表
-- 用于存储每个产品的有效期定价配置

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS expiry_pricing JSONB DEFAULT NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN products.expiry_pricing IS '有效期定价配置，格式: { "options": [{ "expiry": 1, "label": "5-30天", "price": 10.00 }] }';

-- 示例：为现有产品添加默认有效期定价（可选，根据实际需求调整）
-- UPDATE products 
-- SET expiry_pricing = '{"options":[{"expiry":1,"label":"5 天","price":10.00},{"expiry":2,"label":"10 天","price":12.00},{"expiry":3,"label":"15 天","price":15.00},{"expiry":4,"label":"30 天","price":20.00},{"expiry":5,"label":"60 天","price":25.00},{"expiry":6,"label":"80天以上","price":30.00}]}'
-- WHERE expiry_pricing IS NULL;
