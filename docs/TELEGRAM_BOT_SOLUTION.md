# SimpleFaka Telegram Bot 完整方案

> 版本：v1.0  
> 日期：2026-03-13  
> 状态：设计方案

## 📋 目录

1. [项目概述](#项目概述)
2. [用户操作流程](#用户操作流程)
3. [功能模块设计](#功能模块设计)
4. [技术架构](#技术架构)
5. [实施计划](#实施计划)

---

## 🎯 项目概述

### 项目目标
构建一个功能完整的 Telegram Bot，为用户提供便捷的虚拟手机号码接码服务，包括商品浏览、订单管理、实时接码等核心功能。

### 核心价值
- **便捷性**：用户无需离开 Telegram 即可完成购买和接码
- **实时性**：验证码实时推送，无需手动刷新
- **易用性**：简单的命令交互，清晰的操作流程
- **集成性**：Bot + Mini App 双模式，满足不同使用场景

### 目标用户
- 需要临时手机号码接收验证码的用户
- 注重隐私保护的用户
- 频繁使用 Telegram 的用户

---

## 📊 用户操作流程

### 1. 整体流程图

```mermaid
graph TD
    Start([用户启动 Bot]) --> Welcome[/start欢迎页面]
    Welcome --> Choice{选择操作}
    Choice -->|查看商品| Products[/products 商品列表]
    Choice -->|查看订单| Orders[/orders 我的订单]
    Choice -->|接码终端| Receive[/receive 接码入口]
    Choice -->|打开商城| MiniApp[Mini App 商城]
    Choice -->|帮助信息| Help[/help 帮助]
    
    Products --> ProductDetail[查看商品详情]
    ProductDetail --> MiniApp
    
    Orders --> OrderDetail[查看订单详情]
    OrderDetail --> OrderAction{订单操作}
    OrderAction -->|查看卡密| ShowCard[显示卡密信息]
    OrderAction -->|接收验证码| Receive
    
    MiniApp --> Purchase[选择商品购买]
    Purchase --> Payment[支付订单]
    Payment --> PaySuccess{支付成功?}
    PaySuccess -->|是| Notify[Bot 推送通知]
    PaySuccess -->|否| PayFail[支付失败提示]
    Notify --> Orders
    
    Receive --> InputOrder[输入订单号]
    InputOrder --> Validate{验证订单}
    Validate -->|有效| StartPoll[开始轮询]
    Validate -->|无效| ErrorMsg[错误提示]
    ErrorMsg --> Receive
    
    StartPoll --> Polling[每5秒轮询]
    Polling --> CheckSMS{收到短信?}
    CheckSMS -->|是| ShowSMS[显示验证码]
    CheckSMS -->|否| CheckTimeout{超时?}
    CheckTimeout -->|否| Polling
    CheckTimeout -->|是| Timeout[超时提示]
    
    ShowSMS --> End([结束])
    Timeout --> End
    ShowCard --> End
    Help --> Welcome
    
    style Start fill:#e1f5e1
    style End fill:#ffe1e1
    style MiniApp fill:#e1e5ff
    style Receive fill:#fff5e1
    style ShowSMS fill:#e1ffe1
```

### 2. 接码流程详细图

```mermaid
sequenceDiagram
    participant U as 用户
    participant B as Telegram Bot
    participant S as 接码服务
    participant API as 上游API
    
    U->>B: /receive
    B->>U: 请输入订单号
    U->>B: 输入订单号
    
    B->>S: 验证订单号
    alt 订单有效
        S->>B: 验证通过
        B->>U: ⏳ 开始监听...loop 每5秒轮询(最多60次)
            B->>API