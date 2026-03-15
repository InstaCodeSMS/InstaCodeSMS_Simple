/**
 * 用户下拉菜单组件
 * 
 * Why: 提供统一的用户下拉菜单，根据登录状态显示不同内容
 * - 未登录：显示登录/注册按钮
 * - 已登录：显示用户头像图标 + 下拉菜单
 */

export interface MenuItem {
  id: string
  label: string
  href: string
  icon: string
  disabled?: boolean
}

export interface UserDropdownProps {
  menuItems?: MenuItem[]
  lang?: string
}

/**
 * 默认的已登录菜单配置
 */
const defaultMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '用户中心',
    href: '/dashboard',
    icon: 'tachometer-alt'
  },
  {
    id: 'orders',
    label: '订单管理',
    href: '/orders',
    icon: 'box',
    disabled: true
  },
  {
    id: 'settings',
    label: '账户设置',
    href: '/settings',
    icon: 'cog',
    disabled: true
  },
  {
    id: 'logout',
    label: '退出登录',
    href: '/logout',
    icon: 'sign-out-alt'
  }
]

/**
 * 渲染单个菜单项
 */
function renderMenuItem(item: MenuItem, lang: string): string {
  const disabledClass = item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-[var(--bg-tertiary)]'
  const href = item.disabled ? '#' : `/${lang}${item.href}`
  
  // 退出登录特殊处理
  if (item.id === 'logout') {
    return `
      <button @click="logout()"
         class="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${disabledClass}"
         style="color: var(--text-primary);">
        <i class="fas fa-${item.icon} text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
        <span>${item.label}</span>
      </button>
    `
  }
  
  return `
    <a href="${href}"
       class="flex items-center gap-2 px-4 py-2 text-sm transition-colors ${disabledClass}"
       style="color: var(--text-primary);">
      <i class="fas fa-${item.icon} text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
      <span>${item.label}</span>
    </a>
  `
}

/**
 * 用户下拉菜单组件
 * 根据登录状态显示不同内容
 */
export default function UserDropdown({ 
  menuItems = defaultMenuItems,
  lang = 'zh'
}: UserDropdownProps) {
  return `
    <div class="relative" x-data="userDropdownComponent()" x-init="init()">
      <!-- 未登录状态：显示登录/注册按钮 -->
      <template x-if="!userEmail">
        <div class="flex items-center gap-2">
          <a :href="'/' + lang + '/login'" 
             class="h-9 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105"
             style="color: var(--text-primary); background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <span>登录</span>
          </a>
          <a :href="'/' + lang + '/register'" 
             class="h-9 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105"
             style="background-color: var(--accent-blue); color: white;">
            <span>注册</span>
          </a>
        </div>
      </template>
      
      <!-- 已登录状态：显示用户头像图标 + 下拉菜单 -->
      <template x-if="userEmail">
        <div class="relative">
          <button 
            @click="userOpen = !userOpen"
            class="h-9 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);">
            <!-- 用户图标 -->
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <i class="fas fa-user text-white text-xs"></i>
            </div>
            <span class="text-sm hidden md:inline max-w-[120px] truncate" style="color: var(--text-primary);" x-text="userEmail"></span>
            <i class="fas fa-chevron-down text-xs" style="color: var(--text-muted); font-weight: 900;"></i>
          </button>
          
          <!-- 下拉菜单 -->
          <div 
            x-show="userOpen" 
            x-cloak
            @click.away="userOpen = false"
            x-transition
            class="absolute right-0 top-12 w-48 rounded-xl overflow-hidden shadow-lg z-50"
            style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
            <!-- 用户信息 -->
            <div class="px-4 py-3 border-b border-[var(--border-color)]">
              <p class="font-medium text-sm" style="color: var(--text-primary);" x-text="userEmail"></p>
              <p class="text-xs" style="color: var(--text-muted);" x-text="userRole === 'admin' ? '管理员' : '用户'"></p>
            </div>
            <!-- 菜单项 -->
            <div class="py-2">
              ${menuItems.map(item => renderMenuItem(item, lang)).join('')}
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <script>
      function userDropdownComponent() {
        return {
          userOpen: false,
          userEmail: '',
          userRole: '',
          lang: '${lang}',
          
          init() {
            this.checkAuth()
          },
          
          async checkAuth() {
            try {
              const response = await fetch('/api/user/profile')
              const data = await response.json()
              if (data.success && data.data) {
                this.userEmail = data.data.email
                this.userRole = data.data.role || 'user'
              }
            } catch (error) {
              console.error('Auth check failed:', error)
            }
          },
          
          async logout() {
            try {
              await fetch('/api/auth/logout', { method: 'POST' })
              this.userEmail = ''
              this.userRole = ''
              window.location.href = '/' + this.lang
            } catch (error) {
              console.error('Logout failed:', error)
            }
          }
        }
      }
    </script>
  `
}