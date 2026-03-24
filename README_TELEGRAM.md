# SimpleFaka Telegram Bot + Mini App

> 基于 Hono + HTMX + Alpine.js + GrammY 的 Telegram 接码服务

## 📖 项目简介

SimpleFaka 是一个完整的 Telegram Bot 和 Mini App 解决方案，为用户提供便捷的虚拟手机号码接码服务。

### 核心功能

- 🤖 **Telegram Bot** - 完整的命令系统和接码终端
- 🎨 **Mini App** - 现代化的商城界面
- 📱 **实时接码** - 自动轮询和推送验证码
- 🛒 **购物车** - 完整的购物流程
- 📦 **订单管理** - 查看订单和卡密信息

##🏗️ 技术栈

### 后端
- **Hono** - 轻量级 Web 框架
- **GrammY** - Telegram Bot 框架
- **TypeScript** - 类型安全
- **Cloudflare Workers** - 边缘计算
- **Supabase** - PostgreSQL 数据库

### 前端 (Mini App)
- **HTMX** - 动态HTML
- **Alpine.js** - 轻量级响应式框架
- **Tailwind CSS + DaisyUI** - UI框架
- **Telegram Web App SDK** - Telegram 集成

## 🚀 快速开始

### 1. 数据库迁移

```bash
# 在 Supabase 中执行
supabase/migrations/20260314_telegram_tables.sql
```

### 2. 环境变量

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
SHOP_URL=https://your-domain.com/purchase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 3. 部署

```bash
npm install
npm run deploy
```

### 4. 设置 Webhook

```bash
curl -X POST https://your-domain.com/api/telegram/webhook/set \
  -H "x-admin-token: YOUR_ADMIN_SECRET"
```

详细步骤请查看 [TELEGRAM_QUICK_START.md](./TELEGRAM_QUICK_START.md)

## 📁 项目结构

```
src/
├── domains/telegram/          # Telegram 业务逻辑
│   ├── user.schema.ts        # 用户数据模型
│   ├── user.repo.ts          # 数据访问层
│   ├── user.service.ts       # 业务逻辑层
│   ├── receive.service.enhanced.ts  # 接码服务
│   └── commands/             # Bot 命令处理器
├── adapters/telegram/        # Telegram 适配器
│   └── bot.enhanced.ts       # Bot 实例
├── views/mini-app/           # Mini App 前端
│   ├── index.html           # 主页面
│   ├── js/                  # JavaScript
│   └── pages/               # 页面组件
└── routes/web/              # Web 路由
    └── mini-app.ts          # Mini App 路由
```

## 🎯 Bot 命令

- `/start` - 启动 Bot，显示主菜单
- `/products` - 查看商品列表
- `/orders` - 查看我的订单
- `/receive` - 启动接码终端
- `/stop` - 停止接码
- `/help` - 帮助信息

## 💡 技术亮点

1. **零全局变量** - 所有会话存储在数据库中
2. **类型安全** - 完整的 Zod 验证和TypeScript 类型
3. **分层架构** - Schema-Repo-Service 清晰分层
4. **零构建** - HTMX + Alpine.js 无需编译
5. **边缘计算** - Cloudflare Workers 全球加速

## 📚 文档

- [快速开始](./TELEGRAM_QUICK_START.md) - 5步快速部署
- [实施总结](./TELEGRAM_FINAL_SUMMARY.md) - 完整实施报告
- [技术方案](./docs/TELEGRAM_COMPLETE_SOLUTION.md) - 详细技术方案
- [实施计划](./docs/TELEGRAM_IMPLEMENTATION_PLAN.md) - 分阶段计划

## 🔧 开发

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 类型检查
npm run type-check

# 测试
npm test
```

## 📊 进度

- ✅ 阶段 1：基础功能完善 (100%)
- ✅ 阶段 2：Mini App 集成 (70%)
- ⏳ 阶段 3：功能增强 (0%)
- ⏳ 阶段 4：优化测试 (0%)

**总体完成度：60%**

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**开发时间**：2026-03-14  
**技术栈**：Hono + HTMX + Alpine.js + GrammY