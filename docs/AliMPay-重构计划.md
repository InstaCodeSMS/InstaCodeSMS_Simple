# AliMPay 项目深度分析与重构计划

> 文档创建时间：2026-02-20
> 源项目：https://github.com/MiaM1ku/AliMPay
> 目标项目：SimpleFaka (Cloudflare Workers + Hono)

---

## 一、AliMPay 项目结构分析

### 1. 项目概述
AliMPay 是一个**支付宝码支付系统**，核心特性：
- 🚀 自动监控支付宝账单，实时检测支付状态
- 📱 支持两种收款模式：**经营码收款** 和 **转账码收款**
- ⏰ 5分钟支付时限，超时自动清理
- 🔐 MD5签名验证，100%兼容CodePay协议

### 2. 核心文件结构

```
AliMPay/
├── api.php              # API接口（订单查询、商户查询）
├── submit.php           # 支付提交页面
├── mapi.php             # 移动端API
├── notify.php           # 支付回调通知处理
├── health.php           # 健康检查
├── qrcode.php           # 二维码访问
├── config/
│   ├── alipay.example.php   # 支付宝配置模板
│   └── codepay.json         # 商户密钥配置
├── src/
│   ├── Core/
│   │   ├── AlipayClient.php      # 支付宝SDK客户端封装
│   │   ├── AlipayTransfer.php    # 转账二维码生成
│   │   ├── BillQuery.php         # 账务流水查询
│   │   ├── CodePay.php           # 码支付核心逻辑（29KB）
│   │   ├── PaymentMonitor.php    # 支付监控循环（25KB）
│   │   └── BackgroundTaskManager.php  # 后台任务管理
│   └── Utils/
│       ├── Logger.php            # 日志工具
│       └── QRCodeGenerator.php   # 二维码生成
└── data/
    ├── codepay.db        # SQLite数据库
    └── orders.json       # 订单数据
```

### 3. 核心类功能分析

| 类名 | 功能 | 关键方法 |
|------|------|----------|
| **CodePay** | 码支付核心 | `createPayment()`, `queryOrder()`, `validateSignature()`, `sendNotification()` |
| **PaymentMonitor** | 支付监控 | `runMonitoringCycle()`, `processBillsForBusinessQrMode()`, `processBillsForTraditionalMode()` |
| **BillQuery** | 账单查询 | `queryBills()`, `queryTodayBills()` |
| **AlipayClient** | SDK封装 | `getAlipayConfig()`, `validateConfig()` |
| **AlipayTransfer** | 转账二维码 | `createOrder()`, `generateTransferLink()` |

### 4. 两种收款模式对比

| 模式 | 经营码收款（推荐） | 转账码收款 |
|------|------------------|-----------|
| 匹配方式 | 金额 + 时间 | 备注订单号 |
| 二维码 | 固定经营码 | 动态生成 |
| 金额处理 | 自动+0.01偏移避免冲突 | 原始金额 |
| 用户体验 | 无需填写备注 | 需填写订单号备注 |

---

## 二、SimpleFaka 项目支付模块现状

### 当前结构
```
src/lib/payment/    # 目录存在但为空
```

### README规划
```
src/lib/payment/
├── index.ts      # 支付统一入口
├── alipay.ts     # 支付宝
├── wechat.ts     # 微信支付
└── usdt.ts       # USDT支付
```

---

## 三、核心技术挑战：RSA 签名验签

### 支付宝 API 签名机制
支付宝开放平台使用 **RSA2（SHA256WithRSA）** 签名算法：
- **请求签名**：使用应用私钥对请求参数签名
- **响应验签**：使用支付宝公钥验证响应签名

### AliMPay 当前实现
```php
// 使用支付宝官方 PHP SDK
"alipaysdk/openapi": "^3.0"  // 内部使用 OpenSSL 扩展
```

### Cloudflare Workers 环境限制

