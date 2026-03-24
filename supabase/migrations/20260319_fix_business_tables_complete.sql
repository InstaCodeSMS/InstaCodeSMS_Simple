-- 完整修复业务表的 user_id 类型
-- 步骤：删除策略 → 修改类型 → 重建策略和外键

-- 1. 删除 wallets 表的 RLS 策略
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "No direct insert on wallets" ON wallets;
DROP POLICY IF EXISTS "No direct update on wallets" ON wallets;

-- 2. 删除 wallet_transactions 表的 RLS 策略
DROP POLICY IF EXISTS "Users can view own transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "No direct insert on wallet_transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "No direct update on wallet_transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "No direct delete on wallet_transactions" ON wallet_transactions;

-- 3. 修改所有业务表的 user_id 列类型为 TEXT
ALTER TABLE payment_orders ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE profiles ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallets ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallet_transactions ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. 重新创建外键约束
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. 重新创建 wallets 表的 RLS 策略
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "No direct insert on wallets" ON wallets
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct update on wallets" ON wallets
  FOR UPDATE USING (false);

-- 6. 重新创建 wallet_transactions 表的 RLS 策略
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "No direct insert on wallet_transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct update on wallet_transactions" ON wallet_transactions
  FOR UPDATE USING (false);

CREATE POLICY "No direct delete on wallet_transactions" ON wallet_transactions
  FOR DELETE USING (false);
