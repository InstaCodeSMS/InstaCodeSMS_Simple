/**
 * 主题提供者组件
 * 
 * Why: 提供全局主题上下文，自动初始化主题状态和事件监听
 * 所有需要主题功能的页面都应该包含这个组件
 */

export default function ThemeProvider(): string {
  return `
  <script>
    // 主题提供者初始化脚本
    document.addEventListener('DOMContentLoaded', function() {
      // 初始化主题
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      document.documentElement.classList.toggle('light', savedTheme === 'light');
      
      // 初始化语言
      const savedLang = localStorage.getItem('lang') || 'zh';
      document.documentElement.lang = savedLang;
      
      // 监听主题变更事件，确保 DOM 状态同步
      window.addEventListener('themechange', (e) => {
        if (e.detail && e.detail.theme) {
          const theme = e.detail.theme;
          document.documentElement.classList.toggle('dark', theme === 'dark');
          document.documentElement.classList.toggle('light', theme === 'light');
        }
      });
    });
  </script>`
}