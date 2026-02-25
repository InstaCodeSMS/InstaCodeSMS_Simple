# AliMPay 支付集成文档

## 概述

AliMPay 是一个基于 CodePay 协议的支付网关，支持支付宝收款。本文档描述了在 SimpleJieMa 项目中集成 AliMPay 的技术细节。

## 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   后端      │────▶│  AliMPay    │
│  (HTMX)     │     │  (Hono)     │     │   API       │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  (订单存储)  │
                    └─────────────┘
```

## CodePay 协议

### 签名算法

AliMPay 使用 CodePay 协议的签名算法：

1. **过滤空值参数**：移除空字符串、`undefined`、`null`
2. **按键名升序排序**：字母顺序排列
3. **拼接字符串**：格式为 `key1=value1&key2=value2&...`
4. **拼接商户密钥**：在字符串末尾追加商户密钥
5. **计算 MD5**：对完整字符串进行 MD5 哈希

#### 示例

```javascript
// 参数
const params = {
  money: 1.8,
  name: '微信',
  notify_url: 'http://localhost:3000/api/payment/callback/alipay',
  out_trade_no: 'ORD123456',
  pid: '1001015983220148',
  return_url: 'http://localhost:3000/success',
  type: 'alipay',
}

// 排序后拼接
// money=1.8&name=微信&notify_url=http://localhost:3000/...&out_trade_no=ORD123456&pid=1001015983220148&return_url=http://localhost:3000/success&type=alipay

// 追加密钥后计算 MD5
const sign = md5(signStr + merchantKey)
```

### 关键注意事项

#### 1. URL 编码规则

**重要**：AliMPay 对 URL 参数编码有特殊要求：

| 参数 | 是否编码 | 说明 |
|------|----------|------|
| `name` | ✅ 需要 | 中文字符必须 URL 编码 |
| `notify_url` | ❌ 不需要 | 保持原始 URL |
| `return_url` | ❌ 不需要 | 保持原始 URL |
| `sign` | ❌ 不需要 | 签名值无需编码 |

**错误示例**（使用 `URLSearchParams` 自动编码）：
```
notify_url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2F...
# 签名验证失败！
```

**正确示例**（手动构建查询字符串）：
```
notify_url=http://localhost:3000/api/payment/callback/alipay
# 签名验证成功！
```

#### 2. MD5 与中文字符

**关键问题**：纯 JavaScript MD5 实现对 UTF-8 多字节字符（如中文）处理可能有问题。

**解决方案**：使用 `blueimp-md5` 库，它正确处理 UTF-8 编码。

```javascript
import md5 from 'blueimp-md5'

// ✅ 正确处理中文
const sign = md5('name=微信' + merchantKey)
```

#### 3. sign_type 参数

**注意**：`sign_type` 参数**不需要发送**到 AliMPay 服务端，虽然签名算法使用 MD5。

## API 接口

### 创建支付订单

**端点**：`GET /mapi.php`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `money` | number | ✅ | 支付金额 |
| `name` | string | ✅ | 商品名称（URL 编码） |
| `notify_url` | string | ✅ | 异步回调地址 |
| `out_trade_no` | string | ✅ | 商户订单号 |
| `pid` | string | ✅ | 商户 ID |
| `return_url` | string | ✅ | 同步跳转地址 |
| `type` | string | ✅ | 支付类型：`alipay` |
| `sign` | string | ✅ | 签名 |

**响应示例**：

```json
{
  "code": 1,
  "msg": "SUCCESS",
  "pid": "1001015983220148",
  "trade_no": "20260224094229310305",
  "out_trade_no": "ORD123456",
  "money": "1.8",
  "payment_amount": 1.8,
  "payment_url": "经营码收款模式",
  "qr_code_url": "http://alimpay.example.com/qrcode.php?token=xxx",
  "business_qr_mode": true,
  "payment_instruction": "请使用支付宝扫描二维码，支付金额：1.8 元",
  "payment_tips": [
    "请务必支付准确金额：1.8 元",
    "支付时无需填写备注信息",
    "请在5分钟内完成支付，超时订单将被自动删除"
  ]
}
```

### 查询订单状态

**端点**：`GET /api.php`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `act` | string | ✅ | 固定值：`order` |
| `pid` | string | ✅ | 商户 ID |
| `key` | string | ✅ | 商户密钥 |
| `out_trade_no` | string | ✅ | 商户订单号 |

### 支付回调

**回调验证**：

```javascript
function verifyCallback(params) {
  const { sign, sign_type, ...restParams } = params
  const expectedSign = generateSign(restParams)
  return sign === expectedSign
}
```

## 代码结构

```
src/lib/payment/alimpay/
├── client.ts      # API 客户端
└── types.ts       # TypeScript 类型定义
```

### 客户端使用示例

```typescript
import { createAlimpayClient } from '@/lib/payment/alimpay'

const client = createAlimpayClient({
  apiUrl: 'http://alimpay.example.com',
  pid: '1001015983220148',
  key: 'your-merchant-key',
})

// 创建支付
const result = await client.createPayment({
  orderId: 'ORD123456',
  amount: 1.8,
  name: '微信',
  notifyUrl: 'http://localhost:3000/api/payment/callback/alipay',
  returnUrl: 'http://localhost:3000/success',
})

// 查询订单
const order = await client.queryOrder('ORD123456')

// 验证回调
const isValid = client.verifyCallback(callbackParams)
```

## 错误处理

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| `-1` | 签名验证失败 | 检查签名算法和参数编码 |
| `400` | HTTP 错误 | 检查网络连接和参数格式 |

## 调试技巧

### 1. 打印签名字符串

```javascript
console.log('signStr:', signStr)
console.log('fullSignStr:', signStr + merchantKey)
console.log('sign:', md5(signStr + merchantKey))
```

### 2. 对比 Node.js crypto

```javascript
const crypto = require('crypto')
const nodeSign = crypto.createHash('md5').update(str).digest('hex')
console.log('Node crypto:', nodeSign)
console.log('blueimp-md5:', md5(str))
// 两者应该一致
```

### 3. curl 测试

```bash
curl "http://alimpay.example.com/mapi.php?money=1.8&name=%E5%BE%AE%E4%BF%A1&notify_url=http://localhost:3000/notify&out_trade_no=TEST&pid=YOUR_PID&return_url=http://localhost:3000/success&type=alipay&sign=YOUR_SIGN"
```

## 依赖

- `blueimp-md5`：MD5 哈希库，正确处理 UTF-8 中文字符

## 更新日志

- **2026-02-24**：修复 MD5 中文处理问题，改用 `blueimp-md5` 库
- **2026-02-24**：修复 URL 参数编码问题，`notify_url` 和 `return_url` 不编码
- **2026-02-24**：移除 `sign_type` 参数