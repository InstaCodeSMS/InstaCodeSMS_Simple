/**
 * 主题管理 Hook
 * 
 * Why: 提供统一的主题管理逻辑，支持主题切换、持久化和状态同步
 * 所有组件都可以通过这个 Hook 访问和修改主题状态
 */

export interface ThemeHook {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  getTheme: () => 'dark' | 'light'
}

/**
 * 主题管理 Hook 工厂函数
 * 返回主题管理方法
 */
export function useTheme(): ThemeHook {
  return {
    theme: getStoredTheme(),
    toggleTheme,
    setTheme,
    getTheme
  }
}

/**
 * 获取存储的主题
 */
function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
}

/**
 * 切换主题
 */
function toggleTheme(): void {
  const currentTheme = getStoredTheme()
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

/**
 * 设置主题
 */
function setTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return
  
  // 存储到 localStorage
  localStorage.setItem('theme', theme)
  
  // 更新 DOM 类名
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')
  
  // 触发主题变更事件，通知其他组件
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: { theme }
  }))
}

/**
 * 获取当前主题
 */
function getTheme(): 'dark' | 'light' {
  return getStoredTheme()
}