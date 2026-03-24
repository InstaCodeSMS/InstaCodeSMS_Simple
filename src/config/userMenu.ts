/**
 * 用户菜单配置系统
 * 
 * Why: 集中管理不同页面的用户菜单配置，支持权限控制、国际化
 * 提供统一的菜单配置接口，便于维护和扩展
 */

import { MenuItem } from '../components/UserDropdown'

/**
 * Dashboard 页面菜单配置
 */
export const dashboardMenu: MenuItem[] = [
  {
    id: 'dashboard',
    label: '用户中心',
    labelKey: 'nav.dashboard',
    href: '/dashboard',
    icon: 'tachometer-alt'
  },
  {
    id: 'orders',
    label: '订单管理',
    labelKey: 'nav.orders',
    href: '/orders',
    icon: 'box',
    disabled: true
  },
  {
    id: 'settings',
    label: '账户设置',
    labelKey: 'nav.settings',
    href: '/settings',
    icon: 'cog',
    disabled: true
  },
  {
    id: 'divider',
    type: 'divider'
  },
  {
    id: 'logout',
    label: '退出登录',
    labelKey: 'auth.logout',
    icon: 'sign-out-alt',
    onClick: () => {
      // 退出登录逻辑
      window.location.href = '/logout'
    }
  }
]

/**
 * 默认页面菜单配置（Purchase/Receive 页面使用）
 */
export const defaultMenu: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    href: '/dashboard',
    icon: 'tachometer-alt'
  },
  {
    id: 'logout',
    label: 'Logout',
    labelKey: 'auth.logout',
    icon: 'sign-out-alt',
    onClick: () => {
      // 退出登录逻辑
      window.location.href = '/logout'
    }
  }
]

/**
 * 根据页面类型获取菜单配置
 */
export function getMenuByPage(pageType: string): MenuItem[] {
  switch (pageType) {
    case 'dashboard':
      return dashboardMenu
    case 'purchase':
    case 'receive':
      return defaultMenu
    default:
      return defaultMenu
  }
}

/**
 * 根据当前路径自动判断页面类型并返回对应菜单
 */
export function getCurrentPageMenu(): MenuItem[] {
  const currentPath = window.location.pathname
  
  if (currentPath.includes('/dashboard')) {
    return dashboardMenu
  } else if (currentPath.includes('/purchase') || currentPath.includes('/receive')) {
    return defaultMenu
  } else {
    return defaultMenu
  }
}

/**
 * 权限检查函数
 */
export function hasPermission(menuItem: MenuItem, userRole?: string, userPermissions?: string[]): boolean {
  // 如果没有权限要求，直接返回 true
  if (!menuItem.requiredRole && !menuItem.requiredPermission) {
    return true
  }
  
  // 检查角色权限
  if (menuItem.requiredRole && userRole) {
    if (!menuItem.requiredRole.includes(userRole)) {
      return false
    }
  }
  
  // 检查功能权限
  if (menuItem.requiredPermission && userPermissions) {
    const hasRequiredPermission = menuItem.requiredPermission.some(permission => 
      userPermissions.includes(permission)
    )
    if (!hasRequiredPermission) {
      return false
    }
  }
  
  return true
}

/**
 * 过滤菜单项，只返回用户有权限的项目
 */
export function filterMenuItems(menuItems: MenuItem[], userRole?: string, userPermissions?: string[]): MenuItem[] {
  return menuItems.filter(item => hasPermission(item, userRole, userPermissions))
}

/**
 * 菜单配置导出
 */
export const userMenuConfig = {
  dashboard: dashboardMenu,
  default: defaultMenu,
  getMenuByPage,
  getCurrentPageMenu,
  hasPermission,
  filterMenuItems
}

export default userMenuConfig