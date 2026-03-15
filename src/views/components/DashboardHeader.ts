/**
 * Dashboard 专用顶部状态栏组件
 * 
 * Why: 为 Dashboard 页面提供简洁的状态栏，包含用户信息、余额、快速操作
 * 与侧边栏配合使用，提供完整的 Dashboard 体验
 */

export default function DashboardHeader() {
  return `
  <header 
    class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
    style="background-color: var(--bg-nav); border-color: var(--border-color);"
    x-data="dashboardHeader()">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- 左侧：用户信息和余额 -->
      <div class="flex items-center gap-4">
        <!-- 移动端菜单按钮 -->
        <button 
          @click="$dispatch('sidebar-toggle')"
          class="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
          <i class="fas fa-bars text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
        </button>
        
        <!-- 用户信息 -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span class="text-white text-sm font-bold" x-text="userInitial"></span>
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-medium" x-text="userEmail"></p>
              <p class="text-xs text-muted" x-text="userRole"></p>
            </div>
          </div>
          
          <!-- 分隔符 -->
          <div class="w-px h-6" style="background-color: var(--border-color)"></div>
          
          <!-- 余额显示 -->
          <div class="flex items-center gap-2">
            <i class="fas fa-wallet text-sm" style="color: var(--text-muted); font-weight: 900;"></i>
            <div>
              <p class="text-sm font-semibold" x-text="'¥' + balance"></p>
              <p class="text-xs text-muted" x-text="t('dashboard.current_balance')"></p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：快速操作 -->
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
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
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
        <div class="relative" x-data="{ userOpen: false }">
          <button 
            @click="userOpen = !userOpen"
            class="h-9 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span class="text-white text-xs font-bold" x-text="userInitial"></span>
            </div>
            <span class="text-sm hidden md:inline max-w-[120px] truncate" style="color: var(--text-primary);" x-text="userEmail"></span>
            <i class="fas fa-chevron-down text-xs" style="color: var(--text-muted); font-weight: 900;"></i>
          </button>
          <div 
            x-show="userOpen" 
            x-cloak
            @click.away="userOpen = false"
            x-transition
            class="absolute right-0 top-11 w-48 rounded-xl overflow-hidden shadow-lg z-50"
            style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
            <div class="px-4 py-3 border-b border-[var(--border-color)]">
              <p class="font-medium" x-text="userEmail"></p>
              <p class="text-sm text-muted" x-text="userRole"></p>
            </div>
            <div class="py-2">
              <a href="/dashboard" 
                 class="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
                 style="color: var(--text-primary);">
                <i class="fas fa-tachometer-alt text-blue-500" style="font-weight: 900;"></i>
                <span x-text="t('dashboard.title')"></span>
              </a>
              <a href="/orders" 
                 class="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80 opacity-50 cursor-not-allowed"
                 disabled>
                <i class="fas fa-box text-green-500" style="font-weight: 900;"></i>
                <span x-text="t('nav.orders')"></span>
              </a>
              <a href="/settings" 
                 class="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80 opacity-50 cursor-not-allowed"
                 disabled>
                <i class="fas fa-cog text-gray-500" style="font-weight: 900;"></i>
                <span x-text="t('nav.settings')"></span>
              </a>
            </div>
            <div class="px-4 py-3 border-t border-[var(--border-color)]">
              <button @click="logout(); userOpen = false;" 
                     class="w-full flex items-center gap-2 px-2 py-2 text-sm transition-colors hover:opacity-80 text-left"
                     style="color: var(--text-primary);">
                <i class="fas fa-sign-out-alt text-red-500" style="font-weight: 900;"></i>
                <span x-text="t('auth.logout')"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <script>
    function dashboardHeader() {
      return {
        isLoggedIn: false,
        userEmail: '',
        userRole: '',
        balance: '0.00',
        lang: localStorage.getItem('lang') || 'zh',
        theme: localStorage.getItem('theme') || 'dark',
        
        init() {
          this.checkAuth();
        },
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        get userInitial() {
          return this.userEmail ? this.userEmail.charAt(0).toUpperCase() : 'U';
        },
        
        async checkAuth() {
          try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            if (data.success && data.data) {
              this.isLoggedIn = true;
              this.userEmail = data.data.email;
              this.userRole = data.data.role || 'User';
              this.balance = data.data.balance || '0.00';
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            this.isLoggedIn = false;
            this.userEmail = '';
            this.userRole = '';
            this.balance = '0.00';
          }
        },
        
        async logout() {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.isLoggedIn = false;
            this.userEmail = '';
            this.userRole = '';
            this.balance = '0.00';
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
        }
      }
    }
  </script>`
}