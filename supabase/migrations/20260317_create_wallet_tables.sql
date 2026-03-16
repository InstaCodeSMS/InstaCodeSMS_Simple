-- ========================================
-- 钱包系统数据库迁移
-- Why: 实现余额系统，支持用户充值和消费
-- 架构: 双表制 - wallets(状态表) + wallet_transactions(流水表)
-- 金额单位: 毫 (1元 = 1000毫)
-- ========================================

-- ========================================
-- 1. 钱包表 (wallets) - 状态表
-- Why: 存储用户当前余额，作为余额的唯一真实来源
-- ========================================
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,           -- 当前可用余额（毫单位：1.00元 = 1000）
  frozen_balance BIGINT NOT NULL DEFAULT 0,    -- 冻结金额（毫单位）
  version INTEGER NOT NULL DEFAULT 1,          -- 乐观锁版本号，防止并发双花
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：加速用户ID查询
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 触发器：自动为新用户创建钱包
-- Why: 确保用户注册后立即有对应的钱包，无需手动创建
CREATE OR REPLACE FUNCTION handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_wallet
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_wallet();

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallets_updated_at();

-- ========================================
-- 2. 钱包交易流水表 (wallet_transactions) - 流水表
-- Why: 记录每一分钱的去向，只允许插入，不允许修改或删除
-- ========================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 金额变动（毫单位）
  amount BIGINT NOT NULL,                      -- 正数=收入，负数=支出
  
  -- 交易类型
  type VARCHAR(20) NOT NULL CHECK (type IN (
    'recharge',   -- 充值
    'consume',    -- 消费
    'refund',     -- 退款
    'freeze',     -- 冻结
    'unfreeze'    -- 解冻
  )),
  
  -- 余额快照（关键！用于对账和错误排查）
  balance_before BIGINT NOT NULL,              -- 变动前余额
  balance_after BIGINT NOT NULL,               -- 变动后余额
  
  -- 关联信息
  related_id VARCHAR(255),                     -- 关联订单号/交易号
  related_type VARCHAR(50),                    -- 关联类型：order, recharge, refund
  
  -- 元数据
  description TEXT,                            -- 描述
  metadata JSONB DEFAULT '{}',                 -- 扩展信息（支付方式、交易号等）
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：加速查询
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_related_id ON wallet_transactions(related_id);

-- ========================================
-- 3. 核心 RPC 函数：处理交易（原子性）
-- Why: 在单个事务中完成余额更新和流水写入，保证数据一致性
-- ========================================
CREATE OR REPLACE FUNCTION process_wallet_transaction(
  p_user_id UUID,
  p_amount BIGINT,                              -- 毫单位，正数充值/负数消费
  p_type VARCHAR(20),
  p_related_id VARCHAR(255) DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance_before BIGINT;
  v_balance_after BIGINT;
  v_frozen BIGINT;
  v_version INTEGER;
  v_transaction_id UUID;
BEGIN
  -- 1. 锁定钱包行并获取当前状态（防止并发）
  SELECT balance, frozen_balance, version 
  INTO v_balance_before, v_frozen, v_version
  FROM wallets 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- 如果钱包不存在，返回错误
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_not_found');
  END IF;
  
  -- 2. 检查余额是否充足（仅消费/冻结时检查）
  IF p_amount < 0 AND (v_balance_before + p_amount) < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;
  
  -- 3. 计算新余额
  v_balance_after := v_balance_before + p_amount;
  
  -- 4. 更新钱包余额（带乐观锁版本检查）
  UPDATE wallets 
  SET balance = v_balance_after,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND version = v_version;
  
  -- 如果版本不匹配，说明有并发修改
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_modification');
  END IF;
  
  -- 5. 插入交易流水
  INSERT INTO wallet_transactions (
    user_id, amount, type,
    balance_before, balance_after,
    related_id, related_type,
    description, metadata
  ) VALUES (
    p_user_id, p_amount, p_type,
    v_balance_before, v_balance_after,
    p_related_id, p_related_type,
    p_description, p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- 6. 返回成功结果
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'amount', p_amount
  );
END;
$$;

-- ========================================
-- 4. 辅助函数：获取用户钱包信息
-- ========================================
CREATE OR REPLACE FUNCTION get_wallet_info(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT balance, frozen_balance, version, created_at, updated_at
  INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_not_found');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'balance', v_wallet.balance,
    'frozen_balance', v_wallet.frozen_balance,
    'version', v_wallet.version,
    'created_at', v_wallet.created_at,
    'updated_at', v_wallet.updated_at
  );
END;
$$;

-- ========================================
-- 5. RLS 策略
-- Why: 安全控制，用户只能查看自己的钱包和交易记录
-- ========================================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的钱包
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (user_id = auth.uid());

-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

-- 禁止前端直接写入钱包表（只能通过 RPC）
CREATE POLICY "No direct insert on wallets" ON wallets
  FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update on wallets" ON wallets
  FOR UPDATE USING (false);

-- 禁止前端直接写入交易流水表
CREATE POLICY "No direct insert on wallet_transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update on wallet_transactions" ON wallet_transactions
  FOR UPDATE USING (false);
CREATE POLICY "No direct delete on wallet_transactions" ON wallet_transactions
  FOR DELETE USING (false);

-- ========================================
-- 6. 为现有用户创建钱包记录（迁移用）
-- ========================================
INSERT INTO wallets (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT DO NOTHING;