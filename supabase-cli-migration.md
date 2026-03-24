# Supabase CLI 数据库迁移指南

由于 Supabase 的 REST API 不支持直接执行 SQL，我们需要使用其他方法来执行数据库迁移。

## 方法 1: 使用 Supabase CLI (推荐)

### 安装 Supabase CLI

```bash
# 使用 npm 安装
npm install -g @supabase/supabase-cli

# 或者使用 Homebrew (macOS)
brew install supabase/tap/supabase

# 或者使用 curl
curl -fsSL https://supabase.com/cli/install.sh | sh
```

### 配置项目

```bash
# 登录 Supabase
supabase login

# 连接到项目
supabase link --project-ref nyiozcmzdehybowlnyvh
```

### 执行迁移

```bash
# 执行迁移脚本
supabase sql -f scripts/migrate-products.sql
```

## 方法 2: 使用 psql 客户端

### 安装 psql

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# 下载并安装 PostgreSQL，然后使用 psql 命令
```

### 连接并执行

```bash
# 获取连接字符串
# 在 Supabase 仪表板中找到连接信息

# 连接并执行 SQL
psql "postgresql://postgres:[YOUR-PASSWORD]@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres" -f scripts/migrate-products.sql
```

## 方法 3: 使用 Supabase 仪表板

1. 登录 Supabase 仪表板
2. 进入 SQL Editor
3. 粘贴迁移脚本内容
4. 执行查询

## 方法 4: 创建临时函数 (已尝试但失败)

我们尝试创建了一个临时函数来执行 SQL，但 Supabase 的 REST API 不支持调用自定义函数。

## 迁移脚本内容

迁移脚本 `scripts/migrate-products.sql` 包含以下内容：

1. 创建产品分类表
2. 添加新字段到产品表
3. 数据迁移
4. 添加约束和索引
5. 创建触发器函数
6. 创建视图和数据库函数
7. 添加注释

## 下一步

由于无法通过 REST API 执行迁移，建议：

1. 使用 Supabase CLI 执行迁移
2. 或者使用 psql 客户端直接连接数据库
3. 或者在 Supabase 仪表板的 SQL Editor 中执行

执行迁移后，需要更新应用程序代码以使用新的字段和功能。