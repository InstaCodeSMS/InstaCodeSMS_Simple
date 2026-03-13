import { html, raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import Header from './Header'
import Footer from './Footer'
import { getI18nScript, getHtmlLang, type Language } from '@/i18n'

interface LayoutProps {
  title: string
  children: Child
  lang?: Language
  showHeader?: boolean
  showFooter?: boolean
  csrfToken?: string
}

/**
 * 页面布局组件
 * 
 * Why: 提供统一的页面骨架，包含共享的 head、Header、Footer
 * 避免每个页面重复编写 HTML 结构
 * 
 * @param title - 页面标题
 * @param children - 页面主体内容
 * @param lang - 语言设置，默认 'zh'
 * @param showHeader - 是否显示导航栏，默认 true
 * @param showFooter - 是否显示页脚，默认 true
 * @param csrfToken - CSRF 令牌
 */
export default function Layout({ 
  title, 
  children, 
  lang = 'zh',
  showHeader = true,
  showFooter = true,
  csrfToken = ''
}: LayoutProps) {
  const headerHtml = showHeader ? Header() : ''
  const footerHtml = showFooter ? Footer() : ''
  // 构建 hx-headers 属性
  const hxHeaders = csrfToken ? `hx-headers='{"X-CSRF-Token": "${csrfToken}"}'` : ''
  // 生成 i18n 脚本
  const i18nScript = getI18nScript(lang)
  // 获取 HTML lang 属性
  const htmlLang = getHtmlLang(lang)
  
  return html`<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SimpleFaka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.min.css" rel="stylesheet" type="text/css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script src="https://unpkg.com/htmx.org@2.0.8"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <!-- 全局 i18n 脚本 - 必须在 Alpine.js 之前加载 -->
  <script>
${raw(i18nScript)}
  </script>
  <style>
    [x-cloak] { display: none !important; }
    
    /* ===== 主题变量系统 ===== */
    .dark {
      --bg-primary: rgb(12, 15, 22);
      --bg-secondary: rgb(19, 22, 32);
      --bg-tertiary: rgb(26, 30, 44);
      --bg-input: rgb(23, 27, 40);
      --bg-nav: rgba(12, 15, 22, 0.78);
      --bg-modal: rgb(19, 22, 32);
      
      --text-primary: rgb(228, 232, 241);
      --text-secondary: rgb(148, 163, 184);
      --text-muted: rgb(100, 116, 139);
      
      --border-color: rgba(200, 210, 240, 0.06);
      --border-color-light: rgba(200, 210, 240, 0.08);
      
      --accent-blue: rgb(37, 99, 235);
      --accent-blue-hover: rgb(59, 130, 246);
      
      --shadow-card: rgba(0, 0, 0, 0.2) 0px 10px 15px -3px;
      --shadow-modal: rgba(0, 0, 0, 0.4) 0px 25px 50px -12px;
    }
    
    .light {
      --bg-primary: rgb(248, 250, 252);
      --bg-secondary: rgb(255, 255, 255);
      --bg-tertiary: rgb(241, 245, 249);
      --bg-input: rgb(255, 255, 255);
      --bg-nav: rgba(248, 250, 252, 0.85);
      --bg-modal: rgb(255, 255, 255);
      
      --text-primary: rgb(15, 23, 42);
      --text-secondary: rgb(71, 85, 105);
      --text-muted: rgb(100, 116, 139);
      
      --border-color: rgba(226, 232, 240, 0.8);
      --border-color-light: rgba(226, 232, 240, 1);
      
      --accent-blue: rgb(37, 99, 235);
      --accent-blue-hover: rgb(59, 130, 246);
      
      --shadow-card: rgba(0, 0, 0, 0.05) 0px 10px 15px -3px;
      --shadow-modal: rgba(0, 0, 0, 0.15) 0px 25px 50px -12px;
    }
    
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    /* 自定义滚动条 */
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(37, 99, 235, 0.2);
      border-radius: 10px;
    }
    
    /* 弹窗动画 */
    .modal-enter-active, .modal-leave-active {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .modal-enter-from, .modal-leave-to {
      opacity: 0;
      transform: scale(0.95);
    }
  </style>
</head>
<body class="min-h-screen transition-colors duration-300" 
      x-data="{ 
        theme: localStorage.getItem('theme') || 'dark',
        lang: localStorage.getItem('lang') || '${lang}'
      }"
      :class="theme"
      ${raw(hxHeaders)}
      x-init="
        $watch('theme', val => localStorage.setItem('theme', val));
        $watch('lang', val => { 
          localStorage.setItem('lang', val);
          if (window.setLang) {
            window.setLang(val);
          } else {
            window.__LANG__ = val;
            window.__I18N__ = val === 'en' ? window.__I18N_EN__ : window.__I18N_ZH__;
          }
        });
        
        // 监听语言变更事件
        window.addEventListener('langchange', (e) => {
          if (e.detail && e.detail.lang) {
            lang = e.detail.lang;
          }
        });
      ">
  ${raw(headerHtml)}
  ${children}
  ${raw(footerHtml)}
</body>
</html>`
}