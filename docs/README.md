# SimpleFaka 项目文档

欢迎来到 SimpleFaka 项目！这是一个基于 Cloudflare Workers 的虚拟手机号码接码平台。

## 📚 文档导航

- **[开发环境搭建](./SETUP.md)** - 快速开始指南
- **[API 文档](./API.md)** - API 端点和使用示例
- **[部署指南](./DEPLOYMENT.md)** - 部署到 Cloudflare Workers

## 🏗️ 项目架构

```
SimpleFaka
├── src/
│   ├── core/          # 基础设施层
│   ├── constants/     # 常量定义
│   ├── types/         # 类型定义
│   ├── utils/         # 工具函数
│   ├── adapters/      # 防腐层
│   ├── domains/       # 业务领域
│   ├── routes/        # 路由层
│   ├── views/         # 视图层
│   └── middleware/    # 中间件
├── tests/             # 测试
├── docs/              # 文档
└── scripts/           # 脚本
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 部署
npm run deploy
```

## 📖 核心概念

### 分层架构

- **Core**: 基础设施（环境变量、错误处理、日志）
- **Constants**: 常量管理
- **Utils**: 工具函数
- **Adapters**: 防腐层（隔离外部依赖）
- **Domains**: 业务领域（核心业务逻辑）
- **Routes**: 路由分发
- **Views**: 视图渲染
- **Middleware**: 请求处理中间件

### 错误处理

所有错误必须继承 `AppError`，使用统一的错误码和消息。

### 验证

所有输入必须通过 Zod Schema 验证。

## 🔗 相关资源

- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Supabase 文档](https://supabase.com/docs)
- [Zod 文档](https://zod.dev/)

## 📝 贡献指南

1. 创建新分支
2. 遵循项目规范（见 `.clinerules`）
3. 提交 PR

## 📄 许可证

ISC
