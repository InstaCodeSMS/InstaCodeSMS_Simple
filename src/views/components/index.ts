/**
 * 视图组件统一导出
 * 
 * Why: 将所有组件内联到一个文件中，避免ESBuild 模块解析问题
 */

import { html, raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { getI18nScript, getHtmlLang, type Language } from '@/i18n'

// ===== Header 组件 =====
function Header(lang: Language): string {
  return `
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
       style="background-color: var(--bg-nav); border-color: var(--border-color);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <a href="/${lang}" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i class="fas fa-bolt text-white text-sm"></i>
        </div>
        <span class="text-xl font-black tracking-tight" style="color: var(--accent-blue)" x-text="t('common.brand_name')">
          InstaCodeSMS
        </span>
      </a>
      
      <!-- 导航链接 -桌面端 -->
      <div class="hidden sm:flex items-center gap-2">
        <a href="/${lang}/purchase" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
           style="background-color: rgba(37, 99, 235, 0.1); color: var(--accent-blue);"
           x-text="t('nav.purchase')">
          购买服务
        </a>
        <a href="/${lang}/receive" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-80"
           style="color: var(--text-secondary); background-color: var(--bg-tertiary);"
           x-text="t('nav.receive')">
          接码终端
        </a>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
        <!-- 主题切换按钮 -->
        <button 
          type="button"
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
          :title="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'">
          <i x-show="theme === 'dark'" class="fas fa-sun text-yellow-500"></i>
          <i x-show="theme === 'light'" class="fas fa-moon text-blue-500"></i>
        </button>
        
        <!-- 语言切换 -->
        <div class="relative" x-data="{ langOpen: false }">
          <button 
            @click="langOpen = !langOpen"
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <img x-show="lang === 'zh'" src="https://flagcdn.com/w40/cn.png" alt="zh" class="w-5 h-5 rounded-sm object-cover" />
            <img x-show="lang === 'en'" src="https://flagcdn.com/w40/us.png" alt="en" class="w-5 h-5 rounded-sm object-cover" />
          </button>
          <div 
            x-show="langOpen" 
            x-cloak
            @click.away="langOpen = false"
            x-transition
            class="absolute right-0 top-11 w-28 rounded-xl overflow-hidden shadow-lg z-50"
            style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
            <button 
               type="button"
               @click="langOpen = false; window.location.href = window.location.pathname.replace(/^\\/(zh|en)/, '/zh')"
               class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors cursor-pointer"
               style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/cn.png" alt="zh" class="w-5 h-5 rounded-sm" />
              中文
            </button>
            <button 
               type="button"
               @click="langOpen = false; window.location.href = window.location.pathname.replace(/^\\/(zh|en)/, '/en')"
               class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors cursor-pointer"
               style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/us.png" alt="en" class="w-5 h-5 rounded-sm" />
              English
            </button>
          </div>
        </div>
        
        <!-- 移动端菜单按钮 -->
        <div class="sm:hidden relative" x-data="{ mobileOpen: false }">
          <button 
            @click="mobileOpen = !mobileOpen"
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <i class="fas fa-bars text-sm" style="color: var(--text-primary);"></i>
          </button>
          <div 
            x-show="mobileOpen" 
            x-cloak
            @click.away="mobileOpen = false"
            x-transition
            class="absolute right-0 top-11 w-40 rounded-xl overflow-hidden shadow-lg z-50"
            style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
            <a href="/${lang}/purchase" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--accent-blue);"
               x-text="t('nav.purchase')">
              购买服务
            </a>
            <a href="/${lang}/receive" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--text-secondary);"
               x-text="t('nav.receive')">
              接码终端
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>`
}

// ===== Footer 组件 =====
function Footer(): string {
  return `
  <footer class="text-base-content" style="background-color: var(--bg-secondary);">
    <!-- 主要内容区 -->
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- 第一列：品牌区 -->
        <div class="space-y-4">
          <h3 class="text-xl font-bold" x-text="t('common.brand_name')"></h3>
          <p class="text-sm opacity-70" x-text="t('footer.brand.slogan')"></p>
          <p class="text-xs opacity-60" x-text="t('footer.brand.features')"></p>
        </div>
        
        <!-- 第二列：产品服务 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.products.title')"></h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.smsCode')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.virtualNumber')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.bulkPurchase')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.pricing')"></a></li>
          </ul>
        </div>
        
        <!-- 第三列：帮助支持 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.support.title')"></h4>
          <ul class="space-y-2 text-sm">
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.guide')"></a></li>
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.apiDocs')"></a></li>
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.faq')"></a></li>
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.status')"></a></li>
          </ul>
        </div>
        
        <!-- 第四列：联系我们 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.contact.title')"></h4>
          <ul class="space-y-3">
            <li>
              <a href="https://t.me/InstaCodeSMS" target="_blank" rel="noopener noreferrer" 
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
                <span x-text="t('footer.contact.telegram')"></span>
              </a>
            </li>
            <li>
              <a href="https://facebook.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                <span x-text="t('footer.contact.facebook')"></span>
              </a>
            </li>
            <li>
              <a href="https://twitter.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                <span x-text="t('footer.contact.twitter')"></span>
              </a>
            </li>
            <li>
              <a href="https://youtube.com/@InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                <span x-text="t('footer.contact.youtube')"></span>
              </a>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
    
    <!-- 底部版权栏 -->
    <div class="border-t" style="border-color: var(--border-color);">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="text-center text-sm opacity-60 space-x-4">
          <span x-text="t('footer.copyright')"></span>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.privacy')"></a>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.terms')"></a>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.status')"></a>
        </div>
      </div>
    </div>
  </footer>
  `
}

// ===== Layout 组件 =====
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
 */
export default function Layout({ 
  title, 
  children, 
  lang = 'zh',
  showHeader = true,
  showFooter = true,
  csrfToken = ''
}: LayoutProps) {
  const headerHtml = showHeader ? Header(lang) : ''
  const footerHtml = showFooter ? Footer() : ''
  const hxHeaders = csrfToken ? `hx-headers='{"X-CSRF-Token": "${csrfToken}"}'` : ''
  const i18nScript = getI18nScript(lang)
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
      --shadow-modal: rgba(0, 0, 0, 0.4) 0px 25px 50px -12px;}
    
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
    
    /*自定义滚动条 */
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
    
    /*弹窗动画 */
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
        lang: localStorage.getItem('lang') || '${lang}'}"
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
      ">
  ${raw(headerHtml)}
  ${children}
  ${raw(footerHtml)}
</body>
</html>`
}