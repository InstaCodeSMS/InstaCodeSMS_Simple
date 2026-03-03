-- ============================================================
-- 支付网关重构迁移
-- 创建时间: 2026-03-02
-- 说明: 实现支付方式与支付网关分离架构
-- ============================================================

-- ============================================================
-- 1. 支付网关配置表
-- 存储支付方式到网关的路由配置
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 支付方式 (用户视角)
  payment_method  TEXT NOT NULL,  -- 'alipay', 'wechat', 'usdt', 'paypal', 'stripe'
  
  -- 网关标识
  gateway         TEXT NOT NULL,  -- 'alimpay', 'epay', 'bepusdt', 'tokenpay', 'paypal', 'stripe', 'wechatpay'
  
  -- 网关内部通道 (可选，聚合网关使用)
  channel         TEXT,           -- 'alipay', 'wechat', 'usdt', 'native', 'trc20'
  
  -- 路由配置
  priority        INTEGER DEFAULT 100,     -- 优先级，数字越小越优先
  weight          INTEGER DEFAULT 100,     -- 权重 (保留，未来负载均衡用)
  
  -- 状态控制
  enabled         BOOLEAN DEFAULT true,    -- 是否启用
  maintenance     BOOLEAN DEFAULT false,   -- 维护模式
  
  -- 限额配置 (可选)
  min_amount      DECIMAL(10,2),           -- 最小金额
  max_amount      DECIMAL(10,2),           -- 最大金额
  
  -- 费率配置 (可选)
  fee_rate        DECIMAL(5,4),            -- 手续费率 0.0200 = 2%
  fee_fixed       DECIMAL(10,2),           -- 固定手续费
  
  -- 元数据
  display_name    TEXT,                    -- 前端显示名称
  description     TEXT,                    -- 描述
  icon            TEXT,                    -- 图标 (emoji 或 URL)
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：同一支付方式+网关+通道组合只能有一条记录
  CONSTRAINT uk_payment_route UNIQUE (payment_method, gateway, channel),
  
  -- 检查约束
  CONSTRAINT chk_priority CHECK (priority > 0),
  CONSTRAINT chk_weight CHECK (weight > 0)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_gateway_configs_method ON payment_gateway_configs(payment_method);
CREATE INDEX IF NOT EXISTS idx_gateway_configs_enabled ON payment_gateway_configs(enabled, maintenance);
CREATE INDEX IF NOT EXISTS idx_gateway_configs_priority ON payment_gateway_configs(payment_method, priority);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_gateway_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_gateway_configs_updated_at
  BEFORE UPDATE ON payment_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_gateway_configs_updated_at();

-- ============================================================
-- 2. 支付路由日志表
-- 记录路由决策，用于分析和故障排查
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_route_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  trade_id        TEXT NOT NULL,
  payment_method  TEXT NOT NULL,
  
  -- 路由决策
  selected_gateway TEXT NOT NULL,
  selected_channel TEXT,
  selection_reason TEXT,  -- 'primary', 'fallback', 'error'
  
  -- 执行结果
  success         BOOLEAN,
  error_message   TEXT,
  latency_ms      INTEGER,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_route_logs_trade ON payment_route_logs(trade_id);
CREATE INDEX IF NOT EXISTS idx_route_logs_gateway ON payment_route_logs(selected_gateway, created_at);
CREATE INDEX IF NOT EXISTS idx_route_logs_time ON payment_route_logs(created_at DESC);

-- ============================================================
-- 3. 修改支付订单表
-- 增加网关信息字段
-- ============================================================

-- 检查并添加 gateway 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_orders' AND column_name = 'gateway'
  ) THEN
    ALTER TABLE payment_orders ADD COLUMN gateway TEXT;
    COMMENT ON COLUMN payment_orders.gateway IS '实际使用的支付网关';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_orders' AND column_name = 'gateway_channel'
  ) THEN
    ALTER TABLE payment_orders ADD COLUMN gateway_channel TEXT;
    COMMENT ON COLUMN payment_orders.gateway_channel IS '网关内部通道';
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway ON payment_orders(gateway);

-- ============================================================
-- 4. 初始化默认配置数据
-- ============================================================

INSERT INTO payment_gateway_configs 
  (payment_method, gateway, channel, priority, enabled, display_name, icon, description) VALUES
  -- 支付宝：主用 alimpay，备用 epay
  ('alipay', 'alimpay', 'native', 1, true, '支付宝', '💳', 'AliMPay 支付宝通道'),
  ('alipay', 'epay', 'alipay', 2, true, '支付宝 (备用)', '💳', 'EPay 支付宝通道'),
  
  -- 微信支付：仅 epay 支持
  ('wechat', 'epay', 'wechat', 1, true, '微信支付', '💚', 'EPay 微信通道'),
  
  -- USDT：主用 bepusdt，备用 tokenpay、epay
  ('usdt', 'bepusdt', 'trc20', 1, true, 'USDT (TRC20)', '₮', 'Bepusdt TRC20 通道'),
  ('usdt', 'tokenpay', 'usdt', 2, true, 'USDT (备用)', '₮', 'TokenPay USDT 通道'),
  ('usdt', 'epay', 'usdt', 3, true, 'USDT (备用2)', '₮', 'EPay USDT 通道'),
  
  -- PayPal：仅官方 API
  ('paypal', 'paypal', 'native', 1, true, 'PayPal', '🅿️', 'PayPal 官方 API'),
  
  -- Stripe：仅官方 API
  ('stripe', 'stripe', 'native', 1, true, 'Stripe', '💳', 'Stripe 官方 API'),
  
  -- 微信支付(官方)：仅 wechatpay 网关
  ('wechatpay', 'wechatpay', 'native', 1, true, '微信支付(官方)', '💚', '微信支付官方 API')
ON CONFLICT (payment_method, gateway, channel) DO NOTHING;

-- ============================================================
-- 5. 创建视图：可用支付方式
-- ============================================================
CREATE OR REPLACE VIEW v_available_payment_methods AS
SELECT DISTINCT ON (payment_method)
  payment_method,
  display_name,
  icon,
  COUNT(*) OVER (PARTITION BY payment_method) as gateway_count
FROM payment_gateway_configs
WHERE enabled = true AND maintenance = false
ORDER BY payment_method, priority;

-- ============================================================
-- 6. Row Level Security (RLS)
-- ============================================================

-- 支付网关配置表：仅管理员可修改
ALTER TABLE payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取启用的配置 (前端展示用)
CREATE POLICY "payment_gateway_configs_select" ON payment_gateway_configs
  FOR SELECT
  USING (enabled = true);

-- 支付路由日志：仅服务端写入
ALTER TABLE payment_route_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_route_logs_insert" ON payment_route_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "payment_route_logs_select" ON payment_route_logs
  FOR SELECT
  USING (false);  -- 仅通过 service_role 可查询

-- ============================================================
-- 完成提示
-- ============================================================
COMMENT ON TABLE payment_gateway_configs IS '支付网关配置表 - 存储支付方式与网关的路由映射';
COMMENT ON TABLE payment_route_logs IS '支付路由日志表 - 记录路由决策历史';