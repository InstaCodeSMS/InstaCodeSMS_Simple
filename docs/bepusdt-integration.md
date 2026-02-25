# BEpusdt 支付集成文档

## 概述

BEpusdt 是一个开源的 USDT 收款解决方案，支持多种区块链网络和加密货币。本文档描述了在 SimpleJieMa 项目中集成 BEpusdt 的技术细节。

## 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   后端      │────▶│  BEpusdt    │
│  (HTMX)     │     │  (Hono)     │     │   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  (订单存储)  │
                    └─────────────┘
```

## 支持的支付方式

### 加密货币类型

| 货币 | 网络 | Trade Type |
|------|------|------------|
| USDT | TRC20 | `usdt.trc20` |
| USDT | ERC20 | `usdt.erc20` |
| USDT | BEP20 | `usdt.bep20` |
| USDT | Polygon | `usdt.polygon` |
| USDC | TRC20 | `usdc.trc20` |
| USDC | ERC20 | `usdc.erc20` |
| USDC | Polygon | `usdc.polygon` |
| TRX | Tron | `tron.trx` |
| ETH | Ethereum | `eth.eth` |
| BNB | BSC | `bnb.bsc` |

### 法币类型

支持：`CNY`、`USD`、`EUR`、`GBP`、`JPY`

## 签名算法

BEpusdt 使用 MD5 签名验证请求的合法性。

### 签名步骤

1. **筛选参数**：移除空值和 `signature` 字段
2. **字典序排序**：按键名 ASCII 码升序排列
3. **拼接字符串**：格式为 `key1=value1&key2=value2&...`
4. **追加 Token**：在字符串末尾直接追加 API Token（无 `&` 符号）
5. **计算 MD5**：对完整字符串进行 MD5 哈希并转小写

### 示例

```javascript
// 参数
const params = {
  order_id: 'ORD123456',
  amount: 100,
  notify_url: 'http://localhost:3000/api/payment/callback/usdt',
  redirect_url: 'http://localhost:3000/success',
}

// 排序后拼接
// amount=100&notify_url=http://localhost:3000/...&order_id=ORD123456&redirect_url=http://localhost:3000/success

// 追加 Token（直接拼接，无 & 符号）
const signStr = signContent + apiToken

// 计算 MD5
const signature = md5(signStr).toLowerCase()
```

### 与 AliMPay 的区别

| 特性 | BEpusdt | AliMPay |
|------|---------|---------|
| 密钥追加方式 | 直接追加（无 &） | 直接追加（无 &） |
| 请求方式 | POST JSON | GET Query String |
| URL 编码 | 不需要手动处理 | 需要注意编码规则 |
| MD5 库要求 | 内置 UTF-8 处理 | 需要 blueimp-md5 |

## API 接口

### 创建交易订单

**端点**：`POST /api/v1/order/create-transaction`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | ✅ | 商户订单编号（唯一） |
| `amount` | number | ✅ | 支付金额（法币） |
| `notify_url` | string | ✅ | 异步回调地址 |
| `redirect_url` | string | ✅ | 支付成功跳转地址 |
| `signature` | string | ✅ | 签名 |
| `trade_type` | string | ❌ | 交易类型，默认 `usdt.trc20` |
| `fiat` | string | ❌ | 法币类型，默认 `CNY` |
| `name` | string | ❌ | 商品名称 |
| `timeout` | number | ❌ | 超时时间（秒），最低 120 |

**响应示例**：

```json
{
  "status_code": 200,
  "message": "ok",
  "data": {
    "fiat": "CNY",
    "trade_id": "TR202602240001",
    "order_id": "ORD123456",
    "amount": "100.00",
    "actual_amount": "14.285714",
    "status": 1,
    "token": "TRXxxxxxxxxxxxxxxxxxxxxxxxxx",
    "expiration_time": 300,
    "payment_url": "https://pay.example.com/TR202602240001"
  },
  "request_id": "req_xxx"
}
```

### 取消交易订单

**端点**：`POST /api/v1/order/cancel-transaction`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `trade_id` | string | ✅ | 系统交易 ID |
| `signature` | string | ✅ | 签名 |

### 获取付款方式

**端点**：`POST /api/v1/pay/methods`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `trade_id` | string | ✅ | 系统交易 ID |
| `currency` | string | ❌ | 货币过滤 |
| `signature` | string | ✅ | 签名 |

### 支付回调

**回调数据**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `trade_id` | string | 系统交易 ID |
| `order_id` | string | 商户订单编号 |
| `amount` | number | 请求支付金额（法币） |
| `actual_amount` | number | 实际支付金额（加密货币） |
| `token` | string | 收款地址 |
| `block_transaction_id` | string | 区块链交易哈希 |
| `status` | number | 订单状态 |
| `signature` | string | 签名 |

**订单状态**：

| 状态码 | 说明 |
|--------|------|
| 1 | 等待支付 |
| 2 | 支付成功 |
| 3 | 支付超时 |

## 代码结构

```
src/lib/payment/bepusdt/
├── client.ts      # API 客户端
├── signer.ts      # 签名器（含 MD5 实现）
└── types.ts       # TypeScript 类型定义
```

### 客户端使用示例

```typescript
import { createBepusdtClient } from '@/lib/payment/bepusdt'