| 环境 | 加密 API | 支持情况 |
|------|----------|----------|
| PHP | OpenSSL 扩展 | ✅ 完整支持 |
| Node.js | crypto 模块 | ✅ 完整支持 |
| Cloudflare Workers | Web Crypto API | ⚠️ 需要适配 |

---

## 四、Web Crypto API 实现 RSA 签名验签

### 核心代码示例（TypeScript）

```typescript
// src/lib/payment/alipay/crypto.ts

/**
 * 导入 PKCS#8 格式的私钥用于签名
 */
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // 移除 PEM 头尾和换行
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

/**
 * 导入 PKCS#1 格式的公钥用于验签
 */
async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  return await crypto.subtle.importKey(
    'spki',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

/**
 * RSA 签名（支付宝 RSA2 = SHA256WithRSA）
 */
export async function rsaSign(content: string, privateKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    data
  )
  
  // 转为 Base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

/**
 * RSA 验签
 */
export async function rsaVerify(
  content: string, 
  signature: string, 
  publicKey: CryptoKey
): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
  
  return await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signatureBuffer,
    data
  )
}
```

### 支付宝 API 签名流程

```typescript
// src/lib/payment/alipay/signer.ts

export class AlipaySigner {
  private privateKey: CryptoKey | null = null
  private alipayPublicKey: CryptoKey | null = null
  
  async initialize(appPrivateKey: string, alipayPublicKey: string) {
    this.privateKey = await importPrivateKey(appPrivateKey)
    this.alipayPublicKey = await importPublicKey(alipayPublicKey)
  }
  
  /**
   * 生成支付宝请求签名
   * 1. 将参数按 key 字典序排序
   * 2. 拼接成 key1=value1&key2=value2 格式
   * 3. 使用私钥签名
   */
  async signRequest(params: Record<string, string>): Promise<string> {
    const sortedKeys = Object.keys(params).sort()
    const signContent = sortedKeys
      .filter(k => params[k] !== '' && k !== 'sign')
      .map(k => `${k}=${params[k]}`)
      .join('&')
    
    return await rsaSign(signContent, this.privateKey!)
  }
  
  /**
   * 验证支付宝响应签名
   */
  async verifyResponse(params: Record<string, string>, sign: string): Promise<boolean> {
    const sortedKeys = Object.keys(params).sort()
    const signContent = sortedKeys
      .filter(k => params[k] !== '' && k !== 'sign' && k !== 'sign_type')
      .map(k => `${k}=${params[k]}`)
      .join('&')
    
    return await rsaVerify(signContent, sign, this.alipayPublicKey!)
  }
}
```

---

## 五、重构架构设计

```
src/lib/payment/
├── index.ts                    # 支付统一入口
├── types.ts                    # 支付类型定义
├── alipay/
│   ├── index.ts               # 支付宝入口
│   ├── crypto.ts              # ⭐ Web Crypto API RSA签名验签
│   ├── signer.ts              # 签名器封装
│   ├── client.ts              # 支付宝 API 客户端
│   ├── bill-query.ts          # 账单查询服务
│   ├── code-pay.ts            # 码支付核心逻辑
│   ├── payment-monitor.ts     # 支付监控（Cron Triggers）
│   ├── qrcode.ts              # 二维码生成
│   └── transfer.ts            # 转账链接生成
└── merchant/
    └── index.ts               # 商户管理
```

---

## 六、关键实现对比

| 功能 | AliMPay (PHP) | SimpleFaka (TypeScript/Workers) |
|------|---------------|--------------------------------|
| RSA 签名 | `openssl_sign()` | `crypto.subtle.sign()` |
| RSA 验签 | `openssl_verify()` | `crypto.subtle.verify()` |
| 私钥格式 | PKCS#1/PKCS#8 | PKCS#8 (需转换) |
| 公钥格式 | PKCS#1 | SPKI (需转换) |
| HTTP 请求 | Guzzle | fetch API |
| 数据库 | SQLite (Medoo) | Supabase |
| 定时任务 | 后台 PHP 进程 | Cloudflare Cron Triggers |

