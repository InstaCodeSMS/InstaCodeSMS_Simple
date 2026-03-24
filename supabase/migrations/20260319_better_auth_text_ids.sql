-- Better Auth 表 ID 类型迁移：UUID → TEXT
-- 这样可以兼容 Better Auth 的默认字符串 ID 生成器

-- 1. 删除所有外键约束
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 2. 修改 users 表的 id 列类型
ALTER TABLE users ALTER COLUMN id TYPE text USING id::text;

-- 3. 修改所有引用 users.id 的列类型
ALTER TABLE sessions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE accounts ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallets ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE wallet_transactions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE payment_orders ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE profiles ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. 修改其他 Better Auth 表的 id 列
ALTER TABLE sessions ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE accounts ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE verifications ALTER COLUMN id TYPE text USING id::text;

-- 5. 重新创建所有外键约束
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
