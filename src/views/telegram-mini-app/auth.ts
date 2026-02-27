/**
 * Telegram Mini App 认证页面
 * 初始化 Telegram Mini App 并获取 InitData
 */

export function AuthPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SimpleFaka - 认证</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body class="bg-gradient-to-br from-blue-500 to-blue-600 min-h-screen flex items-center justify-center">
  <div class="text-center text-white">
    <div class="text-6xl mb-4">🔐</div>
    <h1 class="text-3xl font-bold mb-2">SimpleFaka</h1>
    <p class="text-blue-100 mb-8">正在初始化认证...</p>
    <div class="inline-block animate-spin">
      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    </div>
  </div>

  <script>
    // 初始化 Telegram Mini App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // 获取 InitData
      const initData = tg.initData;

      if (!initData) {
        console.error('Failed to get initData');
        document.body.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-center"><p class="text-red-500 text-lg">无法获取认证数据</p></div></div>';
        setTimeout(() => {
          tg.close();
        }, 2000);
      } else {
        // 发送登录请求
        fetch('/mini-app/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // 登录成功，重定向到首页
              window.location.href = '/mini-app';
            } else {
              throw new Error(data.message || '登录失败');
            }
          })
          .catch(error => {
            console.error('Login error:', error);
            document.body.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-center"><p class="text-red-500 text-lg">登录失败: ' + error.message + '</p></div></div>';
            setTimeout(() => {
              tg.close();
            }, 3000);
          });
      }
    } else {
      // 不在 Telegram 环境中
      document.body.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-center"><p class="text-red-500 text-lg">请在 Telegram 中打开此应用</p></div></div>';
    }
  </script>
</body>
</html>`
}
