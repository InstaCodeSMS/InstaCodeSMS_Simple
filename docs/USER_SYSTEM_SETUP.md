# 用户系统设置指南

## 数据库迁移

在使用用户系统之前，需要先运行数据库迁移来创建必要的表。

### 步骤

1. 确保已经配置好 Supabase 连接
2. 运行迁移文件：`supabase/migrations/20260311_create_user_tables.sql`

可以通过以下方式之一运行迁移：

**方式 1：使用 Supabase CLI**
```bash
supabase db push
```

**方式 2：在 Supabase Dashboard 中手动执行**
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/migrations/20260311_create_user_tables.sql` 的内容
4. 执行 SQL

## 功能说明

### 用户注册
- 访问 `/register` 页面
- 输入邮箱和密码（至少6位）
- 注册成功后自动登录并跳转到用户中心

### 用户登录
- 访问 `/login` 页面
- 输入邮箱和密码
- 登录成功后跳转到用户中心

### 用户中心
- 访问 `/dashboard` 页面（需要登录）
- 查看账户信息
- 查看订单历史
- 退出登录

## API 端点

### 认证 API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 用户 API
- `GET /api/user/profile` - 获取用户信息（需要登录）
- `GET /api/user/orders` - 获取用户订单（需要登录）

## 技术实现

- **认证方式**：基于 Session 的认证（使用 HttpOnly Cookie）
- **密码加密**：bcrypt
- **会话有效期**：7天
- **前端交互**：HTMX 实现局部刷新

## 安全特性

- HttpOnly Cookie 防止 XSS 攻击
- 密码使用 bcrypt 加密存储
- 会话自动过期机制
- 支持多租户架构（预留）