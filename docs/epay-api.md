# 易支付 API 文档

> 聚合支付平台 V2 接口文档

---

## 目录

- [1. 概述](#1-概述)
- [2. 接入准备](#2-接入准备)
- [3. 签名机制](#3-签名机制)
- [4. 支付方式列表](#4-支付方式列表)
- [5. 支付相关接口](#5-支付相关接口)
  - [5.1 页面跳转支付](#51-页面跳转支付)
  - [5.2 统一下单接口](#52-统一下单接口)
  - [5.3 订单查询](#53-订单查询)
  - [5.4 支付结果通知](#54-支付结果通知)
  - [5.5 订单退款](#55-订单退款)
  - [5.6 订单退款查询](#56-订单退款查询)
  - [5.7 关闭订单](#57-关闭订单)
- [6. 商户相关接口](#6-商户相关接口)
  - [6.1 查询商户信息](#61-查询商户信息)
  - [6.2 查询订单列表](#62-查询订单列表)
- [7. 代付相关接口](#7-代付相关接口)
  - [7.1 转账发起](#71-转账发起)
  - [7.2 转账查询](#72-转账查询)
  - [7.3 可用余额查询](#73-可用余额查询)
- [8. 状态码与枚举值](#8-状态码与枚举值)
- [9. 错误处理](#9-错误处理)
- [10. SDK下载](#10-sdk下载)
- [11. TypeScript 类型定义](#11-typescript-类型定义)

---

## 1. 概述

### 1.1 平台简介

易支付是一个聚合支付平台，支持多种支付方式，包括支付宝、微信支付、QQ钱包、USDT等。本文档描述V2版本API接口规范。

### 1.2 API基础地址

```
http://epay.instacode.cfd
```

### 1.3 协议规范

| 项目 | 说明 |
|------|------|
| 提交数据格式 | `application/x-www-form-urlencoded` |
| 返回数据格式 | `JSON` |
| 字符编码 | `UTF-8` |
| 签名算法 | `SHA256WithRSA` |

### 1.4 V2升级说明

| 版本 | 签名算法 | 接口地址 | 特性 |
|------|----------|----------|------|
| V1 | MD5 | submit.php, mapi.php | 基础支付 |
| V2 | SHA256WithRSA | /api/* | 支持退款、代付，新增timestamp校验 |

---

## 2. 接入准备

### 2.1 获取RSA密钥对

1. 登录商户后台
2. 进入 **个人资料 -> API信息** 页面
3. 点击 **【生成商户RSA密钥对】**
4. 保存以下密钥：
   - **商户私钥 (Private Key)**：用于签名请求，需妥善保管，不可泄露
   - **平台公钥 (Public Key)**：用于验签返回数据

### 2.2 密钥使用场景

| 密钥类型 | 用途 |
|----------|------|
| 商户私钥 | 对发起的请求进行签名 |
| 平台公钥 | 对返回数据和异步通知进行验签 |

---

## 3. 签名机制

### 3.1 签名算法

采用 `SHA256WithRSA` 算法进行签名和验签。

### 3.2 签名步骤（请求签名）

1. 获取请求报文所有**非空**请求参数
   - 不包括数组、字节类型参数（如文件、字节流）
   - 剔除 `sign` 和 `sign_type` 字段
   
2. 按照键值ASCII码递增排序（字母升序排序）
   - 相同字符则按第二个字符ASCII码排序，以此类推

3. 将排序后的参数组合成 `参数=参数值` 格式，用 `&` 连接

4. 使用**商户私钥**对拼接字符串计算RSA签名（SHA256WithRSA）

**示例：**

```
原始参数: pid=1001&type=alipay&money=1.00&timestamp=1721206072
排序后: money=1.00&pid=1001×tamp=1721206072&type=alipay
签名结果: [RSA签名后的字符串]
```

### 3.3 验签步骤（响应验签）

1. 按照签名步骤1-2获取待签名字符串

2. 使用**平台公钥**，对返回的sign进行RSA验签（SHA256WithRSA）

### 3.4 注意事项

- 商户私钥需妥善保管，避免遗失或泄露
- 平台公钥用于验签返回数据和异步通知
- 验签时必须支持增加的扩展字段

---

## 4. 支付方式列表

| 调用值 | 描述 |
|--------|------|
| `alipay` | 支付宝 |
| `wxpay` | 微信支付 |
| `qqpay` | QQ钱包 |
| `usdt.trc20` | Bepusdt (USDT TRC20) |

---

## 5. 支付相关接口

### 5.1 页面跳转支付

> 适用于用户前台直接发起支付，使用form表单跳转或拼接成URL跳转。

#### 请求地址

```
POST/GET http://epay.instacode.cfd/api/pay/submit
```

> 推荐使用POST，不容易被劫持

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 支付方式 | type | 是 | String | alipay | [支付方式列表](#4-支付方式列表)，不传则跳转收银台 |
| 商户订单号 | out_trade_no | 是 | String | 20160806151343349 | 商户订单号 |
| 异步通知地址 | notify_url | 是 | String | http://www.pay.com/notify_url.php | 服务器异步通知地址 |
| 跳转通知地址 | return_url | 是 | String | http://www.pay.com/return_url.php | 页面跳转通知地址 |
| 商品名称 | name | 是 | String | VIP会员 | 如超过127个字节会自动截取 |
| 商品金额 | money | 是 | String | 1.00 | 单位：元，最大2位小数 |
| 业务扩展参数 | param | 否 | String | | 没有请留空，支付后原样返回 |
| 自定义通道ID | channel_id | 否 | Int | | 对应进件商户列表的ID，未进件请勿传 |
| 买家身份证号 | cert_no | 否 | String | | 可限制指定买家，仅支持支付宝官方接口 |
| 买家真实姓名 | cert_name | 否 | String | | 可限制指定买家，仅支持支付宝官方接口 |
| 买家最小年龄 | min_age | 否 | Int | | 可限制买家年龄，仅支持支付宝官方接口 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 响应说明

成功调用后，页面将跳转到支付页面，用户完成支付后会通知 `notify_url` 和 `return_url`。

---

### 5.2 统一下单接口

> 适用于服务器后端发起支付请求，会返回支付二维码链接、支付跳转URL等。

#### 请求地址

```
POST http://epay.instacode.cfd/api/pay/create
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 接口类型 | method | 是 | String | web | [接口类型列表](#接口类型列表) |
| 设备类型 | device | 否 | String | pc | [设备类型列表](#设备类型列表)，仅通用网页支付需要 |
| 支付方式 | type | 是 | String | alipay | [支付方式列表](#4-支付方式列表) |
| 商户订单号 | out_trade_no | 是 | String | 20160806151343349 | 商户订单号 |
| 异步通知地址 | notify_url | 是 | String | http://www.pay.com/notify_url.php | 服务器异步通知地址 |
| 跳转通知地址 | return_url | 是 | String | http://www.pay.com/return_url.php | 页面跳转通知地址 |
| 商品名称 | name | 是 | String | VIP会员 | 如超过127个字节会自动截取 |
| 商品金额 | money | 是 | String | 1.00 | 单位：元，最大2位小数 |
| 用户IP地址 | clientip | 是 | String | 192.168.1.100 | 用户发起支付的IP地址 |
| 业务扩展参数 | param | 否 | String | | 没有请留空，支付后原样返回 |
| 被扫支付授权码 | auth_code | 否 | String | | 仅被扫支付需要传 |
| 用户Openid | sub_openid | 否 | String | | 仅JSAPI支付需要传 |
| 公众号AppId | sub_appid | 否 | String | | 仅JSAPI支付需要传 |
| 自定义通道ID | channel_id | 否 | Int | | 对应进件商户列表的ID |
| 买家身份证号 | cert_no | 否 | String | | 可限制指定买家 |
| 买家真实姓名 | cert_name | 否 | String | | 可限制指定买家 |
| 买家最小年龄 | min_age | 否 | Int | | 可限制买家年龄 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 接口类型列表

| 调用值 | 描述 |
|--------|------|
| `web` | 通用网页支付（会根据device判断，自动返回跳转url/二维码/小程序跳转url等） |
| `jump` | 跳转支付（仅会返回跳转url） |
| `jsapi` | JSAPI支付（小程序内支付使用，需传入sub_openid和sub_appid） |
| `app` | APP支付（iOS/安卓APP内支付使用） |
| `scan` | 付款码支付（需传入auth_code参数，支付成功后返回订单信息） |
| `applet` | 小程序支付（返回微信小程序插件参数或跳转小程序参数） |

#### 设备类型列表

| 调用值 | 描述 |
|--------|------|
| `pc` | 电脑浏览器（默认） |
| `mobile` | 手机浏览器 |
| `qq` | 手机QQ内浏览器 |
| `wechat` | 微信内浏览器 |
| `alipay` | 支付宝客户端 |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 错误信息 | msg | String | | 失败时返回原因 |
| 平台订单号 | trade_no | String | 20160806151343349 | 平台内部的订单号 |
| 发起支付类型 | pay_type | String | jump | [发起支付类型说明](#发起支付类型说明) |
| 发起支付参数 | pay_info | String | weixin://wxpay/bizpayurl?pr=04IPMKM | 根据不同的发起支付类型，返回内容也不一样 |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 发起支付类型说明

| 类型 | 描述 |
|------|------|
| `jump` | 返回支付跳转url |
| `html` | 返回html代码，用于支付跳转 |
| `qrcode` | 返回支付二维码 |
| `urlscheme` | 返回微信/支付宝小程序跳转url scheme |
| `jsapi` | 返回用于发起JSAPI支付的参数 |
| `app` | 返回用于发起APP支付的参数 |
| `scan` | 付款码支付成功，返回支付订单信息 |
| `wxplugin` | 返回要拉起的微信小程序插件参数 |
| `wxapp` | 返回要拉起的微信小程序和路径 |

#### 返回示例

**二维码支付：**
```json
{
  "code": 0,
  "trade_no": "20160806151343349",
  "pay_type": "qrcode",
  "pay_info": "weixin://wxpay/bizpayurl?pr=04IPMKM",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

**JSAPI支付：**
```json
{
  "code": 0,
  "trade_no": "20160806151343351",
  "pay_type": "jsapi",
  "pay_info": "{\"appId\":\"wx2421b1c4370ec43b\",\"timeStamp\":\"1395712654\",\"nonceStr\":\"e61463f8efa94090b1f366cccfbbb444\",\"package\":\"prepay_id=up_wx21201855730335ac86f8c43d1889123400\",\"signType\":\"RSA\",\"paySign\":\"oR9d8PuhnIc+YZ8cBHFCwfgpaK9gd7vaRvkYD7rthRAZ\"}",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

**付款码支付：**
```json
{
  "code": 0,
  "trade_no": "2024072320222180092",
  "pay_type": "scan",
  "pay_info": "{\"type\":\"wxpay\",\"trade_no\":\"2024072320222180092\",\"api_trade_no\":\"4200002345202407238253501450\",\"buyer\":\"o9uAcc6VlZxhcujpKIqQuWWoDQc\",\"money\":\"1.00\"}",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

**微信小程序插件支付：**
```json
{
  "code": 0,
  "trade_no": "2024072320222180018",
  "pay_type": "wxplugin",
  "pay_info": "{\"appId\":\"wxc237fd59fbb634ae\",\"supplierId\":\"123456\",\"shopId\":\"123456\",\"orderId\":\"2024072320222180092\"}",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

**APP拉起微信小程序：**
```json
{
  "code": 0,
  "trade_no": "2024072320222180018",
  "pay_type": "wxapp",
  "pay_info": "{\"appId\":\"wxbb48bac536053072\",\"miniProgramId\":\"gh_bf9cd8cf50b5\",\"path\":\"pages/fromAppPay/index?orderid=123456\",\"extraData\":\"\"}",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

#### 其他说明

- 代码中需根据接口返回的 `pay_type` 值来展示具体的支付页面
- 如果不懂怎么展示支付页面，可在 `method` 传入 `jump`，这样 `pay_type` 就只会返回 `jump`
- 付款码支付可不传支付类型 `type` 字段，会根据 `auth_code` 的数字自动判断支付类型
- APP拉起微信小程序可参考[微信官方文档](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Launching_a_Mini_Program/Launching_a_Mini_Program.html)

---

### 5.3 订单查询

#### 请求地址

```
POST http://epay.instacode.cfd/api/pay/query
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 平台订单号 | trade_no | 特殊 | String | 20160806151343349 | 与商户订单号必传其一 |
| 商户订单号 | out_trade_no | 特殊 | String | 20160806151343351 | 与平台订单号必传其一 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 错误信息 | msg | String | | 失败时返回原因 |
| 平台订单号 | trade_no | String | 20160806151343349 | |
| 商户订单号 | out_trade_no | String | 20160806151343351 | |
| 接口订单号 | api_trade_no | String | 40001249985198893 | 微信支付宝返回的单号 |
| 支付方式 | type | String | alipay | [支付方式列表](#4-支付方式列表) |
| 支付状态 | status | Int | 1 | [支付状态列表](#支付状态列表) |
| 商户ID | pid | Int | 1001 | |
| 订单创建时间 | addtime | String | 2024-07-01 16:47:32 | |
| 订单完成时间 | endtime | String | 2024-07-01 16:49:24 | 仅完成才返回 |
| 商品名称 | name | String | | |
| 商品金额 | money | String | 1.00 | |
| 已退款金额 | refundmoney | String | | 仅部分退款情况才返回 |
| 业务扩展参数 | param | String | | |
| 支付用户标识 | buyer | String | | 一般为openid |
| 支付用户IP | clientip | String | | |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 支付状态列表

| 状态值 | 描述 |
|--------|------|
| 0 | 未支付 |
| 1 | 已支付 |
| 2 | 已退款 |
| 3 | 已冻结 |
| 4 | 预授权 |

---

### 5.4 支付结果通知

#### 通知类型

- **服务器异步通知**：`notify_url`
- **页面跳转通知**：`return_url`

#### 请求方式

```
GET
```

#### 通知参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 商户ID | pid | Int | 1001 | |
| 平台订单号 | trade_no | String | 20160806151343349 | |
| 商户订单号 | out_trade_no | String | 20160806151343351 | |
| 接口订单号 | api_trade_no | String | 40001249985198893 | 微信支付宝返回的单号 |
| 支付方式 | type | String | alipay | [支付方式列表](#4-支付方式列表) |
| 交易状态 | trade_status | String | TRADE_SUCCESS | 固定为TRADE_SUCCESS |
| 订单创建时间 | addtime | String | 2024-07-01 16:47:32 | |
| 订单完成时间 | endtime | String | 2024-07-01 16:49:24 | 仅完成才返回 |
| 商品名称 | name | String | | |
| 商品金额 | money | String | 1.00 | |
| 业务扩展参数 | param | String | | |
| 支付用户标识 | buyer | String | | 一般为openid |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 返回内容说明

收到异步通知后，需返回 `success` 以表示服务器接收到了订单通知。

#### 验签流程

1. 对返回参数进行签名验证
2. 判断 `trade_status` 是否等于 `TRADE_SUCCESS`
3. 处理业务逻辑
4. 返回 `success`

#### 注意事项

- 商户系统代码内务必对返回的签名 `sign` 进行校验
- 必须判断 `trade_status` 的值是否等于 `TRADE_SUCCESS`
- 支付平台可能会增加回调字段，验证签名时必须支持增加的扩展字段

---

### 5.5 订单退款

> 需要先在商户后台开启订单退款API接口开关，才能调用该接口发起订单退款。

#### 请求地址

```
POST http://epay.instacode.cfd/api/pay/refund
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 平台订单号 | trade_no | 特殊 | String | 20160806151343349 | 与商户订单号必传其一 |
| 商户订单号 | out_trade_no | 特殊 | String | 20160806151343351 | 与平台订单号必传其一 |
| 退款金额 | money | 是 | String | 1.00 | 单位：元 |
| 商户退款单号 | out_refund_no | 否 | String | 20160806151343391 | 可避免出现重复请求退款 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 失败或成功时返回提示 |
| 平台退款单号 | refund_no | String | 20160806151343349 | |
| 商户退款单号 | out_refund_no | String | 20160806151343351 | |
| 平台订单号 | trade_no | String | 20160806151343349 | |
| 退款金额 | money | String | | |
| 扣减商户余额 | reducemoney | String | | |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 注意事项

- 少数插件对接的第三方平台不支持部分金额退款

---

### 5.6 订单退款查询

#### 请求地址

```
POST http://epay.instacode.cfd/api/pay/refundquery
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 平台退款单号 | refund_no | 特殊 | String | 20160806151343349 | 与商户退款单号必传其一 |
| 商户退款单号 | out_refund_no | 特殊 | String | 20160806151343351 | 与平台退款单号必传其一 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 错误信息 | msg | String | | 失败时返回提示 |
| 平台退款单号 | refund_no | String | 20160806151343349 | |
| 商户退款单号 | out_refund_no | String | 20160806151343351 | |
| 平台订单号 | trade_no | String | 20160806151343349 | |
| 商户订单号 | out_trade_no | String | 20160806151343351 | |
| 退款金额 | money | String | | |
| 扣减商户余额 | reducemoney | String | | |
| 退款状态 | status | Int | 1 | 0：失败，1：成功 |
| 退款时间 | addtime | String | 2024-07-01 16:47:32 | |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

---

### 5.7 关闭订单

#### 请求地址

```
POST http://epay.instacode.cfd/api/pay/close
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 平台订单号 | trade_no | 特殊 | String | 20160806151343349 | 与商户订单号必传其一 |
| 商户订单号 | out_trade_no | 特殊 | String | 20160806151343351 | 与平台订单号必传其一 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 失败或成功时返回提示 |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 注意事项

- 只有部分支付插件支持关闭订单操作

---

## 6. 商户相关接口

### 6.1 查询商户信息

#### 请求地址

```
POST http://epay.instacode.cfd/api/merchant/info
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 失败或成功时返回提示 |
| 商户ID | pid | Int | 1001 | |
| 商户状态 | status | Int | 1 | 0：已封禁，1：正常，2：待审核 |
| 支付状态 | pay_status | Int | 1 | 0：关闭，1：开启 |
| 结算状态 | settle_status | Int | 1 | 0：关闭，1：开启 |
| 商户余额 | money | String | 50.00 | 单位：元 |
| 结算方式 | settle_type | Int | 1 | [结算方式列表](#结算方式列表) |
| 结算账户 | settle_account | String | alipay@alipay.com | |
| 结算账户姓名 | settle_name | String | 张三 | |
| 订单总数量 | order_num | Int | 10 | |
| 今日订单数量 | order_num_today | Int | 3 | |
| 昨日订单数量 | order_num_lastday | Int | 2 | |
| 今日订单收入 | order_money_today | String | 45.00 | 单位：元 |
| 昨日订单收入 | order_money_lastday | String | 35.00 | 单位：元 |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 结算方式列表

| 状态值 | 描述 |
|--------|------|
| 1 | 支付宝 |
| 2 | 微信 |
| 3 | QQ钱包 |
| 4 | 银行卡 |

---

### 6.2 查询订单列表

> 查询订单列表可用于对账或同步订单状态等。

#### 请求地址

```
POST http://epay.instacode.cfd/api/merchant/orders
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 查询偏移 | offset | 是 | Int | 0 | 从0开始 |
| 每页条数 | limit | 是 | Int | 50 | 最大不能超过50 |
| 过滤订单状态 | status | 否 | Int | 1 | 0：未支付，1：已支付 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 失败或成功时返回提示 |
| 订单列表 | data | Array | | 具体参数可参考[订单查询](#53-订单查询) |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

---

## 7. 代付相关接口

### 7.1 转账发起

> 平台需开通代付功能，且在商户后台开启代付API接口开关，才能调用本接口发起转账。

#### 请求地址

```
POST http://epay.instacode.cfd/api/transfer/submit
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 转账方式 | type | 是 | String | alipay | [转账方式列表](#转账方式列表) |
| 收款方账号 | account | 是 | String | alipay@alipay.com | 支付宝账号/微信OpenId/银行卡号 |
| 收款方姓名 | name | 否 | String | 张三 | 选填，传入则校验账号与该姓名是否匹配 |
| 转账金额 | money | 是 | String | 1.00 | 单位：元 |
| 转账备注 | remark | 否 | String | | 选填 |
| 转账交易号 | out_biz_no | 否 | String | 2016080615134334917 | 传入后可避免出现重复请求转账 |
| 安全发账本ID | bookid | 否 | String | | 仅支付宝安全发转账可以传入 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 转账方式列表

| 状态值 | 描述 |
|--------|------|
| `alipay` | 支付宝 |
| `wxpay` | 微信支付 |
| `qqpay` | QQ钱包 |
| `bank` | 银行卡 |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 错误信息 | msg | String | | 失败时返回转账失败原因 |
| 转账状态 | status | Int | 1 | 0：正在处理，1：转账成功 |
| 系统交易号 | biz_no | String | 2016080615134334917 | |
| 商户交易号 | out_biz_no | String | 2016080615134334917 | 可用于后续转账查询 |
| 接口转账单号 | orderid | String | 40001283951815782 | 支付宝微信返回的转账单号 |
| 转账完成时间 | paydate | String | 2024-07-01 16:47:32 | |
| 转账花费金额 | cost_money | String | | 从商户可用余额扣减的金额 |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

#### 注意事项

- 如果返回的转账状态 `status=0`，则需稍后调用转账查询接口查询转账状态

---

### 7.2 转账查询

#### 请求地址

```
POST http://epay.instacode.cfd/api/transfer/query
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 系统交易号 | biz_no | 特殊 | String | 2016080615134334919 | 与商户交易号必传其一 |
| 商户交易号 | out_biz_no | 特殊 | String | 2016080615134334919 | 与系统交易号必传其一 |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 成功或失败时返回提示 |
| 转账状态 | status | Int | 1 | 0：正在处理，1：转账成功，2：转账失败 |
| 转账失败原因 | errmsg | String | 收款方账户异常 | status=2 时才返回 |
| 系统交易号 | biz_no | String | 2016080615134334917 | |
| 商户交易号 | out_biz_no | String | 2016080615134334917 | |
| 接口转账单号 | orderid | String | 40001283951815782 | 支付宝微信返回的转账单号 |
| 转账完成时间 | paydate | String | 2024-07-01 16:47:32 | |
| 转账金额 | amount | String | | 单位：元 |
| 转账花费金额 | cost_money | String | | 从商户可用余额扣减的金额 |
| 转账备注 | remark | String | | |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

---

### 7.3 可用余额查询

#### 请求地址

```
POST http://epay.instacode.cfd/api/transfer/balance
```

#### 请求参数

| 字段名 | 变量名 | 必填 | 类型 | 示例值 | 描述 |
|--------|--------|------|------|--------|------|
| 商户ID | pid | 是 | Int | 1001 | 商户ID |
| 当前时间戳 | timestamp | 是 | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | 是 | String | | 参考签名规则 |
| 签名类型 | sign_type | 是 | String | RSA | 默认为RSA |

#### 返回参数

| 字段名 | 变量名 | 类型 | 示例值 | 描述 |
|--------|--------|------|--------|------|
| 返回状态码 | code | Int | 0 | 0为成功，其它值为失败 |
| 返回信息 | msg | String | | 成功或失败时返回提示 |
| 商户可用余额 | available_money | String | 1.00 | 单位：元 |
| 转账手续费率 | transfer_rate | String | 3 | 单位：% |
| 当前时间戳 | timestamp | String | 1721206072 | 10位整数，单位秒 |
| 签名字符串 | sign | String | | 参考签名规则 |
| 签名类型 | sign_type | String | RSA | 默认为RSA |

---

## 8. 状态码与枚举值

### 8.1 返回状态码

| 状态码 | 描述 |
|--------|------|
| 0 | 成功 |
| 非0 | 失败 |

### 8.2 支付状态

| 状态值 | 描述 |
|--------|------|
| 0 | 未支付 |
| 1 | 已支付 |
| 2 | 已退款 |
| 3 | 已冻结 |
| 4 | 预授权 |

### 8.3 商户状态

| 状态值 | 描述 |
|--------|------|
| 0 | 已封禁 |
| 1 | 正常 |
| 2 | 待审核 |

### 8.4 结算方式

| 状态值 | 描述 |
|--------|------|
| 1 | 支付宝 |
| 2 | 微信 |
| 3 | QQ钱包 |
| 4 | 银行卡 |

### 8.5 转账状态

| 状态值 | 描述 |
|--------|------|
| 0 | 正在处理 |
| 1 | 转账成功 |
| 2 | 转账失败 |

### 8.6 退款状态

| 状态值 | 描述 |
|--------|------|
| 0 | 失败 |
| 1 | 成功 |

---

## 9. 错误处理

### 9.1 常见错误码

| 错误场景 | 处理方式 |
|----------|----------|
| 签名验证失败 | 检查签名算法和密钥是否正确 |
| 商户不存在 | 检查pid是否正确 |
| 订单不存在 | 检查订单号是否正确 |
| 余额不足 | 检查商户余额是否充足 |
| 订单已支付 | 避免重复处理 |

### 9.2 错误响应格式

```json
{
  "code": 1,
  "msg": "错误原因描述",
  "timestamp": "1721206072",
  "sign": "...",
  "sign_type": "RSA"
}
```

---

## 10. SDK下载

### PHP-SDK

- **版本**：V2.0
- **下载地址**：[SDK.zip](/assets/files/SDK_2.0.zip)

---

## 11. TypeScript 类型定义

> 以下类型定义适配 SimpleFaka 项目，可用于 Cloudflare Workers 环境。

```typescript
// ============================================================
// 易支付 API 类型定义
// ============================================================

/**
 * 支付方式
 */
export type EPayType = 'alipay' | 'wxpay' | 'qqpay' | 'usdt.trc20';

/**
 * 接口类型
 */
export type EPayMethod = 'web' | 'jump' | 'jsapi' | 'app' | 'scan' | 'applet';

/**
 * 设备类型
 */
export type EPayDevice = 'pc' | 'mobile' | 'qq' | 'wechat' | 'alipay';

/**
 * 支付状态
 */
export type EPayStatus = 0 | 1 | 2 | 3 | 4;

/**
 * 发起支付类型
 */
export type EPayPayType = 'jump' | 'html' | 'qrcode' | 'urlscheme' | 'jsapi' | 'app' | 'scan' | 'wxplugin' | 'wxapp';

/**
 * 转账方式
 */
export type EPayTransferType = 'alipay' | 'wxpay' | 'qqpay' | 'bank';

/**
 * 转账状态
 */
export type EPayTransferStatus = 0 | 1 | 2;

/**
 * 结算方式
 */
export type EPaySettleType = 1 | 2 | 3 | 4;

/**
 * 商户状态
 */
export type EPayMerchantStatus = 0 | 1 | 2;

/**
 * 基础请求参数
 */
export interface EPayBaseRequest {
  pid: number;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 页面跳转支付请求参数
 */
export interface EPaySubmitRequest extends EPayBaseRequest {
  type: EPayType;
  out_trade_no: string;
  notify_url: string;
  return_url: string;
  name: string;
  money: string;
  param?: string;
  channel_id?: number;
  cert_no?: string;
  cert_name?: string;
  min_age?: number;
}

/**
 * 统一下单请求参数
 */
export interface EPayCreateRequest extends EPayBaseRequest {
  method: EPayMethod;
  device?: EPayDevice;
  type: EPayType;
  out_trade_no: string;
  notify_url: string;
  return_url: string;
  name: string;
  money: string;
  clientip: string;
  param?: string;
  auth_code?: string;
  sub_openid?: string;
  sub_appid?: string;
  channel_id?: number;
  cert_no?: string;
  cert_name?: string;
  min_age?: number;
}

/**
 * 统一下单响应
 */
export interface EPayCreateResponse {
  code: number;
  msg?: string;
  trade_no: string;
  pay_type: EPayPayType;
  pay_info: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 订单查询请求参数
 */
export interface EPayQueryRequest extends EPayBaseRequest {
  trade_no?: string;
  out_trade_no?: string;
}

/**
 * 订单信息
 */
export interface EPayOrderInfo {
  trade_no: string;
  out_trade_no: string;
  api_trade_no?: string;
  type: EPayType;
  status: EPayStatus;
  pid: number;
  addtime: string;
  endtime?: string;
  name: string;
  money: string;
  refundmoney?: string;
  param?: string;
  buyer?: string;
  clientip?: string;
}

/**
 * 订单查询响应
 */
export interface EPayQueryResponse extends EPayOrderInfo {
  code: number;
  msg?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 支付回调通知参数
 */
export interface EPayNotifyParams {
  pid: number;
  trade_no: string;
  out_trade_no: string;
  api_trade_no?: string;
  type: EPayType;
  trade_status: 'TRADE_SUCCESS';
  addtime: string;
  endtime?: string;
  name: string;
  money: string;
  param?: string;
  buyer?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 订单退款请求参数
 */
export interface EPayRefundRequest extends EPayBaseRequest {
  trade_no?: string;
  out_trade_no?: string;
  money: string;
  out_refund_no?: string;
}

/**
 * 订单退款响应
 */
export interface EPayRefundResponse {
  code: number;
  msg?: string;
  refund_no: string;
  out_refund_no?: string;
  trade_no: string;
  money: string;
  reducemoney?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 订单退款查询请求参数
 */
export interface EPayRefundQueryRequest extends EPayBaseRequest {
  refund_no?: string;
  out_refund_no?: string;
}

/**
 * 订单退款查询响应
 */
export interface EPayRefundQueryResponse {
  code: number;
  msg?: string;
  refund_no: string;
  out_refund_no?: string;
  trade_no: string;
  out_trade_no: string;
  money: string;
  reducemoney?: string;
  status: 0 | 1;
  addtime: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 关闭订单请求参数
 */
export interface EPayCloseRequest extends EPayBaseRequest {
  trade_no?: string;
  out_trade_no?: string;
}

/**
 * 关闭订单响应
 */
export interface EPayCloseResponse {
  code: number;
  msg?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 查询商户信息响应
 */
export interface EPayMerchantInfoResponse {
  code: number;
  msg?: string;
  pid: number;
  status: EPayMerchantStatus;
  pay_status: 0 | 1;
  settle_status: 0 | 1;
  money: string;
  settle_type: EPaySettleType;
  settle_account: string;
  settle_name?: string;
  order_num: number;
  order_num_today: number;
  order_num_lastday: number;
  order_money_today: string;
  order_money_lastday: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 查询订单列表请求参数
 */
export interface EPayMerchantOrdersRequest extends EPayBaseRequest {
  offset: number;
  limit: number;
  status?: 0 | 1;
}

/**
 * 查询订单列表响应
 */
export interface EPayMerchantOrdersResponse {
  code: number;
  msg?: string;
  data: EPayOrderInfo[];
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 转账发起请求参数
 */
export interface EPayTransferSubmitRequest extends EPayBaseRequest {
  type: EPayTransferType;
  account: string;
  name?: string;
  money: string;
  remark?: string;
  out_biz_no?: string;
  bookid?: string;
}

/**
 * 转账发起响应
 */
export interface EPayTransferSubmitResponse {
  code: number;
  msg?: string;
  status: 0 | 1;
  biz_no: string;
  out_biz_no?: string;
  orderid?: string;
  paydate?: string;
  cost_money?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 转账查询请求参数
 */
export interface EPayTransferQueryRequest extends EPayBaseRequest {
  biz_no?: string;
  out_biz_no?: string;
}

/**
 * 转账查询响应
 */
export interface EPayTransferQueryResponse {
  code: number;
  msg?: string;
  status: EPayTransferStatus;
  errmsg?: string;
  biz_no: string;
  out_biz_no?: string;
  orderid?: string;
  paydate?: string;
  amount?: string;
  cost_money?: string;
  remark?: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}

/**
 * 可用余额查询响应
 */
export interface EPayTransferBalanceResponse {
  code: number;
  msg?: string;
  available_money: string;
  transfer_rate: string;
  timestamp: string;
  sign: string;
  sign_type: 'RSA';
}
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| V2.0 | 2024 | 全面使用RSA签名算法，新增退款、代付等功能 |

---

> 文档来源：http://epay.instacode.cfd/doc/index.html
>
> 整理日期：2026-03-03