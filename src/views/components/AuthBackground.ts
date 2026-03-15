/**
 * AuthBackground - 认证页面共享背景样式组件
 * 
 * Why: 登录/注册页面共用同一套装饰背景，避免代码重复
 * 使用方式: 在 main 标签上添加 authBackgroundClass 类名
 */

import { html, raw } from 'hono/html'

/**
 * 认证页面背景 CSS 类名
 */
export const authBackgroundClass = 'auth-background'

/**
 * 认证页面背景 CSS 样式
 * 包含渐变装饰效果，支持明暗主题
 */
export const authBackgroundStyle = html`
<style>
  /* 认证页面装饰背景 */
  .auth-background {
    position: relative;
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.04) 0%, transparent 70%),
      var(--bg-primary);
    background-attachment: fixed;
    min-height: 100vh;
  }
  
  /* 暗色主题增强效果 */
  .dark .auth-background {
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.06) 0%, transparent 70%),
      var(--bg-primary);
  }
  
  /* 亮色主题 */
  .light .auth-background {
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.03) 0%, transparent 70%),
      var(--bg-primary);
  }
  
  /* 卡片容器样式增强 */
  .auth-card {
    backdrop-filter: blur(12px);
    background: rgba(var(--bg-primary-rgb, 12, 15, 22), 0.8);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .light .auth-card {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03),
      0 0 0 1px rgba(0, 0, 0, 0.05);
  }
</style>
`

/**
 * 认证页面背景样式（包含 CSS 字符串）
 * 用于在页面 head 中注入样式
 */
export function getAuthBackgroundStyle(): string {
  return `
  /* 认证页面装饰背景 */
  .auth-background {
    position: relative;
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.04) 0%, transparent 70%),
      var(--bg-primary);
    background-attachment: fixed;
    min-height: 100vh;
  }
  
  /* 暗色主题增强效果 */
  .dark .auth-background {
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.06) 0%, transparent 70%),
      var(--bg-primary);
  }
  
  /* 亮色主题 */
  .light .auth-background {
    background: 
      radial-gradient(ellipse at 10% 90%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.03) 0%, transparent 70%),
      var(--bg-primary);
  }
  
  /* 卡片容器样式增强 */
  .auth-card {
    backdrop-filter: blur(12px);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .light .auth-card {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03),
      0 0 0 1px rgba(0, 0, 0, 0.05);
  }
  `
}