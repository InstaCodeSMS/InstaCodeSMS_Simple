-- ============================================
-- Better Auth 表结构迁移 - 手动执行版本
-- 请在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 1. 添加 Better Auth 需要的字段到 users 表
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. 从 email 提取 name（如果 name 为空）
UPDATE users 
SET name = SPLIT_PART(email, '@', 1) 
WHERE name IS NULL;

-- 3. 创建 sessions 表（Better Auth 需要）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 先删除旧的 accounts 表（如果存在且类型不匹配）
DROP TABLE IF EXISTS accounts CASCADE;

-- 重新创建 accounts 表（用于存储密码等认证信息）
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  password TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, account_id)
);

-- 5. 创建 verifications 表（用于邮箱验证等）
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);

-- 7. 迁移现有用户的密码到 accounts 表
INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
SELECT 
  CAST(gen_random_uuid() AS text),
  id,
  email,
  'credential',
  password_hash,
  created_at,
  updated_at
FROM users
WHERE password_hash IS NOT NULL
ON CONFLICT (provider_id, account_id) DO NOTHING;

-- 8. 删除旧的 user_sessions 表（如果存在）
DROP TABLE IF EXISTS user_sessions CASCADE;

-- ============================================
-- 迁移完成！
-- ============================================
