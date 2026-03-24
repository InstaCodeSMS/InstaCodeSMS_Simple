-- Telegram Bot + Mini App 数据表
-- 创建时间：2026-03-14

-- 1. Telegram 用户表
CREATE TABLE IF NOT EXISTS telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'zh',
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_last_active ON telegram_users(last_active);

-- 注释
COMMENT ON TABLE telegram_users IS 'Telegram 用户信息表';
COMMENT ON COLUMN telegram_users.telegram_id IS 'Telegram 用户 ID';
COMMENT ON COLUMN telegram_users.metadata IS '额外的用户元数据';

-- 2. 接码会话表
CREATE TABLE IF NOT EXISTS receive_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  ordernum VARCHAR(255) NOT NULL,
  message_id BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'polling',
  poll_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB,FOREIGN KEY (user_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_receive_sessions_user_id ON receive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_receive_sessions_ordernum ON receive_sessions(ordernum);
CREATE INDEX IF NOT EXISTS idx_receive_sessions_status ON receive_sessions(status);
CREATE INDEX IF NOT EXISTS idx_receive_sessions_started_at ON receive_sessions(started_at);

-- 注释
COMMENT ON TABLE receive_sessions IS '接码会话表';
COMMENT ON COLUMN receive_sessions.status IS '会话状态：polling, success, timeout, stopped';
COMMENT ON COLUMN receive_sessions.result IS '接码结果（JSON格式）';

-- 3. 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- 注释
COMMENT ON TABLE cart_items IS '购物车表';
COMMENT ON COLUMN cart_items.quantity IS '商品数量';

-- 4. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 自动更新 last_active 触发器
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE telegram_users 
  SET last_active = NOW() 
  WHERE telegram_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_last_active_on_session
  AFTER INSERT ON receive_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_user_last_active_on_cart
  AFTER INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- 6. 清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM receive_sessions
  WHERE status = 'polling'
    AND started_at < NOW() - INTERVAL '10 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS '清理超过10分钟的轮询会话';

-- 7. 获取用户统计信息的函数
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id BIGINT)
RETURNS TABLE (
  total_sessions INTEGER,
  success_sessions INTEGER,
  cart_items_count INTEGER,
  last_session_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_sessions,
    COUNT(*) FILTER (WHERE status = 'success')::INTEGER AS success_sessions,
    (SELECT COUNT(*)::INTEGER FROM cart_items WHERE user_id = p_user_id) AS cart_items_count,
    MAX(started_at) AS last_session_at
  FROM receive_sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_stats IS '获取用户统计信息';