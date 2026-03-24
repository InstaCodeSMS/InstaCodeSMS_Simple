-- ============================================
-- SimpleFaka 数据库清理脚本
-- 生成时间: 2026-03-22
-- 目的: 删除冗余字段，优化数据库结构
-- ============================================

-- 注意：执行前请先备份数据库！

BEGIN;

-- ============================================
-- 1. 清理 accounts 表的 OAuth 冗余字段
-- ============================================
-- 这些字段仅用于 OAuth 登录，当前系统只使用邮箱密码登录

ALTER TABLE accounts 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS id_token,
  DROP COLUMN IF EXISTS access_token_expires_at,
  DROP COLUMN IF EXISTS refresh_token_expires_at,
  DROP COLUMN IF EXISTS scope;

COMMENT ON TABLE accounts IS '用户账户表 - 仅支持 credential 认证';

-- ============================================
-- 2. 清理 products 表的冗余字段
-- ============================================
-- 价格从上游 API 实时获取，不需要本地存储

ALTER TABLE products 
  DROP COLUMN IF EXISTS sales_price,
  DROP COLUMN IF EXISTS expiry_pricing,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS icon;

COMMENT ON TABLE products IS '产品表 - 价格从上游 API 获取';

-- ============================================
-- 3. 清理 users 表的 image 字段（可选）
-- ============================================
-- 如果不需要用户头像功能，取消下面的注释

-- ALTER TABLE users DROP COLUMN IF EXISTS image;

COMMIT;

-- ============================================
-- 验证清理结果
-- ============================================

-- 查看 accounts 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- 查看 products 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
