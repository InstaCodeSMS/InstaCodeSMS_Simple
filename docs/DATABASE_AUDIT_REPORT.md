# 📊 SimpleFaka 数据库审计报告

**审计时间**: 2026-03-22  
**数据库类型**: Supabase (PostgreSQL)  
**审计范围**: 所有业务表

---

## 📋 表概览

| 表名 | 记录数 | 状态 | 问题 |
|------|--------|------|------|
| users | 17 | ✅ 正常 | 1个空字段 |
| sessions | 32 | ✅ 正常 | 1个空字段 |
| accounts | 17 | ⚠️ 冗余 | 6个空字段 |
| verifications | 0 | ✅ 正常 | 空表 |
| products | 16 | ⚠️ 冗余 | 4个空字段 |
| orders | 0 | ❌ 异常 | 无法访问 |
| wallets | 0 | ✅ 正常 | 空表 |
| wallet_transactions | 0 | ✅ 正常 | 空表 |

---

## 🔍 详细分析

### 1. users 表 ✅

**记录数**: 17  
**状态**: 基本健康

#### 字段列表
- ✅ `id` (string) - 主键，有数据
- ✅ `name` (string) - 用户名，有数据
- ✅ `email` (string) - 邮箱，有数据
- ✅ `email_verified` (boolean) - 邮箱验证状态
- ⚠️ `image` (null) - **完全空，建议删除或设为可选**
- ✅ `created_at` (timestamp) - 创建时间
- ✅ `updated_at` (timestamp) - 更新时间

#### 优化建议
```sql
-- 可选：如果确定不使用头像功能，可以删除
ALTER TABLE users DROP COLUMN IF EXISTS image;
```

---

### 2. sessions 表 ✅

**记录数**: 32  
**状态**: 基本健康

#### 字段列表
- ✅ `id` (string) - 会话ID
- ✅ `expires_at` (timestamp) - 过期时间
- ✅ `token` (string) - 会话令牌
- ✅ `created_at` (timestamp) - 创建时间
- ✅ `updated_at` (timestamp) - 更新时间
- ⚠️ `ip_address` (string) - **完全空，但可能未来需要**
- ✅ `user_agent` (string) - 用户代理
- ✅ `user_id` (string) - 用户ID（外键）

#### 优化建议
```sql
-- ip_address 字段保留，但确保应用层记录IP
-- 无需删除，可能用于安全审计
```

---

### 3. accounts 表 ⚠️ **需要清理**

**记录数**: 17  
**状态**: 严重冗余

#### 字段列表
- ✅ `id` (string) - 账户ID
- ✅ `account_id` (string) - 账户标识
- ✅ `provider_id` (string) - 提供商（credential）
- ✅ `user_id` (string) - 用户ID
- ⚠️ `access_token` (null) - **完全空，OAuth专用**
- ⚠️ `refresh_token` (null) - **完全空，OAuth专用**
- ⚠️ `id_token` (null) - **完全空，OAuth专用**
- ⚠️ `access_token_expires_at` (null) - **完全空**
- ⚠️ `refresh_token_expires_at` (null) - **完全空**
- ⚠️ `scope` (null) - **完全空，OAuth专用**
- ✅ `password` (string) - 密码哈希（Better Auth格式）
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)

#### 🔴 关键问题
你只使用了 **credential 认证**（邮箱密码），但保留了大量 OAuth 相关字段。

#### 优化建议
```sql
-- 方案A：如果未来不打算支持OAuth登录，删除这些字段
ALTER TABLE accounts 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS id_token,
  DROP COLUMN IF EXISTS access_token_expires_at,
  DROP COLUMN IF EXISTS refresh_token_expires_at,
  DROP COLUMN IF EXISTS scope;

-- 方案B：如果未来可能支持OAuth，保留但添加注释
COMMENT ON COLUMN accounts.access_token IS '预留：OAuth access token';
```

---

### 4. verifications 表 ✅

**记录数**: 0  
**状态**: 正常（邮箱验证表，测试环境未使用）

---

### 5. products 表 ⚠️ **需要清理**

**记录数**: 16  
**状态**: 有冗余字段

#### 字段列表
- ✅ `id` (uuid) - 产品ID
- ✅ `upstream_product_id` (number) - 上游产品ID
- ✅ `title` (string) - 产品标题
- ⚠️ `description` (null) - **完全空**
- ⚠️ `icon` (null) - **完全空**
- ✅ `sort_order` (number) - 排序
- ✅ `is_active` (boolean) - 是否激活
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)
- ⚠️ `sales_price` (null) - **完全空，价格逻辑在哪？**
- ⚠️ `expiry_pricing` (null) - **完全空，时效定价？**

#### 🔴 关键问题
1. **价格字段为空** - `sales_price` 和 `expiry_pricing` 都是空的，价格数据存在哪里？
2. **描述和图标为空** - 产品没有描述和图标

#### 优化建议
```sql
-- 如果价格存储在其他地方（如上游API），删除这些字段
ALTER TABLE products 
  DROP COLUMN IF EXISTS sales_price,
  DROP COLUMN IF EXISTS expiry_pricing;

-- 如果需要这些字段，确保应用层填充数据
-- 或者改为从上游API实时获取
```

---

### 6. orders 表 ❌ **严重问题**

**状态**: 无法访问  
**错误**: `Could not find the table 'public.orders' in the schema cache`

#### 🔴 关键问题
表可能：
1. 不存在
2. 权限配置错误
3. Schema cache 未更新

#### 修复建议
```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'orders';

-- 如果不存在，需要创建
-- 如果存在，检查RLS策略和权限
```

---

### 7. wallets 表 ✅

**记录数**: 0  
**状态**: 正常（空表，钱包功能未启用）

---

### 8. wallet_transactions 表 ✅

**记录数**: 0  
**状态**: 正常（空表，钱包功能未启用）

---

## 🎯 总体优化建议

### 优先级 P0（立即处理）

1. **修复 orders 表访问问题** ❌
   - 检查表是否存在
   - 检查 RLS 策略
   - 更新 schema cache

### 优先级 P1（本周处理）

2. **清理 accounts 表的 OAuth 字段** ⚠️
   - 6个完全空的字段占用存储
   - 如果不需要 OAuth，删除

3. **确认 products 表的价格逻辑** ⚠️
   - `sales_price` 和 `expiry_pricing` 为空
   - 确认价格数据来源

### 优先级 P2（可选）

4. **清理 users 表的 image 字段**
   - 如果不需要头像功能，删除

5. **确保 sessions 表记录 IP**
   - `ip_address` 字段为空
   - 应用层需要填充

---

## 📊 存储优化估算

| 优化项 | 预计节省 | 影响 |
|--------|----------|------|
| 删除 accounts 的 6 个空字段 | ~30% | 低风险 |
| 删除 products 的 4 个空字段 | ~20% | 需确认业务逻辑 |
| 删除 users 的 image 字段 | ~5% | 低风险 |

---

## 🚀 下一步行动

1. **立即**: 修复 orders 表访问问题
2. **本周**: 生成清理 SQL 脚本
3. **测试**: 在测试环境执行清理
4. **验证**: 确保应用功能正常
5. **生产**: 应用到生产环境

---

**报告生成时间**: 2026-03-22 00:43  
**审计工具**: scripts/audit-database.cjs
