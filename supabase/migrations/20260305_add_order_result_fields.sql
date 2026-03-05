-- 添加订单结果字段：手机号码、验证码、上游订单号
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS tel text,
ADD COLUMN IF NOT EXISTS sms_token text,
ADD COLUMN IF NOT EXISTS upstream_order_id text;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_payment_orders_upstream_order_id ON payment_orders(upstream_order_id);

-- 添加注释
COMMENT ON COLUMN payment_orders.tel IS '购买后获得的手机号码';
COMMENT ON COLUMN payment_orders.sms_token IS '购买后获得的验证码/令牌';
COMMENT ON COLUMN payment_orders.upstream_order_id IS '上游API返回的订单号';
