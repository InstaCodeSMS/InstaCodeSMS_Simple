# SimpleFaka

一个基于 Hono 框架的虚拟手机号码接码平台，支持 Cloudflare Pages 部署。

## 技术栈

| 模块 | 工具 | 作用 |
|------|------|------|
| 后端框架 | Hono | 处理路由、API 转发、加价逻辑 |
| 数据库 | Supabase | 存储用户余额、订单、处理 GitHub/Google 登录 |
| 页面交互 | HTMX | 异步请求后端，无刷新更新验证码状态 |
| 前端特效 | Alpine.js | 复制号码到剪贴板、倒计时、侧边栏开关 |
| 样式 UI | Tailwind + DaisyUI 4.x | 快速生成漂亮的充值界面和订单表格 |
| 部署环境 | Cloudflare Pages | 全球访问极速，几乎零成本托管 |

## 项目结构

```
SimpleJieMa/
├── .cursor/                 # 🧠 100分核心：AI 专属知识库与规则引擎
│   ├── rules/                       # 分领域的 AI 约束规范
│   │   ├── htmx-rules.md            # 规定如何返回局部 HTML 片段
│   │   ├── domain-logic.md          # 规定 Service 与 Repo 的交互规范
│   │   └── tailwind-daisyui.md      # UI 风格统一指南
│   └── docs/                        # 上游 API & 支付网关文档 (供 AI 检索)
├── .github/                         # 🤖 自动化工作流
│   └── workflows/
│       └── deploy.yml               # 集成测试通过后自动部署至 Cloudflare
├── scripts/                 # 🤖 自动化脚手架
│   └── generate-types.sh    # 一键拉取 Supabase 远程表结构生成 TS 类型
├── tests/                   # 🛡️ 自动化测试 (Vitest)
│   ├── unit/                # 针对 domains 核心逻辑的测试 (Vitest)
│   │   ├── domains/order.test.ts
│   │   └── services/price.test.ts
│   └── integration/         # 针对 Hono API 的路由测试 (Hono request simulation)
│   └── mocks/               # 外部服务模拟 (Mock Upstream/Payment)
├── src/
│   ├── core/                # ⚙️ 【基建层】(项目的底层引擎)
│   │   ├── env.ts           # Zod 校验 Cloudflare 环境变量
│   │   ├── di.ts            # 轻量级依赖注入 (给 AI 明确依赖关系)
│   │   ├── errors.ts        # 统一错误码与异常拦截
│   │   └── logger.ts        # 结构化日志
│   ├── types/               # 🏷️ 【全局类型约定】
│   │   ├── supabase.ts      # ⚠️ 机器生成的 DB 类型 (绝对禁止手动修改)
│   │   ├── api.ts           # 前后端共享的 RPC 类型
│   │   └── app.d.ts         # Hono 的 Context 扩展类型声明
│   ├── adapters/            # 🔌 【防腐层】(与所有外部第三方解耦)
│   │   ├── database/        # Supabase 实例初始化
│   │   ├── payment/         # 支付网关的具体实现 (Alipay, USDT)
│   │   └── upstream/        # 发卡/接码上游平台的具体对接
│   ├── domains/             # 🏢 【领域层】(高内聚业务，AI 的主要工作区)
│   │   ├── order/           # 订单全生命周期
│   │   │   ├── order.schema.ts      # 输入校验 (Zod)
│   │   │   ├── order.repo.ts        # 数据库操作 (Repository)
│   │   │   └── order.service.ts     # 核心下单/支付核销逻辑
│   │   ├── product/         # 商品与库存模块
│   │   └── sms/             # --- 接码逻辑领域 ---
│   ├── triggers/            # ⏱️ 【边缘调度层】(Cloudflare 特有)
│   │   ├── cron/            # 定时任务 (如：SyncPrices.ts)
│   │   └── queues/          # 异步队列消费 (如：SendEmailWorker.ts)
│   ├── routes/              # 🛣️ 【路由分发层】(极度薄，只接客不干活)
│   │   ├── api.ts           # 供第三方或 Webhook 调用的 JSON 接口
│   │   └── web.ts           # 响应 HTMX 请求的视图路由
│   ├── views/               # 🎨 【视图层】(DaisyUI + HTMX)
│   │   ├── layouts/         # BaseLayout.tsx (包含 head, tailwind 引入)
│   │   ├── pages/           # 完整页面 (Home.tsx, Checkout.tsx)
│   │   └── partials/        # 局部刷新块 (OrderList.tsx, Toast.tsx)
│   ├── middleware/          # 🛡️ 中间件 (Auth, RateLimit, ErrorHandler)
│   ├── app.ts               # Hono 实例装配 (注册路由与中间件)
│   └── index.ts             # Worker 入口 (export default { fetch, scheduled, queue })
├── public/                  # 🖼️ 静态资源 (Logo, Favicon)
├── supabase/
│   ├── migrations/          # SQL 变更记录
│   └── seed.sql             # 初始化测试数据
│   └── config.toml          # 数据库配置
├── wrangler.toml            # ☁️ Cloudflare 核心资源绑定 (KV, D1, Cron 声明)
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 Cloudflare Pages Dashboard 中设置以下环境变量：

```
UPSTREAM_API_URL=https://api.cc
UPSTREAM_API_TOKEN=your_upstream_token
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PRICE_MARKUP=1.5
```

### 3. 配置 Supabase

在 Supabase SQL Editor 中执行 `supabase/migrations/deduct_balance.sql` 文件。

### 4. 本地开发

```bash
npm run dev
```

### 5. 部署

```bash
npm run deploy
```

## API 文档

### 服务 API

#### 获取服务分类

```
GET /api/services/categories
```

**响应示例：**

```json
{
  "success": true,
  "message": "获取分类成功",
  "data": {
    "list": [
      { "id": 3, "name": "加拿大" },
      { "id": 2, "name": "美国" }
    ],
    "total": 2
  }
}
```

#### 获取服务列表

```
GET /api/services?cate_id=2&type=1&name=WeChat
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| cate_id | int | 否 | 2 | 分类 ID |
| type | int | 否 | 1 | 项目类型：1=首登卡, 2=重启卡, 3=续费卡 |
| name | string | 否 | - | 项目名称（模糊搜索） |