// 创建客户端
const client = new BepusdtClient({
  apiUrl: 'https://pay.example.com',
  apiToken: 'your-api-token',
})

// 创建交易
const result = await client.createTransaction({
  orderId: 'ORD123456',
  amount: 100,
  notifyUrl: 'http://localhost:3000/api/payment/callback/usdt',
  redirectUrl: 'http://localhost:3000/success',
  tradeType: 'usdt.trc20',
  fiat: 'CNY',
  name: '商品名称',
  timeout: 300,
})

// 获取付款方式
const methods = await client.getPaymentMethods(result.trade_id)

// 取消交易
await client.cancelTransaction(result.trade_id)

// 验证回调
const isValid = client.verifyCallback(callbackData)
```

### 签名器使用示例

```typescript
import { BepusdtSigner } from '@/lib/payment/bepusdt/signer'

const signer = new BepusdtSigner('your-api-token')

// 生成签名
const params = { order_id: 'ORD123', amount: 100 }
const signature = signer.generateSignature(params)

// 验证签名
const isValid = signer.verifySignature({ ...params, signature })
```

## MD5 实现

BEpusdt 签名器内置了纯 JavaScript MD5 实现，专门针对 Cloudflare Workers 环境优化：

### UTF-8 处理

```javascript
function convertToWordArray(str: string) {
  // 使用 encodeURIComponent 正确处理 UTF-8 多字节字符
  const utf8 = unescape(encodeURIComponent(str))
  // ... MD5 计算
}
```

**注意**：与 AliMPay 不同，BEpusdt 的 MD5 实现已经内置了正确的 UTF-8 处理，无需额外依赖。

## 错误处理

| 状态码 | 说明 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | 正常处理 |
| 400 | 请求参数错误 | 检查参数格式 |
| 401 | 签名验证失败 | 检查签名算法和 Token |
| 404 | 订单不存在 | 检查订单 ID |

## 环境变量

```env
# BEpusdt 配置
BEPUSDT_API_URL=https://pay.example.com
BEPUSDT_API_TOKEN=your-api-token
BEPUSDT_NOTIFY_URL=http://localhost:3000/api/payment/callback/usdt
```

## 调试技巧

### 1. 打印签名过程

```javascript
console.log('排序后参数:', sortedKeys)
console.log('签名字符串:', signContent)
console.log('追加 Token:', contentWithToken)
console.log('最终签名:', md5(contentWithToken))
```

### 2. 验证签名算法

```javascript
// 使用 Node.js crypto 验证
const crypto = require('crypto')
const expected = crypto.createHash('md5').update(signStr + token).digest('hex')
console.log('Expected:', expected)
```

### 3. 测试回调

```bash
curl -X POST http://localhost:3000/api/payment/callback/usdt \
  -H "Content-Type: application/json" \
  -d '{
    "trade_id": "TR001",
    "order_id": "ORD001",
    "amount": 100,
    "actual_amount": 14.28,
    "token": "TRX...",
    "status": 2,
    "signature": "..."
  }'
```

## 与 AliMPay 对比

| 特性 | BEpusdt | AliMPay |
|------|---------|---------|
| 支付方式 | 加密货币 | 支付宝 |
| 请求方式 | POST JSON | GET Query String |
| 签名算法 | MD5 | MD5 |
| URL 编码 | 自动处理 | 需手动处理 |
| MD5 库依赖 | 无（内置） | blueimp-md5 |
| 超时机制 | 服务端支持 | 需客户端实现 |
| 回调状态 | 多状态 | 支付成功 |

## 最佳实践

1. **订单唯一性**：确保 `order_id` 全局唯一
2. **金额精度**：法币金额注意精度处理
3. **超时设置**：建议设置 300 秒以上超时
4. **回调验证**：务必验证签名防止伪造
5. **幂等处理**：回调可能重复发送，需做幂等处理

## 更新日志

- **2026-02-24**：初始版本，支持创建交易、取消交易、付款方式查询