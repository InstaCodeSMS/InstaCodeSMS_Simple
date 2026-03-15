/**
 * 主题切换组件
 * 
 * Why: 提供可复用的主题切换按钮，支持 Sun/Moon 图标切换
 * 所有页面都可以直接使用这个组件，无需重复编写主题切换逻辑
 */

export default function ThemeToggle(): string {
  return `
  <button 
    type="button"
    @click="toggleTheme()"
    class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
    style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color-light);"
    :title="theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')"
    aria-label="切换主题">
    <i x-show="theme === 'dark'" class="fas fa-sun text-yellow-500" style="font-weight: 900;"></i>
    <i x-show="theme === 'light'" class="fas fa-moon text-blue-500" style="font-weight: 900;"></i>
  </button>`
}