**响应示例：**

```json
{
  "success": true,
  "message": "获取服务列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "cate_id": 2,
        "name": "WeChat 注册",
        "price": 2.5,
        "user_price": 3.75,
        "num": 1000
      }
    ],
    "total": 1
  }
}
```

> **注意：** `price` 为上游原始价格，`user_price` 为加价后的用户价格。

#### 获取号码前缀

```
GET /api/services/:id/prefixes?type=1&expiry=0
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| type | int | 否 | 1 | 项目类型 |
| expiry | int | 否 | 0 | 有效期类型 |

**响应示例：**

```json
{
  "success": true,
  "message": "获取号码前缀成功",
  "data": {
    "list": [
      { "prefix": "1380", "num": 50 },
      { "prefix": "1390", "num": 30 }
    ],
    "count": 2,
    "num": 80
  }
}
```

### 订单 API

#### 创建订单

```
POST /api/orders/create
Content-Type: application/json

{
  "app_id": 1,
  "type": 1,
  "num": 5,
  "expiry": 1,
  "prefix": "1380,1390"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| app_id | int | 是 | - | 项目 ID |
| type | int | 否 | 1 | 项目类型：1=首登卡, 2=重启卡, 3=续费卡 |
| num | int | 是 | - | 购买数量 |
| expiry | int | 否 | 0 | 有效期类型（见下表） |
| prefix | string | 否 | - | 指定号码前缀，多个用逗号分隔 |
| exclude_prefix | string | 否 | - | 排除号码前缀，多个用逗号分隔 |

**有效期类型：**

| 值 | 描述 | 价格调整 |
|----|------|---------|
| 0 | 随机有效期 | 无 |
| 1 | 5-30天 | 9折 |
| 2 | 10-30天 | 无 |
| 3 | 15-30天 | 无 |
| 4 | 30-60天 | 无 |
| 5 | 60-80天 | 无 |
| 6 | 80天以上 | 加收10% |

**响应示例：**

```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "ordernum": "ORD20240101123456",
    "api_count": 5,
    "items": [
      {
        "tel": "13800138000",
        "end_time": "2024-01-31 23:59:59",
        "local_api": "/api/sms/xxxxxx..."
      }
    ]
  }
}
```

> **安全说明：** 返回的 `local_api` 已隐藏上游 Token，可安全传递给前端使用。

#### 获取订单列表

```
GET /api/orders?page=1&limit=10&type=1
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 20 | 每页数量 |
| ordernum | string | 否 | - | 订单号搜索 |
| cate_id | int | 否 | - | 分类 ID |
| app_id | int | 否 | - | 项目 ID |
| type | int | 否 | - | 项目类型 |

**响应示例：**

```json
{
  "success": true,
  "message": "获取订单列表成功",
  "data": {
    "list": [
      {
        "app_id": 1,
        "cate_id": 2,
        "type": 1,
        "tel": "13800138000",
        "end_time": "2024-01-31 23:59:59",
        "sms_count": 0,
        "voice_count": 0,
        "status": 0,
        "local_api": "/api/sms/xxxxxx..."
      }
    ],
    "total": 1
  }
}
```

#### 获取订单详情

```
GET /api/orders/:ordernum
```

**响应示例：**

```json
{
  "success": true,
  "message": "获取订单详情成功",
  "data": {
    "list": [
      {
        "app_id": 1,
        "cate_id": 2,
        "type": 1,
        "tel": "13800138000",
        "end_time": "2024-01-31 23:59:59",
        "sms_count": 0,
        "voice_count": 0,
        "remark": "",
        "status": 0,
        "local_api": "/api/sms/xxxxxx..."
      }
    ],
    "total": 1
  }
}
```

### 验证码 API

#### 获取验证码（HTML 格式）

```
GET /api/sms/:encodedApi
```

用于 HTMX 轮询，返回 HTML 片段。

**成功响应：**

```html
<div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2">
      <i class="fas fa-check-circle text-green-500"></i>
      <span class="text-green-500 text-sm font-medium">已收到验证码</span>
    </div>
    <span class="text-xs text-muted">13800138000</span>
  </div>
  <div class="bg-[var(--bg-primary)] rounded-lg p-4 mt-2">
    <p class="text-lg font-mono text-center break-all">您的验证码是：123456</p>
  </div>
  <div class="flex items-center justify-between mt-3 text-xs text-muted">
    <span>有效期至: 2024-01-31 23:59:59</span>
    <button class="...">复制验证码</button>
  </div>
</div>
```

#### 获取验证码（JSON 格式）

```
GET /api/sms/:encodedApi/json
```

**响应示例：**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "tel": "13800138000",
    "sms": "您的验证码是：123456",
    "sms_time": "2024-01-20 10:30:00",
    "expired_date": "2024-01-31 23:59:59"
  }
}
```

**暂无短信响应：**

```json
{
  "success": false,
  "message": "暂无短信"
}
```

### 错误响应格式

所有 API 在出错时返回统一格式：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

**常见错误消息：**

| 错误消息 | 说明 |
|---------|------|
| API Token 无效或已过期，请联系管理员 | 上游 Token 配置错误 |
| 库存不足，请选择其他项目 | 当前项目库存不足 |
| 系统繁忙，请稍后重试 | 上游服务繁忙 |
| 请勿重复提交订单，请等待1分钟后重试 | 重复订单保护 |
| 请选择服务项目 | 参数缺失 |

## 核心功能

### 1. 原子性扣费

使用 Supabase RPC 实现原子性扣费，避免高并发问题：

```sql
SELECT deduct_balance('user_id', 10.00);
```

### 2. 加价逻辑

```typescript
// 基础加价 + 有效期加价
const price = calculatePrice(upstreamPrice, markup, expiry);
```

### 3. HTMX 轮询优雅退出

验证码收到后，返回不含轮询属性的 HTML，自动停止轮询。

### 4. 限流保护

订单创建接口每分钟最多 5 次请求，防止恶意刷单。

## 许可证

MIT