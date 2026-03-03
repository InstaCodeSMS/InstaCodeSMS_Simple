-- ============================================================
-- 修复 token 字段长度限制
-- payment_url 通常超过 100 字符，需要改为 TEXT
-- ============================================================

-- 修改 token 字段为 TEXT 类型
ALTER TABLE payment_orders 
ALTER COLUMN token TYPE TEXT;

-- 添加注释
COMMENT ON COLUMN payment_orders.token IS '支付链接或令牌（支付URL等）';