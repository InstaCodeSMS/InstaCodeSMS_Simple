# Telegram Bot + Mini App 快速开始指南

## 🚀 快速部署（5步完成）

### 步骤 1：运行数据库迁移

在 Supabase Dashboard 中执行：

```sql
-- 复制并执行 supabase/migrations/20260314_telegram_tables.sql 的内容
```

或使用 Supabase CLI：

```bash
supabase db push
```

### 步骤 2：配置环境变量

在 `.env` 或Cloudflare Workers 环境变量中添加：

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
SHOP_URL=https://your-domain.com/purchase

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 步骤 3：设置 Telegram Webhook

```bash
curl -X POST https://your-domain.com/api/telegram/webhook/set \
  -H "x-admin-token: YOUR_ADMIN_SECRET"
```

### 步骤 4：设置 Mini App 菜单按钮

```bash
curl -X POST https://your-domain.com/api/telegram/webhook/set \
  -H "x-admin-token: YOUR_ADMIN_SECRET"
```

### 步骤 5：测试功能

1. 在 Telegram 中找到你的 Bot
2. 发送 `/start` 命令
3. 点击 "🛍️ 商城" 按钮测试 Mini App
4. 发送 `/orders` 查看订单
5. 发送 `/receive` 测试接码功能

##✅ 验证清单

- [ ] 数据库表已创建
- [ ] 环境变量已配置
- [ ] Webhook已设置
- [ ] Bot 可以响应命令
- [ ] Mini App 可以打开
- [ ] 用户信息正确存储

## 🔧 故障排查

### Bot 不响应

1. 检查 `TELEGRAM_BOT_TOKEN` 是否正确
2. 检查 Webhook 是否设置成功
3. 查看 Cloudflare Workers 日志

### Mini App 打不开

1. 检查 `SHOP_URL` 是否正确
2. 确认域名 HTTPS 证书有效
3. 检查路由是否正确配置

### 数据库错误

1. 确认迁移已执行
2. 检查 `SUPABASE_SERVICE_KEY` 权限
3. 查看 Supabase 日志

## 📚 下一步

1. **完善 API 端点** - 实现产品列表、购物车 API
2. **集成支付** - 添加支付网关
3. **测试优化** - 编写测试用例
4. **性能优化** - 添加缓存和索引

## 💡 提示

- 先在测试环境验证所有功能
- 定期备份数据库
- 监控 Bot 的响应时间和错误率
- 收集用户反馈持续改进

---

**需要帮助？** 查看 `TELEGRAM_FINAL_SUMMARY.md` 了解详细信息