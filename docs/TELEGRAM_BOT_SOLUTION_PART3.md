# SimpleFaka Telegram Bot 完整方案 (技术架构)

## 🏗️ 技术架构

### 系统架构图

```mermaid
graph TB
    subgraph "Telegram 客户端"
        User[用户]
        TGClient[Telegram App]
    end
    
    subgraph "Cloudflare Workers"
        subgraph "路由层"
            WebhookAPI[Webhook API]
            WebRoutes[Web Routes]
        end
        
        subgraph "适配器层"
            BotAdapter[Bot Adapter]
            DBAdapter[Database Adapter]
            PaymentAdapter[Payment Adapter]UpstreamAdapter[Upstream Adapter]
        end
        
        subgraph "领域层"
            TelegramService[Telegram Service]
            ReceiveService[Receive Service]
            OrderService[Order Service]
            UserService[User Service]
        end
        
        subgraph "中间件"
            Logger[日志]
            ErrorHandler[错误处理]
            RateLimit[限流]
        end
    end
    
    subgraph "外部服务"
        TelegramAPI[Telegram Bot API]
        Supabase[(Supabase)]
        UpstreamAPI[上游接码API]
        PaymentGateway[支付网关]
    end
    
    User -->|命令/消息| TGClient
    TGClient -->|Webhook| WebhookAPI
    TGClient -->|打开| WebRoutes
    
    WebhookAPI --> Logger
    Logger --> ErrorHandler
    ErrorHandler --> RateLimit
    RateLimit --> BotAdapter
    
    BotAdapter --> TelegramService
    TelegramService --> ReceiveService
    TelegramService --> OrderService
    TelegramService --> UserService
    
    ReceiveService --> DBAdapter
    ReceiveService --> UpstreamAdapter
    OrderService --> DBAdapter
    UserService --> DBAdapter
    
    BotAdapter -.->|发送消息| TelegramAPI
    TelegramAPI -.->|推送| TGClient
    
    DBAdapter -.->|查询/存储| Supabase
    UpstreamAdapter -.->|获取验证码| UpstreamAPI
    PaymentAdapter -.->|支付处理| PaymentGateway
    
    WebRoutes --> OrderService
    WebRoutes --> UserService
```

### 技术栈

#### 后端技术
- **运行时**：Cloudflare Workers (Edge Computing)
- **框架**：Hono (轻量级 Web 框架)
- **Bot SDK**：grammY (Telegram Bot 框架)
- **语言**：TypeScript
- **数据库**：Supabase (PostgreSQL)

#### 前端技术（Mini App）
- **框架**：React / Vue / 原生 HTML
- **SDK**：Telegram Web App SDK
- **UI**：Tailwind CSS + DaisyUI
- **交互**：HTMX (可选)

#### 开发工具
- **部署**：Wrangler CLI
- **测试**：Vitest
- **类型校验**：Zod
- **代码规范**：ESLint + Prettier

### 数据模型

#### 用户表 (telegram_users)

```sql
CREATE TABLE telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  language_code VARCHAR(10),
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);
```

#### 接码会话表 (receive_sessions)

```sql
CREATE TABLE receive_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES telegram_users(telegram_id),
  ordernum VARCHAR(255) NOT NULL,
  message_id BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'polling',
  poll_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB
);

CREATE INDEX idx_receive_sessions_user_id ON receive_sessions(user_id);
CREATE INDEX idx_receive_sessions_ordernum ON receive_sessions(ordernum);
CREATE INDEX idx_receive_sessions_status ON receive_sessions(status);
```

### API 设计

#### Webhook 端点

```
POST /api/telegram/webhook
- 接收 Telegram 更新
- IP 白名单验证
- 分发给 Bot 处理

POST /api/telegram/webhook/set
- 设置 Webhook URL
- 需要管理员权限

POST /api/telegram/webhook/info
- 获取 Webhook 信息
- 需要管理员权限

POST /api/telegram/menu/set
- 设置 Mini App 菜单按钮
- 需要管理员权限
```

#### Web 端点

```
GET /
- 首页

GET /purchase
- 商城页面（Mini App）

GET /receive
- 接码终端页面

GET /orders
- 订单列表页面

POST /api/orders
- 创建订单

GET /api/orders/:id
- 获取订单详情
```

### 安全机制

#### 1. Webhook 安全
- ✅ IP 白名单验证（Telegram 官方 IP）
- ✅ 使用 Cloudflare 的 `cf-connecting-ip`
- ⚠️ 建议添加：Secret Token 验证

#### 2. 管理员权限
- ✅ 基于 `ADMIN_SECRET` 的 Token 验证
- ⚠️ 建议添加：多管理员支持

#### 3. 用户验证
- ⚠️ 待实现：Telegram Web App 数据验证
- ⚠️ 待实现：JWT Token 机制

#### 4. 限流保护
- ⚠️ 待实现：命令调用频率限制
- ⚠️ 待实现：接码会话并发限制

### 性能优化

#### 1. 边缘计算
- ✅ 使用 Cloudflare Workers
- ✅ 全球分布式部署
- ✅ 低延迟响应

#### 2. 数据库优化
- ⚠️ 建议：添加索引（telegram_id, ordernum）
- ⚠️ 建议：使用连接池
- ⚠️ 建议：查询结果缓存

#### 3. 轮询优化
- ⚠️ 建议：智能轮询间隔
- ⚠️ 建议：使用 Webhook 替代轮询
- ⚠️ 建议：批量查询优化

### 错误处理策略

```typescript
// 错误分类
enum ErrorType {
  VALIDATION_ERROR,    // 输入验证错误
  AUTHENTICATION_ERROR, // 认证错误
  AUTHORIZATION_ERROR,  // 授权错误
  NOT_FOUND_ERROR,     // 资源不存在
  RATE_LIMIT_ERROR,    // 限流错误
  UPSTREAM_ERROR,      // 上游服务错误
  INTERNAL_ERROR       // 内部错误
}

// 错误响应格式
interface ErrorResponse {
  success: false
  error: {
    type: ErrorType
    message: string
    details?: any
  }
}
```

### 监控和日志

#### 1. 日志级别
- **DEBUG**：详细的调试信息
- **INFO**：一般信息
- **WARN**：警告信息
- **ERROR**：错误信息

#### 2. 监控指标
- 命令调用次数
- 接码成功率
- 平均响应时间
- 错误率
- 活跃用户数

#### 3. 告警规则
- 错误率超过 5%
- 响应时间超过 3秒
- 接码成功率低于 80%
- 上游 API 不可用