-- ============================================
-- SimpleFaka 数据库清理回滚脚本
-- 生成时间: 2026-03-22
-- 目的: 恢复被删除的字段
-- ============================================

BEGIN;

-- ============================================
-- 1. 恢复 accounts 表的 OAuth 字段
-- ============================================

ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS id_token TEXT,
  ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scope TEXT;

-- ============================================
-- 2. 恢复 products 表的字段
-- ============================================

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sales_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS expiry_pricing JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- ============================================
-- 3. 恢复 users 表的 image 字段
-- ============================================

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS image TEXT;

COMMIT;
