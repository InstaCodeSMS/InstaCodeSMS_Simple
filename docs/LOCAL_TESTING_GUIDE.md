# 本地测试 Telegram Bot 和 Mini App 指南

## 🎯 目标

在本地环境测试 Telegram Bot 和 Mini App 功能，确保符合需求后再部署。

## 🔧 测试方案

### 方案1：Polling 模式（推荐 - 最简单）

**适用场景**: 仅测试 Telegram Bot 命令响应

**优点**:
- 不需要公网 URL
- 不需要配置 Webhook
- 可以直接在本地运行

**步骤**:

```bash
# 1. 确保已安装依赖
npm install

# 2. 运行 Polling 模式的 Bot
npx tsx src/adapters/telegram/polling.ts
```

这会启动一个独立的 Bot 进程，主动轮询 Telegram 服务器获取更新。

### 方案2：Webhook + Tunnel（完整测试）

**适用场景**: 测试完整的 Webhook 流程和 Mini App

**优点**:
- 完全模拟生产环境
- 可以测试 Mini App
- 可以测试支付回调

**步骤**:

#### 2.1 安装 Cloudflare Tunnel（推荐）

```bash
# 下载 cloudflared
# Windows: https://github.com/cloudflare/cloudflared/releases

# 或使用 npm
npm install -g cloudflared
```

#### 2.2 启动本地服务器

```bash
# 终端1: 启动本地开发服务器
npm run dev
```

#### 2.3 创建 Tunnel

```bash
# 终端2: 创建 tunnel 暴露本地 3000 端口
cloudflared tunnel --url http://localhost:3000
```

会输出类似：
```
https://xxx.trycloudflare.com
```

#### 2.4 更新 Webhook

```bash
# 使用 tunnel URL 设置 webhook
curl -X POST https://xxx.trycloudflare.com/api/telegram/webhook/set \
  -H "x-admin-token: 6VHPaE7q26HvHn88COqt8bKAfoz3feDn"
```

### 方案3：混合模式（推荐用于开发）

**Bot 使用 Polling，Mini App 使用本地服务器**

```bash
# 终端1: 运行 Bot (Polling)
npx tsx src/adapters/telegram/polling.ts

# 终端2: 运行 Web 服务器 (Mini App)
npm run dev
```

## 📋 测试清单

### Telegram Bot 测试

1. **基础命令测试**
   ```
   /start - 查看欢迎消息
   /help - 查看帮助信息
   /products - 查看产品列表
   /orders - 查看订单列表
   /receive - 开始接码流程
   ```

2. **交互测试**
   - 按钮回调测试
   - 订单号输入测试
   - 错误处理测试

### Mini App 测试

1. **页面访问**
   ```
   http://localhost:3000/mini-app
   ```

2. **功能测试**
   - 产品浏览
   - 购物车操作
   - 结算流程
   - 订单查询

## 🚀 快速开始

### 最快测试方法（Polling 模式）

```bash
# 1. 启动 Bot
npx tsx src/adapters/telegram/polling.ts

# 2. 在 Telegram 中测试
# 搜索你的 Bot，发送 /start
```

### 完整测试方法

```bash
# 终端1: 启动本地服务器
npm run dev

# 终端2: 启动 Bot (Polling)
npx tsx src/adapters/telegram/polling.ts

# 终端3: 访问 Mini App
# 浏览器打开 http://localhost:3000/mini-app
```

## 🔍 调试技巧

### 查看 Bot 日志

Polling 模式会在终端显示所有 Bot 活动：
```
[Telegram] Starting bot in polling mode...
[Telegram] Bot started successfully
[Telegram] Received message: /start from user 123456789
```

### 查看 Web 服务器日志

`npm run dev` 会显示所有 HTTP 请求：
```
[wrangler:info] GET /mini-app 200 OK (15ms)
[wrangler:info] POST /api/telegram/webhook 200 OK (10ms)
```

### 测试 Webhook 端点

```bash
# 测试 webhook 是否正常
curl -X POST http://localhost:3000/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"text": "/start", "from": {"id": 123}}}'
```

## ⚠️ 注意事项

1. **Polling 和 Webhook 不能同时使用**
   - 如果设置了 Webhook，Polling 不会收到更新
   - 需要先删除 Webhook: `curl -X POST https://api.telegram.org/botYOUR_TOKEN/deleteWebhook`

2. **本地 Mini App 测试**
   - Mini App 可以直接在浏览器中访问测试
   - 不需要 Telegram 环境

3. **生产部署前**
   - 确保所有功能本地测试通过
   - 更新 Webhook URL 为生产地址
   - 运行 `npm run deploy`

## 📝 推荐测试流程

### 第1步：Bot 功能测试

```bash
# 启动 Polling 模式
npx tsx src/adapters/telegram/polling.ts

# 在 Telegram 中测试所有命令
/start, /help, /products, /orders, /receive
```

### 第2步：Mini App 测试

```bash
# 启动本地服务器
npm run dev

# 浏览器访问
http://localhost:3000/mini-app

# 测试所有功能
- 浏览产品
- 添加购物车
- 模拟结算
```

### 第3步：集成测试

如果需要测试完整流程（Bot + Mini App + 支付）：

```bash
# 使用 cloudflared tunnel
cloudflared tunnel --url http://localhost:3000

# 更新 webhook 为 tunnel URL
# 测试完整支付流程
```

### 第4步：生产部署

```bash
# 确认测试通过后
npm run deploy

# 设置生产 Webhook
curl -X POST https://instacode.cfd/api/telegram/webhook/set \
  -H "x-admin-token: 6VHPaE7q26HvHn88COqt8bKAfoz3feDn"
```

## 🛠️ 常见问题

### Q: Bot 无响应？

检查：
1. Bot Token 是否正确
2. 是否设置了 Webhook（会影响 Polling）
3. 查看终端日志

### Q: Mini App 页面空白？

检查：
1. 服务器是否启动 (`npm run dev`)
2. 访问 `http://localhost:3000/mini-app`
3. 查看浏览器控制台错误

### Q: 支付无法测试？

本地测试支付需要：
1. 使用 tunnel 暴露服务
2. 更新支付回调 URL
3. 或使用支付平台的测试模式

## 🎉 开始测试

现在就可以开始测试了！

**最简单的方法**:
```bash
npx tsx src/adapters/telegram/polling.ts
```

然后在 Telegram 中发送 `/start` 给你的 Bot！