---

## 七、可行性评估

### 总体可行性：✅ 完全可行

### 技术匹配度分析

| 模块 | 原实现 (PHP) | 目标实现 (TypeScript/Workers) | 可行性 | 风险 |
|------|-------------|------------------------------|--------|------|
| RSA 签名验签 | OpenSSL 扩展 | Web Crypto API | ✅ 高 | 低 |
| HTTP 请求 | Guzzle | fetch API | ✅ 高 | 无 |
| 数据库 | SQLite (本地) | Supabase (云) | ✅ 高 | 低 |
| 定时监控 | 后台进程 | Cron Triggers | ✅ 高 | 中 |
| 二维码生成 | endroid/qr-code | qrcode 库 | ✅ 高 | 无 |
| 金额匹配逻辑 | PHP 代码 | TypeScript 移植 | ✅ 高 | 无 |

---

## 八、难度评估

### 总体难度：中等 (3/5)

### 分模块难度

| 模块 | 难度 | 说明 |
|------|------|------|
| **crypto.ts** | ⭐⭐⭐ 中等 | Web Crypto API 标准化，主要工作是密钥格式转换 |
| **signer.ts** | ⭐⭐ 简单 | 签名逻辑清晰，按支付宝文档实现即可 |
| **client.ts** | ⭐⭐ 简单 | fetch API 调用，参数组装 |
| **bill-query.ts** | ⭐⭐ 简单 | 移植 PHP 逻辑，API 调用封装 |
| **code-pay.ts** | ⭐⭐⭐ 中等 | 核心业务逻辑，需要仔细移植订单管理 |
| **payment-monitor.ts** | ⭐⭐⭐⭐ 较难 | Cron Triggers 状态管理，需要设计好锁机制 |
| **transfer.ts** | ⭐ 简单 | URL 拼接逻辑，直接移植 |
| **qrcode.ts** | ⭐ 简单 | 使用 qrcode npm 包 |

---

## 九、关键技术风险点

### 1. 密钥格式转换 (风险: 中)
```
问题：支付宝私钥可能是 PKCS#1 格式
解决：需要转换工具或代码实现 PKCS#1 → PKCS#8
时间：约 30 分钟
```

### 2. Cron Triggers 状态管理 (风险: 中高)
```
问题：Workers 无状态，如何防止重复执行？
解决：使用 Durable Objects 或 KV 存储锁状态
方案：
  - 简单方案：使用 KV 存储上次执行时间
  - 完善方案：使用 Durable Objects 实现分布式锁
时间：约 2-3 小时
```

### 3. 账单查询 API 限流 (风险: 低)
```
问题：支付宝 API 可能有调用频率限制
解决：合理设置 Cron 间隔（建议 30 秒以上）
时间：无需额外开发
```

---

## 十、时间估算

### 开发时间表

| 阶段 | 任务 | 预计时间 | 累计 |
|------|------|----------|------|
| **Phase 1** | 类型定义 + Web Crypto 签名 | 1-2 小时 | 2 小时 |
| **Phase 2** | 支付宝 API 客户端 + 账单查询 | 1-2 小时 | 4 小时 |
| **Phase 3** | 码支付核心逻辑 | 2-3 小时 | 7 小时 |
| **Phase 4** | 转账链接 + 二维码 | 0.5-1 小时 | 8 小时 |
| **Phase 5** | Cron 监控 + 锁机制 | 1-2 小时 | 10 小时 |
| **Phase 6** | API 路由 + 页面 | 1-2 小时 | 12 小时 |
| **Phase 7** | 集成测试 + 调试 | 2-3 小时 | 15 小时 |

### 总计：**12-15 小时**（约 2-3 个工作日）

---

## 十一、MVP 简化方案

如果希望快速上线，可以采用 MVP 方案：

