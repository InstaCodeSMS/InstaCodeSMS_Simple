-- Better Auth 表结构迁移
-- 适配 Better Auth 期望的表结构

-- 1. 修改 users 表以适配 Better Auth
-- 添加 Better Auth 需要的字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 将现有 password_hash 迁移到 password
UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL;

-- 重命名 user_sessions 为 sessions（Better Auth 期望的表名）
DROP TABLE IF EXISTS user_sessions;

-- 2. 创建 Better Auth 期望的 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 Better Auth 期望的 accounts 表（用于 OAuth）
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 Better Auth 期望的 verifications 表（用于邮箱验证）
CREATE TABLE IF NOT EXISTS verifications (
  id VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON accounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);

-- 添加约束
ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS idx_accounts_provider_account UNIQUE (provider_id, account_id);