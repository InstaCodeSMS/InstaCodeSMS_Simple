/**
 * Telegram Mini App 成功页面
 * 支付成功提示
 */

export default function TelegramMiniAppSuccess(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>支付成功 - SimpleFaka</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="tg-safe-area flex flex-col items-center justify-center min-h-screen px-4">
    <!-- 成功图标 -->
    <div class="text-6xl mb-4">✅</div>

    <!-- 成功消息 -->
    <h1 class="text-2xl font-bold mb-2">支付成功！</h1>
    <p class="text-gray-600 text-center mb-6">
      订单已创建，请返回 Bot 查看卡密信息
    </p>

    <!-- 订单信息 -->
    <div class="bg-white rounded-lg p-4 w-full mb-6 max-w-sm">
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-600">订单号</span>
          <span class="font-semibold font-mono text-sm" id="orderId">-</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">支付金额</span>
          <span class="font-semibold" id="amount">-</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">支付时间</span>
          <span class="font-semibold text-sm" id="payTime">-</span>
        </div>
      </div>
    </div>

    <!-- 按钮 -->
    <button
      onclick="closeApp()"
      class="w-full max-w-sm bg-blue-500 text-white py-3 rounded-lg font-semibold"
    >
      返回 Bot
    </button>
  </div>

  <script>
    function closeApp() {
      window.Telegram.WebApp.close()
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      // 从 URL 获取订单信息
      const params = new URLSearchParams(window.location.search)
      const orderId = params.get('orderId')

      if (orderId) {
        document.getElementById('orderId').textContent = orderId
        document.getElementById('payTime').textContent = new Date().toLocaleString('zh-CN')
        document.getElementById('amount').textContent = '¥' + (params.get('amount') || '-')
      }
    })
  </script>
</body>
</html>
  `.trim()
}