### MVP 范围
```
✅ 必须实现：
  - RSA 签名验签
  - 创建支付订单
  - 账单查询匹配
  - 基础 Cron 监控

⏸️ 可后续迭代：
  - 经营码模式（先用转账模式）
  - Durable Objects 分布式锁（先用 KV）
  - 多商户支持
```

### MVP 时间：**6-8 小时**（约 1 个工作日）

---

## 十二、实施步骤

### 第一阶段：加密基础
- [x] 分析 AliMPay 项目结构
- [x] 理解支付宝 RSA2 签名机制
- [ ] 实现 Web Crypto API RSA 签名验签 (`crypto.ts`)
- [ ] 实现签名器封装 (`signer.ts`)

### 第二阶段：支付宝 API 客户端
- [ ] 实现支付宝 API 客户端 (`client.ts`)
- [ ] 实现账单查询 (`bill-query.ts`)

### 第三阶段：码支付核心
- [ ] 实现码支付逻辑 (`code-pay.ts`)
- [ ] 实现转账链接生成 (`transfer.ts`)
- [ ] 实现二维码生成 (`qrcode.ts`)

### 第四阶段：监控与集成
- [ ] 实现 Cron Triggers 监控 (`payment-monitor.ts`)
- [ ] 创建支付 API 路由
- [ ] 集成测试

---

## 十三、关键技术点

### 1. PKCS#1 → PKCS#8 私钥转换
如果应用私钥是 PKCS#1 格式（`-----BEGIN RSA PRIVATE KEY-----`），需要转换为 PKCS#8：
```bash
# 可以使用 openssl 命令转换
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in pkcs1.key -out pkcs8.key
```

### 2. 支付宝公钥格式
支付宝公钥通常是 PKCS#1 格式，需要添加 PEM 头尾转为 SPKI：
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

### 3. Cloudflare Cron Triggers 配置
```toml
# wrangler.toml
[triggers]
crons = ["*/30 * * * * *"]  # 每30秒执行一次监控
```

---

## 十四、结论

| 项目 | 评估 |
|------|------|
| **可行性** | ✅ 完全可行，技术栈成熟 |
| **难度** | 中等，主要挑战在 Cron 状态管理 |
| **时间** | 完整版 12-15 小时，MVP 6-8 小时 |
| **风险** | 低-中，无阻塞级风险 |

### 建议执行策略
1. **先实现 MVP**，验证核心流程可行
2. **使用 KV 简化锁机制**，快速上线
3. **后续迭代优化**，添加经营码模式和 Durable Objects

---

## 附录：配置文件示例

### alipay.example.php (原始配置)
```php
<?php
return [
    // 支付宝网关地址
    'server_url' => 'https://openapi.alipay.com',
    
    // 应用ID
    'app_id' => '',
    
    // 应用私钥
    'private_key' => '',
    
    // 支付宝公钥
    'alipay_public_key' => '',
    
    // 转账用户ID
    'transfer_user_id' => '',
    
    // 签名方式
    'sign_type' => 'RSA2',
    
    // 支付配置
    'payment' => [
        'max_wait_time' => 300,
        'check_interval' => 3,
        'query_minutes_back' => 30,
        'order_timeout' => 300,
        'auto_cleanup' => true,
        
        // 经营码收款配置
        'business_qr_mode' => [
            'enabled' => true,
            'qr_code_path' => __DIR__ . '/../qrcode/business_qr.png',
            'amount_offset' => 0.01,
            'match_tolerance' => 300,
        ],
    ],
];
```

### 环境变量配置 (Cloudflare Workers)
```env
# 支付宝配置
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key_pem
ALIPAY_PUBLIC_KEY=alipay_public_key_pem
ALIPAY_TRANSFER_USER_ID=your_alipay_user_id

# 支付配置
ALIPAY_ORDER_TIMEOUT=300
ALIPAY_BUSINESS_QR_ENABLED=true
ALIPAY_AMOUNT_OFFSET=0.01
```

---

> 文档版本：v1.0
> 最后更新：2026-02-20