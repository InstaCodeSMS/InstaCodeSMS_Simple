/**
 * 视图组件统一导出
 * 
 * Why: 将所有组件内联到一个文件中，避免 ESBuild 模块解析问题
 */

import { html, raw } from 'hono/html'
import type { Child } from 'hono/jsx'

// ===== Header 组件 =====
function Header(): string {
  return `
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
       style="background-color: var(--bg-nav); border-color: var(--border-color);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i class="fas fa-bolt text-white text-sm"></i>
        </div>
        <span class="text-xl font-black tracking-tight">
          <span style="color: var(--accent-blue)">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
      </a>
      
      <!-- 导航链接 - 桌面端 -->
      <div class="hidden sm:flex items-center gap-2">
        <a href="/purchase" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
           style="background-color: rgba(37, 99, 235, 0.1); color: var(--accent-blue);">
          购买服务
        </a>
        <a href="/receive" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-80"
           style="color: var(--text-secondary); background-color: var(--bg-tertiary);">
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
            <button @click="lang = 'zh'; langOpen = false" 
                    class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors"
                    style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/cn.png" alt="zh" class="w-5 h-5 rounded-sm" />
              中文
            </button>
            <button @click="lang = 'en'; langOpen = false" 
                    class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors"
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
            <a href="/purchase" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--accent-blue);">
              购买服务
            </a>
            <a href="/receive" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--text-secondary);">
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
  <footer class="border-t transition-colors duration-300 py-14 px-6"
          style="background-color: var(--bg-primary); border-color: var(--border-color);">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <!-- 品牌名 -->
        <span class="text-xl font-black tracking-tight">
          <span style="color: var(--accent-blue)">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
        
        <!-- 链接 -->
        <div class="flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
          <a href="#" class="hover:opacity-80 transition-opacity">联系支持</a>
          <a href="#" class="hover:opacity-80 transition-opacity">隐私政策</a>
          <a href="#" class="hover:opacity-80 transition-opacity">服务条款</a>
        </div>
        
        <!-- 版权 -->
        <p class="text-xs" style="color: var(--text-muted);">
          © 2026 SIMPLEFAKA PROTOCOL. 版权所有.
        </p>
      </div>
    </div>
  </footer>
  `
}

// ===== Layout 组件 =====
interface LayoutProps {
  title: string
  children: Child
  lang?: string
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
  lang = 'zh-CN',
  showHeader = true,
  showFooter = true,
  csrfToken = ''
}: LayoutProps) {
  const headerHtml = showHeader ? Header() : ''
  const footerHtml = showFooter ? Footer() : ''
  const hxHeaders = csrfToken ? `hx-headers='{"X-CSRF-Token": "${csrfToken}"}'` : ''
  
  return html`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SimpleFaka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.min.css" rel="stylesheet" type="text/css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script src="https://unpkg.com/htmx.org@2.0.8"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
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
        lang: localStorage.getItem('lang') || 'zh'
      }"
      :class="theme"
      ${raw(hxHeaders)}
      x-init="
        $watch('theme', val => localStorage.setItem('theme', val));
        $watch('lang', val => localStorage.setItem('lang', val));
      ">
  ${raw(headerHtml)}
  ${children}
  ${raw(footerHtml)}
</body>
</html>`
}