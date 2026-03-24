import UserDropdown from '../../components/UserDropdown'
import type { Language } from '@/i18n'

/**
 * Header 组件
 * 
 * Why: 提供统一的页面导航栏
 * 使用全局 t() 函数实现多语言支持
 */

interface HeaderProps {
  lang?: Language
}

export default function Header({ lang = 'zh' }: HeaderProps = {}) {
  return `
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
       style="background-color: var(--bg-nav); border-color: var(--border-color);"
       x-data="headerAuth()">
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
        <a :href="'/' + lang + '/purchase'" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
           style="background-color: rgba(37, 99, 235, 0.1); color: var(--accent-blue);">
          <span x-text="t('nav.purchase')"></span>
        </a>
        <a :href="'/' + lang + '/receive'" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-80"
           style="color: var(--text-secondary); background-color: var(--bg-tertiary);">
          <span x-text="t('nav.receive')"></span>
        </a>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
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
            <button @click="switchToLanguage('zh'); langOpen = false" 
                    class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors"
                    style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/cn.png" alt="zh" class="w-5 h-5 rounded-sm" />
              中文
            </button>
            <button @click="switchToLanguage('en'); langOpen = false" 
                    class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors"
                    style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/us.png" alt="en" class="w-5 h-5 rounded-sm" />
              English
            </button>
          </div>
        </div>
        
        <!-- 主题切换按钮 -->
        <button 
          type="button"
          @click="switchTheme()"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
          :title="theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')">
          <i x-show="theme === 'dark'" class="fas fa-sun text-yellow-500" style="font-weight: 900;"></i>
          <i x-show="theme === 'light'" class="fas fa-moon text-blue-500" style="font-weight: 900;"></i>
        </button>
        
        <!-- 通知按钮 -->
        <button 
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 relative"
          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
          :title="t('common.notifications')">
          <i class="fas fa-bell text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 transition-opacity"></span>
        </button>
        
        <!-- 用户下拉菜单 -->
        ${UserDropdown({ lang })}
        
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
            <a :href="'/' + lang + '/purchase'" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--accent-blue);">
              <span x-text="t('nav.purchase')"></span>
            </a>
            <a :href="'/' + lang + '/receive'" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--text-secondary);">
              <span x-text="t('nav.receive')"></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <script>
    // 用户下拉菜单 Alpine.js 组件
    function userDropdown() {
      return {
        userOpen: false,
        userInitial: 'U',
        userEmail: '',
        userRole: '',
        
        init() {
          this.checkAuth()
        },
        
        async checkAuth() {
          try {
            const response = await fetch('/api/user/profile')
            const data = await response.json()
            if (data.success && data.data) {
              this.userEmail = data.data.email
              this.userInitial = this.userEmail.charAt(0).toUpperCase()
              this.userRole = data.data.role || 'User'
            }
          } catch (error) {
            console.error('Auth check failed:', error)
          }
        }
      }
    }

    // Header 认证状态管理
    function headerAuth() {
      return {
        isLoggedIn: false,
        userEmail: '',
        lang: localStorage.getItem('lang') || 'zh',
        theme: localStorage.getItem('theme') || 'dark',
        userOpen: false,
        
        init() {
          this.checkAuth();
          
          // 监听主题变更事件
          window.addEventListener('themechange', (e) => {
            if (e.detail && e.detail.theme) {
              this.theme = e.detail.theme;
            }
          });
        },
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        async checkAuth() {
          try {
            const response = await fetch('/api/user/profile');
            // 检查响应是否为 JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              // 非 JSON 响应，说明未登录或被重定向
              this.isLoggedIn = false;
              this.userEmail = '';
              return;
            }
            const data = await response.json();
            if (data.success && data.data) {
              this.isLoggedIn = true;
              this.userEmail = data.data.email;
            } else {
              this.isLoggedIn = false;
              this.userEmail = '';
            }
          } catch (error) {
            this.isLoggedIn = false;
            this.userEmail = '';
          }
        },
        
        async logout() {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.isLoggedIn = false;
            this.userEmail = '';
            window.location.href = '/' + this.lang;
          } catch (error) {
            console.error('Logout failed:', error);
          }
        },
        
        switchToLanguage(newLang) {
          localStorage.setItem('lang', newLang);
          const currentPath = window.location.pathname;
          let newPath;
          if (currentPath.startsWith('/zh/')) {
            newPath = '/' + newLang + currentPath.substring(3);
          } else if (currentPath.startsWith('/en/')) {
            newPath = '/' + newLang + currentPath.substring(3);
          } else if (currentPath === '/zh' || currentPath === '/en') {
            newPath = '/' + newLang;
          } else {
            newPath = '/' + newLang + currentPath;
          }
          window.location.href = newPath;
        },
        
        // 主题切换
        switchTheme() {
          const newTheme = this.theme === 'dark' ? 'light' : 'dark';
          this.theme = newTheme;
          localStorage.setItem('theme', newTheme);
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          document.documentElement.classList.toggle('light', newTheme === 'light');
          
          // 触发主题变更事件，通知其他组件
          window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: newTheme }
          }));
        }
      }
    }
  </script>`
}
