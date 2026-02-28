#!/bin/bash

# Telegram 菜单按钮设置脚本

API_URL="${1:-http://localhost:8787}"
SHOP_URL="${2:-http://localhost:8787/purchase}"

echo "🔧 设置 Telegram 菜单按钮..."
echo "API URL: $API_URL"
echo "商城 URL: $SHOP_URL"

curl -X GET "$API_URL/api/telegram/menu/set" \
  -H "Content-Type: application/json" \
  -w "\n"

echo "✅ 菜单按钮设置完成！"
