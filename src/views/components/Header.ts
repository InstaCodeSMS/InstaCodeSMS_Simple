export default function Header() {
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