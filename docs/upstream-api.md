# 上游 API 接口文档

> 本文档详细描述了 SimpleFaka 对接的上游接码平台 API 接口规范。

## 目录

- [上游 API 接口文档](#上游-api-接口文档)
  - [目录](#目录)
  - [1. 概述](#1-概述)
    - [基础信息](#基础信息)
    - [环境配置](#环境配置)
  - [2. 认证方式](#2-认证方式)
    - [认证失败响应](#认证失败响应)
  - [3. 基础响应结构](#3-基础响应结构)
    - [状态码说明](#状态码说明)
  - [4. 接口详情](#4-接口详情)
    - [4.1 用户信息](#41-用户信息)
    - [4.2 项目分类](#42-项目分类)
    - [4.3 项目列表](#43-项目列表)
    - [4.4 号码前缀](#44-号码前缀)
    - [4.5 创建订单](#45-创建订单)
    - [4.6 订单列表](#46-订单列表)
    - [4.7 订单详情](#47-订单详情)
    - [4.8 短信验证码](#48-短信验证码)
  - [5. 错误处理](#5-错误处理)
    - [常见错误消息](#常见错误消息)
    - [错误处理代码示例](#错误处理代码示例)
  - [6. 类型定义](#6-类型定义)
    - [TypeScript 类型定义](#typescript-类型定义)
  - [7. 最佳实践](#7-最佳实践)
    - [7.1 数据类型转换](#71-数据类型转换)
    - [7.2 敏感信息保护](#72-敏感信息保护)
    - [7.3 HTMX 轮询实现](#73-htmx-轮询实现)
    - [7.4 错误重试策略](#74-错误重试策略)
    - [7.5 价格计算](#75-价格计算)
  - [更新日志](#更新日志)

---

## 1. 概述

### 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `https://api.cc` |
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 环境配置

本项目通过环境变量配置上游 API：

```bash
# .dev.vars
UPSTREAM_API_URL=https://api.cc
UPSTREAM_API_TOKEN=your_api_token_here
PRICE_MARKUP=1.5  # 加价倍率
```

---

## 2. 认证方式

所有 API 请求需要在请求头中携带 Authorization Token：

```
Authorization: your_api_token_here
```

### 认证失败响应

```json
{
  "code": 401,
  "msg": "授权令牌无效",
  "time": 1771698917,
  "data": null
}
```

---

## 3. 基础响应结构

所有接口返回统一的响应结构：

```typescript
interface UpstreamResponse<T> {
  code: number    // 状态码：1 表示成功，其他表示失败
  msg: string     // 响应消息
  time: number    // Unix 时间戳
  data: T | null  // 响应数据，失败时为 null
}
```

### 状态码说明

| code | 含义 |
|------|------|
| 1 | 成功 |
| 0 | 业务错误（如库存不足、余额不足等） |
| 401 | 认证失败 |

---

## 4. 接口详情

### 4.1 用户信息

获取当前用户的账户信息，包括余额。

**请求**

```
GET /api/v1/profile/info
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取个人信息成功",
  "time": 1771698913,
  "data": {
    "username": "qQwQp",
    "nickname": "qQwQp",
    "avatar": "https://oss.api21k.com/static/images/avatar.png",
    "money": "5.931"
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| nickname | string | 昵称 |
| avatar | string | 头像 URL |
| money | string | 账户余额（字符串类型，需转换为数字） |

---

### 4.2 项目分类

获取所有可用的项目分类列表。

**请求**

```
GET /api/v1/app/cate
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取项目分类成功",
  "time": 1771698914,
  "data": {
    "list": [
      { "id": 6, "name": "英国卡" },
      { "id": 4, "name": "HK香港卡（在重启卡页面购卡）" },
      { "id": 3, "name": "加拿大ixica运营商（没有售后）" },
      { "id": 5, "name": "美国（物理卡片实卡）" },
      { "id": 2, "name": "新运营商（美国）" }
    ],
    "total": 5
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Category[] | 分类列表 |
| total | number | 分类总数 |

**Category 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 分类 ID |
| name | string | 分类名称 |

---

### 4.3 项目列表

获取指定分类下的所有可用项目（服务）。

**请求**

```
POST /api/v1/app/list
Content-Type: application/json
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |
| Content-Type | application/json |

**请求体**

```json
{
  "cate_id": 2,
  "type": 1,
  "name": ""
}
```

**请求参数说明**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| cate_id | number | 否 | 2 | 分类 ID |
| type | number | 否 | 1 | 项目类型：1=首登卡, 2=重启卡, 3=续费卡 |
| name | string | 否 | - | 项目名称搜索关键词 |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取项目列表成功",
  "time": 1771698800,
  "data": {
    "list": [
      {
        "id": 72,
        "cate_id": 2,
        "name": "全码（新运营商）可接任何短信没有限制",
        "price": "1.000",
        "num": 933
      },
      {
        "id": 74,
        "cate_id": 2,
        "name": "Telegram,飞机,电报（不售后设备码）",
        "price": "0.250",
        "num": 34131
      }
    ],
    "total": 446
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 项目 ID（用于下单） |
| cate_id | number | 所属分类 ID |
| name | string | 项目名称 |
| price | string | 单价（字符串类型，需转换为数字） |
| num | number | 当前库存数量 |

> ⚠️ **重要提示**：`price` 字段返回的是字符串类型，需要进行 `parseFloat()` 转换后才能用于价格计算。

---

### 4.4 号码前缀

获取指定项目可用的手机号码前缀列表。

**请求**

```
POST /api/v1/buy/prefix
Content-Type: application/json
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |
| Content-Type | application/json |

**请求体**

```json
{
  "app_id": 74,
  "type": 1,
  "expiry": 0
}
```

**请求参数说明**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| app_id | number | 是 | - | 项目 ID |
| type | number | 否 | 1 | 项目类型 |
| expiry | number | 否 | 0 | 有效期类型（见有效期枚举） |

**有效期类型枚举**

| 值 | 说明 | 价格系数 |
|----|------|---------|
| 0 | 随机有效期 | 1.0 |
| 1 | 5-30天 | 0.9 (9折) |
| 2 | 10-30天 | 1.0 |
| 3 | 15-30天 | 1.0 |
| 4 | 30-60天 | 1.0 |
| 5 | 60-80天 | 1.0 |
| 6 | 80天以上 | 1.1 (加收10%) |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取前缀列表成功",
  "time": 1771698915,
  "data": {
    "list": [
      { "prefix": 1206, "num": 106 },
      { "prefix": 1207, "num": 9 },
      { "prefix": 1213, "num": 122 }
    ],
    "count": 3,
    "num": 237
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Prefix[] | 前缀列表 |
| count | number | 前缀数量 |
| num | number | 总库存数量 |

**Prefix 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| prefix | number | 号码前缀（数字类型） |
| num | number | 该前缀下的库存数量 |

> ⚠️ **重要提示**：`prefix` 字段返回的是数字类型，不是字符串。

---

### 4.5 创建订单

购买指定项目的手机号码。

**请求**

```
POST /api/v1/buy/create
Content-Type: application/json
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |
| Content-Type | application/json |

**请求体**

```json
{
  "app_id": 74,
  "type": 1,
  "num": 1,
  "expiry": 0,
  "prefix": "",
  "exclude_prefix": ""
}
```

**请求参数说明**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| app_id | number | 是 | - | 项目 ID |
| type | number | 否 | 1 | 项目类型 |
| num | number | 是 | - | 购买数量 |
| expiry | number | 否 | 0 | 有效期类型 |
| prefix | string | 否 | - | 指定号码前缀 |
| exclude_prefix | string | 否 | - | 排除号码前缀 |

**成功响应**

```json
{
  "code": 1,
  "msg": "购买成功",
  "time": 1771699000,
  "data": {
    "ordernum": "26020108434187017",
    "api_count": 1,
    "url_list": [
      "https://node.instacode.cfd",
      "https://api.sms8.net",
      "https://api.smsapi.cc",
      "http://47.76.194.115"
    ],
    "list": [
      {
        "id": 71000189,
        "app_id": "74",
        "cate_id": 2,
        "type": 1,
        "tel": "17247027854",
        "token": "bc7s2b2oxpqe0izjetb58htjq7w14gm6pfp8",
        "end_time": "2026-03-30 00:00:00",
        "sms_count": 0,
        "voice_count": 0,
        "remark": "",
        "status": 0,
        "api": "https://node.instacode.cfd/api/record?token=bc7s2b2oxpqe0izjetb58htjq7w14gm6pfp8"
      }
    ]
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| ordernum | string | 订单号 |
| api_count | number | API 数量 |
| url_list | string[] | API 服务器列表 |
| list | OrderItem[] | 订单项列表 |

**OrderItem 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单项 ID |
| app_id | string | 项目 ID（字符串类型） |
| cate_id | number | 分类 ID |
| type | number | 项目类型 |
| tel | string | 手机号码 |
| token | string | 验证码查询 Token |
| end_time | string | 过期时间 |
| sms_count | number | 收到的短信数量 |
| voice_count | number | 收到的语音数量 |
| remark | string | 备注 |
| status | number | 状态：0=进行中, 1=已完成 |
| api | string | 验证码查询 API URL |

> ⚠️ **重要提示**：`app_id` 在订单数据中返回的是字符串类型。

**失败响应示例**

```json
{
  "code": 0,
  "msg": "Under the currently selected conditions, the inventory is insufficient",
  "time": 1771698918,
  "data": null
}
```

---

### 4.6 订单列表

获取历史订单列表。

**请求**

```
POST /api/v1/order/list
Content-Type: application/json
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |
| Content-Type | application/json |

**请求体**

```json
{
  "page": 1,
  "limit": 20,
  "ordernum": "",
  "cate_id": null,
  "app_id": null,
  "type": null
}
```

**请求参数说明**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |
| ordernum | string | 否 | - | 订单号搜索 |
| cate_id | number | 否 | - | 分类 ID 筛选 |
| app_id | number | 否 | - | 项目 ID 筛选 |
| type | number | 否 | - | 项目类型筛选 |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取订单列表成功",
  "time": 1771698816,
  "data": {
    "list": [
      {
        "id": 1219513,
        "ordernum": "26020108434187017",
        "app_id": "74",
        "cate_id": 2,
        "type": 1,
        "num": 1,
        "remark": "",
        "status": 0,
        "create_time": "2026-02-01 08:43:41",
        "smsApp": {
          "name": "Telegram,飞机,电报（不售后设备码）"
        }
      }
    ],
    "total": 81
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | OrderListItem[] | 订单列表 |
| total | number | 订单总数 |

**OrderListItem 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单 ID |
| ordernum | string | 订单号 |
| app_id | string | 项目 ID（字符串类型） |
| cate_id | number | 分类 ID |
| type | number | 项目类型 |
| num | number | 购买数量 |
| remark | string | 备注 |
| status | number | 状态 |
| create_time | string | 创建时间 |
| smsApp.name | string | 项目名称 |

> ⚠️ **重要提示**：订单列表返回的数据**不包含** `tel`、`token`、`api` 等字段。如需获取这些字段，请调用订单详情接口。

---

### 4.7 订单详情

获取指定订单的详细信息，包括手机号、Token 和验证码查询 API。

**请求**

```
POST /api/v1/order/api
Content-Type: application/json
```

**请求头**

| 字段 | 值 |
|------|-----|
| Authorization | API Token |
| Content-Type | application/json |

**请求体**

```json
{
  "ordernum": "26020108434187017"
}
```

**请求参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ordernum | string | 是 | 订单号 |

**成功响应**

```json
{
  "code": 1,
  "msg": "获取订单API列表成功",
  "time": 1771698917,
  "data": {
    "url_list": [
      "https://node.instacode.cfd",
      "https://api.sms8.net",
      "https://api.smsapi.cc",
      "http://47.76.194.115"
    ],
    "list": [
      {
        "id": 71000189,
        "app_id": "74",
        "cate_id": 2,
        "type": 1,
        "tel": "17247027854",
        "token": "bc7s2b2oxpqe0izjetb58htjq7w14gm6pfp8",
        "end_time": "2026-03-30 00:00:00",
        "sms_count": 0,
        "voice_count": 0,
        "remark": "",
        "status": 0,
        "api": "https://node.instacode.cfd/api/record?token=bc7s2b2oxpqe0izjetb58htjq7w14gm6pfp8"
      }
    ],
    "total": 1
  }
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| url_list | string[] | API 服务器列表 |
| list | OrderItem[] | 订单项详情列表 |
| total | number | 订单项数量 |

**失败响应**

```json
{
  "code": 0,
  "msg": "请提供订单号",
  "time": 1771698829,
  "data": null
}
```

---

### 4.8 短信验证码

获取指定订单的短信验证码。此接口不需要 Token 认证，直接使用订单详情返回的 `api` URL 即可查询。

**请求**

```
GET {api_url}&format=json3
```

**参数说明**

| 参数 | 值 | 说明 |
|------|-----|------|
| format | json3 | 返回 JSON 格式的完整数据 |

**示例请求**

```
GET https://node.instacode.cfd/api/record?token=bc7s2b2oxpqe0izjetb58htjq7w14gm6pfp8&format=json3
```

**成功响应（已收到验证码）**

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "tel": "17247027854",
    "sms": "Your verification code is: 123456",
    "sms_time": "2026-02-01 08:45:30",
    "expired_date": "2026-03-30 00:00:00"
  }
}
```

**等待验证码响应**

```json
{
  "code": 0,
  "msg": "No SMS received yet",
  "data": null
}
```

**数据字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| tel | string | 手机号码 |
| sms | string | 短信内容 |
| sms_time | string | 收到短信的时间 |
| expired_date | string | 过期时间 |

---

## 5. 错误处理

### 常见错误消息

| 原始消息 | 友好消息 | 处理建议 |
|---------|---------|---------|
| `授权令牌无效` | API Token 无效或已过期 | 检查 Token 配置 |
| `Invalid login token` | API Token 无效或已过期 | 检查 Token 配置 |
| `Insufficient inventory` | 库存不足，请选择其他项目 | 减少购买数量 |
| `Under the currently selected conditions, the inventory is insufficient` | 当前条件下库存不足 | 减少购买数量或选择其他项目 |
| `Insufficient balance` | 余额不足，请充值后重试 | 充值账户余额 |
| `Too many buyers, please try again later` | 系统繁忙，请稍后重试 | 等待后重试 |
| `Do not submit duplicate orders` | 请勿重复提交订单 | 等待1分钟后重试 |

### 错误处理代码示例

```typescript
// src/lib/upstream.ts
const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login token': 'API Token 无效或已过期，请联系管理员',
  'Project ID cannot be empty': '项目 ID 不能为空',
  'Insufficient inventory': '库存不足，请选择其他项目',
  'Too many buyers, please try again later': '系统繁忙，请稍后重试',
  'Do not submit duplicate orders': '请勿重复提交订单，请等待1分钟后重试',
  'Insufficient balance': '余额不足，请充值后重试',
  '授权令牌无效': 'API Token 无效或已过期',
  'Under the currently selected conditions, the inventory is insufficient': 
    '当前条件下库存不足，请减少购买数量或选择其他项目',
}

function getFriendlyMessage(msg: string): string {
  for (const [key, value] of Object.entries(FRIENDLY_ERRORS)) {
    if (msg.includes(key)) {
      return value
    }
  }
  return msg || '上游服务异常，请稍后重试'
}
```

---

## 6. 类型定义

### TypeScript 类型定义

```typescript
// src/types/api.ts

// ========== 基础响应结构 ==========
export interface UpstreamResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

// ========== 用户信息 ==========
export interface ProfileData {
  username: string
  nickname: string
  avatar: string
  money: string // 注意：上游返回的是字符串类型
}

// ========== 分类 ==========
export interface Category {
  id: number
  name: string
}

export interface CategoryListData {
  list: Category[]
  total: number
}

// ========== 项目/服务 ==========
export interface App {
  id: number
  cate_id: number
  name: string
  price: string // 注意：上游返回的是字符串类型
  num: number
}

export interface AppListData {
  list: App[]
  total: number
}

// ========== 号码前缀 ==========
export interface Prefix {
  prefix: number // 注意：上游返回的是数字类型
  num: number
}

export interface PrefixListData {
  list: Prefix[]
  count: number
  num: number
}

// ========== 订单 ==========
export interface OrderListItem {
  id: number
  ordernum: string
  app_id: string // 注意：上游返回的是字符串类型
  cate_id: number
  type: number
  num: number
  remark: string
  status: number
  create_time: string
  smsApp: {
    name: string
  }
}

export interface OrderItem {
  id: number
  app_id: string // 注意：上游返回的是字符串类型
  cate_id: number
  type: number
  tel: string
  token: string
  end_time: string
  sms_count: number
  voice_count: number
  remark: string
  status: number
  api: string
}

export interface OrderCreateData {
  ordernum: string
  api_count: number
  url_list: string[]
  list: OrderItem[]
}

export interface OrderListData {
  list: OrderListItem[]
  total: number
}

export interface OrderDetailData {
  url_list: string[]
  list: OrderItem[]
  total: number
}

// ========== 短信验证码 ==========
export interface SmsDataJson3 {
  tel: string
  sms: string
  sms_time: string
  expired_date: string
}

// ========== 枚举 ==========
export enum ProjectType {
  FirstTime = 1, // 首登卡
  Restart = 2,   // 重启卡
  Renewal = 3,   // 续费卡
}

export enum ExpiryType {
  Random = 0,      // 随机
  Days5to30 = 1,   // 5-30天 (9折)
  Days10to30 = 2,  // 10-30天
  Days15to30 = 3,  // 15-30天
  Days30to60 = 4,  // 30-60天
  Days60to80 = 5,  // 60-80天
  Days80Plus = 6,  // 80天以上 (加收10%)
}
```

---

## 7. 最佳实践

### 7.1 数据类型转换

由于上游 API 返回的部分字段类型不符合预期，需要进行类型转换：

```typescript
// 价格转换（字符串 → 数字）
const price = parseFloat(app.price)

// 余额转换（字符串 → 数字）
const balance = parseFloat(profile.money)

// 号码前缀格式化（数字 → 字符串显示）
const prefixStr = prefix.prefix.toString()
```

### 7.2 敏感信息保护

在对外暴露 API 时，应过滤敏感信息：

```typescript
// 订单列表：不返回 token、api 等敏感字段
// 订单详情：可返回 token、api，但应代理请求验证码

// ✅ 正确做法：通过后端代理获取验证码
app.get('/api/sms/:ordernum', async (c) => {
  const orderDetail = await client.getOrderDetail({ ordernum })
  // 代理请求上游 API，保护 Token 不泄露
})
```

### 7.3 HTMX 轮询实现

短信验证码获取支持 HTMX 自动轮询：

```html
<div 
  hx-get="/api/sms/26020108434187017" 
  hx-trigger="every 3s" 
  hx-swap="innerHTML"
>
  等待短信...
</div>
```

### 7.4 错误重试策略

| 错误类型 | 重试策略 |
|---------|---------|
| 网络超时 | 立即重试，最多 3 次 |
| 库存不足 | 不重试，提示用户 |
| 系统繁忙 | 延迟 30 秒后重试 |
| 认证失败 | 不重试，提示管理员 |

### 7.5 价格计算

```typescript
// 计算用户价格
function calculatePrice(
  basePrice: string | number,
  markup: number = 1.5,
  expiry?: number
): number {
  const numericPrice = typeof basePrice === 'string' 
    ? parseFloat(basePrice) 
    : basePrice
  
  const expiryMultiplier = getExpiryMultiplier(expiry)
  
  return Math.round(numericPrice * markup * expiryMultiplier * 100) / 100
}
```

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-22 | 1.0.0 | 初始版本，基于实际 API 测试结果编写 |

---

> 📝 **维护说明**：本文档基于 `scripts/test-upstream.js` 测试脚本的实际运行结果编写。如上游 API 有变更，请重新运行测试脚本并更新本文档。