-- 修复业务表的 user_id 列类型并重新创建外键

-- 1. 修改业务表的 user_id 列类型为 TEXT
ALTER TABLE payment_orders ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE profiles ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallets ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallet_transactions ALTER COLUMN user_id TYPE text USING user_id::text;

-- 2. 重新创建外键约束
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
