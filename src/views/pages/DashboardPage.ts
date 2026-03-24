/**
 * Dashboard 页面视图
 * 用户中心页面 - 支持多语言
 * 使用新的侧边栏布局
 */

import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'
import { DashboardContent } from '../partials/DashboardContent'
import DashboardHeader from '../components/DashboardHeader'

export function DashboardPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <div class="min-h-screen">
    ${Sidebar()}
    <div class="transition-all duration-300">
      <div class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
        ${DashboardContent(csrfToken)}
      </div>
    </div>
  </div>`

  return Layout({
    title: 'Dashboard',
    children: raw(content),
    lang,
    csrfToken,
    headerType: 'dashboard',
    showSidebar: true,
    showFooter: false
  }).toString()
}
