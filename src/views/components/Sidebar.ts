/**
 * 侧边栏组件
 * 
 * Why: 为 Dashboard 页面提供可折叠的侧边栏导航
 * 支持多语言、响应式设计、可折叠功能
 */

export default function Sidebar() {
  return `<aside 
    x-data="sidebar()"
    :class="{ 'w-64': sidebarOpen, 'w-16': !sidebarOpen }"
    class="fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ease-in-out"
    style="background-color: var(--bg-secondary); border-right: 0.667px solid var(--border-color);"
    @click.away="closeOnMobile()">
    
    <!-- Logo 区域 -->
    <div class="flex items-center justify-between px-4 py-4border-b border-[var(--border-color)]">
      <div 
        class="flex items-center gap-3 transition-all duration-300"
        :class="{ 'justify-center': !sidebarOpen }">
        <div class="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i class="fas fa-bolt text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="text-lg font-black tracking-tight transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          <span style="color: var(--accent-blue)">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
      </div>
      <button 
        @click="toggleSidebar()"
        class="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
        style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
        <i class="fas fa-bars text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
      </button>
    </div>

    <!-- 导航菜单 -->
    <nav class="p-2 space-y-1">
      <!-- 仪表盘 -->
      <a href="/dashboard" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30': isActive('/dashboard'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/dashboard')
         }">
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-tachometer-alt text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          <span x-text="t('dashboard.title')"></span>
        </span>
      </a>

      <!-- 订单管理 -->
      <a href="/orders" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30': isActive('/orders'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/orders'),
           'opacity-50 cursor-not-allowed': true
         }"
         disabled>
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-box text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          <span x-text="t('nav.orders')"></span>
        </span>
        <span 
          class="ml-auto px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Coming Soon
        </span>
      </a>

      <!-- Billing -->
      <a href="/billing" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30': isActive('/billing'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/billing'),
           'opacity-50 cursor-not-allowed': true
         }"
         disabled>
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-wallet text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Billing
        </span>
        <span 
          class="ml-auto px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Coming Soon
        </span>
      </a>

      <!-- Security -->
      <a href="/security" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/30': isActive('/security'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/security'),
           'opacity-50 cursor-not-allowed': true
         }"
         disabled>
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-shield-alt text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Security
        </span>
        <span 
          class="ml-auto px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Coming Soon
        </span>
      </a>

      <!--账户设置 -->
      <a href="/settings" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-gray-500/20 to-blue-500/20 border border-gray-500/30': isActive('/settings'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/settings'),
           'opacity-50 cursor-not-allowed': true
         }"
         disabled>
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-500 to-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-cog text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          <span x-text="t('nav.settings')"></span>
        </span>
        <span 
          class="ml-auto px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Coming Soon
        </span>
      </a>

      <!-- 帮助中心 -->
      <a href="/help" 
         class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group"
         style="color: var(--text-primary);"
         :class="{
           'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border border-blue-400/30': isActive('/help'),
           'hover:bg-[var(--bg-tertiary)]': !isActive('/help'),
           'opacity-50 cursor-not-allowed': true
         }"
         disabled>
        <div class="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas fa-question-circle text-white text-sm" style="font-style: normal; font-weight: 900;"></i>
        </div>
        <span 
          class="font-medium transition-all duration-300"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          <span x-text="t('nav.help')"></span>
        </span>
        <span 
          class="ml-auto px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500"
          :class="{ 'opacity-0 w-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
          Coming Soon
        </span>
      </a>
    </nav>

    <!-- 底部信息 -->
    <div class="absolute bottom-4 left-4 right-4">
      <div 
        class="px-3 py-2 rounded-lg text-xs text-center transition-all duration-300"
        style="color: var(--text-muted); background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
        :class="{ 'opacity-0': !sidebarOpen, 'opacity-100': sidebarOpen }">
        <span x-text="t('common.version')"></span> v1.0.0
      </div>
    </div>
  </aside><script>
    function sidebar() {
      return {
        sidebarOpen: localStorage.getItem('sidebar-open') !== 'false',
        lang: localStorage.getItem('lang') || 'zh',
        init() {
          // 监听语言变更事件
          window.addEventListener('langchange', (e) => {
            if (e.detail && e.detail.lang) {
              this.lang = e.detail.lang;
            }
          });
        },
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        isActive(path) {
          const currentPath = window.location.pathname;
          return currentPath === path || currentPath.startsWith(path + '/');
        },
        
        toggleSidebar() {
          this.sidebarOpen = !this.sidebarOpen;
          localStorage.setItem('sidebar-open', this.sidebarOpen);
          // 移动端模式下，展开侧边栏时阻止背景滚动
          if (this.sidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = 'auto';
          }
        },
        
        closeOnMobile() {
          if (window.innerWidth < 768) {
            this.sidebarOpen = false;
            localStorage.setItem('sidebar-open', false);
            document.body.style.overflow = 'auto';
          }
        }
      }
    }
  </script>`
}