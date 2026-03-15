/**
 * 用户下拉菜单组件（简化版）
 * 
 * Why: 提供统一的用户下拉菜单，所有页面显示相同的完整菜单
 * 简单直接，易于维护
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
}

/**
 * 默认的完整菜单配置
 * 所有页面都显示相同的菜单项
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
function renderMenuItem(item: MenuItem): string {
  const disabledClass = item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
  const disabledAttr = item.disabled ? 'disabled' : ''
  
  return `
    <a href="${item.href}"
       class="flex items-center gap-2 px-4 py-2 text-sm transition-colors ${disabledClass}"
       style="color: var(--text-primary);"
       ${disabledAttr}>
      <i class="fas fa-${item.icon} text-sm" style="color: var(--text-primary); font-weight: 900;"></i>
      <span>${item.label}</span>
    </a>
  `
}

/**
 * 用户下拉菜单组件
 */
export default function UserDropdown({ 
  menuItems = defaultMenuItems
}: UserDropdownProps) {
  return `
    <div class="relative">
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
        class="absolute right-0 top-12 w-48 rounded-xl overflow-hidden shadow-lg z-50"
        style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color-light);">
        <div class="px-4 py-3 border-b border-[var(--border-color)]">
          <p class="font-medium" x-text="userEmail"></p>
          <p class="text-sm text-muted" x-text="userRole"></p>
        </div>
        <div class="py-2">
          ${menuItems.map(item => renderMenuItem(item)).join('')}
        </div>
      </div>
    </div>
  `
}