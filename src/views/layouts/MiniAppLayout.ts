/**
 * Mini App 布局
 * 为 Telegram Mini App 提供精简布局
 * 
 * Why: Telegram Mini App 不需要 Header/Footer
 * 需要集成 Telegram WebApp SDK 并应用主题
 */

import { raw } from 'hono/html'
import type { Language } from '@/i18n'

export interface MiniAppLayoutProps {
  title: string
  children: string
  lang?: Language
  csrfToken?: string
}

/**
 * Telegram WebApp SDK 初始化脚本
 */
const telegramInitScript = raw`
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
  // 初始化 Telegram WebApp
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // 初始化
    tg.ready();
    
    // 应用 Telegram 主题
    const themeParams = tg.themeParams;
    if (themeParams) {
      const root = document.documentElement;
      if (themeParams.bg_color) {
        root.style.setProperty('--bg-primary', themeParams.bg_color);
        root.style.setProperty('--bg-secondary', themeParams.bg_color + 'ee');
        root.style.setProperty('--bg-tertiary', themeParams.bg_color + 'cc');
      }
      if (themeParams.text_color) {
        root.style.setProperty('--text-primary', themeParams.text_color);
        root.style.setProperty('--text-secondary', themeParams.text_color + 'cc');
        root.style.setProperty('--text-muted', themeParams.text_color + '88');
      }
      if (themeParams.hint_color) {
        root.style.setProperty('--text-muted', themeParams.hint_color);
      }
      if (themeParams.link_color) {
        root.style.setProperty('--accent-blue', themeParams.link_color);
      }
      if (themeParams.button_color) {
        root.style.setProperty('--btn-primary', themeParams.button_color);
      }
      if (themeParams.button_text_color) {
        root.style.setProperty('--btn-text', themeParams.button_text_color);
      }
    }
    
    // 根据主题设置 dark/light
    if (themeParams.bg_color) {
      const isDark = themeParams.bg_color.toLowerCase() < '#888888';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }
    
    // 展开 Mini App
    tg.expand();
  }
  
  // 获取 Telegram 用户信息的辅助函数
  function getTelegramUser() {
    if (window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp.initDataUnsafe?.user || null;
    }
    return null;
  }
  
  // 触觉反馈
  function hapticFeedback(style = 'medium') {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  }
  
  // 关闭 Mini App
  function closeMiniApp() {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  }
</script>
`

/**
 * Mini App 样式
 */
const miniAppStyles = raw`
<style>
  /* Mini App 基础样式 */
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  html, body {
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 隐藏 Web 特有元素 */
  .web-only {
    display: none !important;
  }
  
  /* Mini App 专用样式 */
  .mini-app-container {
    padding: 16px;
    padding-bottom: 80px; /* 为底部按钮留空间 */
    min-height: 100vh;
    background-color: var(--bg-primary);
  }
  
  /* 底部固定按钮区域 */
  .mini-app-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color-light);
    z-index: 100;
  }
  
  /* DaisyUI 适配 Mini App */
  .btn {
    touch-action: manipulation;
  }
  
  /* 卡片圆角适配 */
  .card {
    border-radius: 16px;
  }
  
  /* Modal 适配 */
  .modal-box {
    max-height: 85vh;
    margin: 16px;
    border-radius: 20px;
  }
</style>
`

/**
 * MiniAppLayout 组件
 */
export default function MiniAppLayout({ 
  title, 
  children, 
  lang = 'zh',
  csrfToken = '' 
}: MiniAppLayoutProps): string {
  return raw`
<!DOCTYPE html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a1e2c">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  
  <title>${title}</title>
  
  <!-- DaisyUI + Tailwind -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  ${miniAppStyles}
  
  <style>
    /* 自定义主题变量 */
    :root {
      --bg-primary: #131620;
      --bg-secondary: #1a1e2c;
      --bg-tertiary: #242837;
      --bg-input: #1e2230;
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #3b82f6;
      --border-color: rgba(200, 210, 240, 0.06);
      --border-color-light: rgba(200, 210, 240, 0.12);
      --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.12);
      --btn-primary: #3b82f6;
      --btn-text: #ffffff;
    }
    
    [data-theme="light"] {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-tertiary: #f1f5f9;
      --bg-input: #f8fafc;
      --text-primary: #1e293b;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --border-color: rgba(0, 0, 0, 0.06);
      --border-color-light: rgba(0, 0, 0, 0.1);
      --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  ${telegramInitScript}
  
  <!-- 主内容区 -->
  <main class="mini-app-container">
    ${children}
  </main>
  
  <!-- CSRF Token -->
  <input type="hidden" name="csrf_token" value="${csrfToken}">
  
  <!-- 全局脚本 -->
  <script>
    // 设置语言
    localStorage.setItem('lang', '${lang}');
    
    // 初始化 Lucide Icons
    lucide.createIcons();
    
    // HTMX 配置
    document.body.addEventListener('htmx:configRequest', (evt) => {
      // 添加 CSRF token
      if (csrfToken) {
        evt.detail.headers['X-CSRF-Token'] = csrfToken;
      }
    });
  </script>
</body>
</html>
`
}

/**
 * 判断是否在 Telegram Mini App 中
 */
export function isMiniApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Telegram?.WebApp
}

/**
 * 获取 Telegram 用户信息
 */
export function getTelegramUser(): { id: number; first_name: string; username?: string } | null {
  if (typeof window === 'undefined') return null
  const tg = (window as any).Telegram?.WebApp
  return tg?.initDataUnsafe?.user || null
}