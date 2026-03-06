-- 添加 upstream_result JSONB 字段存储上游API完整响应
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS upstream_result jsonb;

-- 添加注释
COMMENT ON COLUMN payment_orders.upstream_result IS '上游API完整响应数据（包含 tel, token, api, end_time 等）';