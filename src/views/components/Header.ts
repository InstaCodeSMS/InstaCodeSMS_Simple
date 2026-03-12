/**
 * Header 组件
 * 
 * Why: 提供统一的页面导航栏
 * 使用全局 t() 函数实现多语言支持
 */

export default function Header() {
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
        <a href="/purchase" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
           style="background-color: rgba(37, 99, 235, 0.1); color: var(--accent-blue);">
          <span x-text="t('nav.purchase')"></span>
        </a>
        <a href="/receive" 
           class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:opacity-80"
           style="color: var(--text-secondary); background-color: var(--bg-tertiary);">
          <span x-text="t('nav.receive')"></span>
        </a>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
        <!-- 用户按钮 -->
        <div class="relative">
          <button 
            @click="userOpen = !userOpen"
            class="h-9 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <!-- 未登录状态 -->
            <template x-if="!isLoggedIn">
              <div class="flex items-center gap-2">
                <i class="fas fa-user-circle text-lg" style="color: var(--text-muted);"></i>
                <span class="text-sm hidden sm:inline" style="color: var(--text-secondary);" x-text="t('auth.login')"></span>
              </div>
            </template>
            <!-- 已登录状态 -->
            <template x-if="isLoggedIn">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span class="text-white text-xs font-bold" x-text="userEmail ? userEmail.charAt(0).toUpperCase() : 'U'"></span>
                </div>
                <span class="text-sm hidden sm:inline max-w-[100px] truncate" style="color: var(--text-primary);" x-text="userEmail"></span>
              </div>
            </template>
          </button>
          <!-- 下拉菜单 -->
          <div 
            x-show="userOpen" 
            x-cloak
            @click.away="userOpen = false"
            x-transition
            class="absolute right-0 top-11 w-40 rounded-xl overflow-hidden shadow-lg z-50"
            style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
            <!-- 未登录菜单 -->
            <template x-if="!isLoggedIn">
              <div>
                <a :href="'/' + lang + '/login'" 
                   class="block px-4 py-3 text-sm transition-colors hover:opacity-80"
                   style="color: var(--text-primary);">
                  <i class="fas fa-sign-in-alt mr-2" style="color: var(--accent-blue);"></i>
                  <span x-text="t('auth.login')"></span>
                </a>
                <a :href="'/' + lang + '/register'" 
                   class="block px-4 py-3 text-sm transition-colors hover:opacity-80"
                   style="color: var(--text-primary);">
                  <i class="fas fa-user-plus mr-2" style="color: var(--accent-blue);"></i>
                  <span x-text="t('auth.register')"></span>
                </a>
              </div>
            </template>
            <!-- 已登录菜单 -->
            <template x-if="isLoggedIn">
              <div>
                <a :href="'/' + lang + '/dashboard'" 
                   class="block px-4 py-3 text-sm transition-colors hover:opacity-80"
                   style="color: var(--text-primary);">
                  <i class="fas fa-tachometer-alt mr-2" style="color: var(--accent-blue);"></i>
                  <span x-text="t('dashboard.title')"></span>
                </a>
                <button @click="logout(); userOpen = false;" 
                   class="w-full text-left px-4 py-3 text-sm transition-colors hover:opacity-80"
                   style="color: var(--text-primary);">
                  <i class="fas fa-sign-out-alt mr-2 text-red-500"></i>
                  <span x-text="t('auth.logout')"></span>
                </button>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 主题切换按钮 -->
        <button 
          type="button"
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
          :title="theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')">
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
            <button @click="lang = 'zh'; langOpen = false; setTimeout(() => location.reload(), 50);" 
                    class="w-full px-4 py-3 flex items-center gap-2 text-sm hover:opacity-80 transition-colors"
                    style="color: var(--text-primary);">
              <img src="https://flagcdn.com/w40/cn.png" alt="zh" class="w-5 h-5 rounded-sm" />
              中文
            </button>
            <button @click="lang = 'en'; langOpen = false; setTimeout(() => location.reload(), 50);" 
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
              <span x-text="t('nav.purchase')"></span>
            </a>
            <a href="/receive" class="block px-4 py-3 text-sm transition-colors"
               style="color: var(--text-secondary);">
              <span x-text="t('nav.receive')"></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <script>
    function headerAuth() {
      return {
        isLoggedIn: false,
        userEmail: '',
        lang: localStorage.getItem('lang') || 'zh',
        userOpen: false,
        
        init() {
          this.checkAuth();
        },
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        async checkAuth() {
          try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            if (data.success && data.data) {
              this.isLoggedIn = true;
              this.userEmail = data.data.email;
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
        }
      }
    }
  </script>`
}