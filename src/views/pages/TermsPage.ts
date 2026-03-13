/**
 * 服务条款页面视图
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 * 使用 Layout 组件避免重复的 HTML 结构
 * 使用全局 t() 函数实现多语言支持
 * 采用行业通用的长文本布局，避免卡片式设计
 */

import Layout from '@/views/components/Layout'
import { raw } from 'hono/html'
import type { Language } from '@/i18n'

export default function TermsPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <!-- 主内容区 -->
  <main class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] rounded-full pointer-events-none"
         :class="theme === 'dark' ? 'bg-blue-600/5 blur-[120px]' : 'bg-blue-400/10 blur-[150px]'"></div>
    
    <div class="max-w-4xl mx-auto relative z-10">
      <!-- 标题区域 -->
      <div class="mb-16">
        <h2 class="text-[10px] font-mono tracking-[0.4em] uppercase mb-4 italic" style="color: var(--accent-blue);">
          <span x-text="t('terms.legal_agreement')"></span>
        </h2>
        <h1 class="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none" style="color: var(--text-primary);">
          <span x-text="t('terms.title')"></span>
        </h1>
        <p class="mt-6 text-sm font-mono uppercase tracking-widest" style="color: var(--text-muted);" x-text="t('terms.last_updated')"></p>
        <p class="mt-4 text-sm" style="color: var(--text-muted);" x-text="t('terms.language_notice')"></p>
      </div>

      <!-- 内容区域 - 使用行业通用的长文本布局 -->
      <div class="space-y-12 border rounded-2xl p-8 md:p-12 backdrop-blur-xl"
           :class="theme === 'dark' 
             ? 'bg-[#131620]/50 border-[rgba(200,210,240,0.06)]' 
             : 'bg-white/80 border-slate-200/80 shadow-md shadow-slate-200/30'">
        
        <!-- 第1节：具有约束力的协议 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">1. <span x-text="t('terms.section1_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section1_content')"></p>
          </div>
        </section>

        <!-- 第2节：服务描述 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">2. <span x-text="t('terms.section2_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section2_content')"></p>
            <ul class="list-disc pl-5 space-y-2 text-sm">
              <li style="color: var(--text-secondary);" x-text="t('terms.section2_list_1')"></li>
              <li style="color: var(--text-secondary);" x-text="t('terms.section2_list_2')"></li>
              <li style="color: var(--text-secondary);" x-text="t('terms.section2_list_3')"></li>
              <li style="color: var(--text-secondary);" x-text="t('terms.section2_list_4')"></li>
            </ul>
          </div>
        </section>

        <!-- 第3节：账户与注册 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">3. <span x-text="t('terms.section3_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section3_content')"></p>
          </div>
        </section>

        <!-- 第4节：地区合规 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">4. <span x-text="t('terms.section4_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section4_content')"></p>
          </div>
        </section>

        <!-- 第5节：禁止使用 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">5. <span x-text="t('terms.section5_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section5_content')"></p>
          </div>
        </section>

        <!-- 第6节：服务可用性与上游依赖 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">6. <span x-text="t('terms.section6_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section6_content')"></p>
          </div>
        </section>

        <!-- 第7节：加密货币支付条款 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">7. <span x-text="t('terms.section7_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section7_content')"></p>
          </div>
        </section>

        <!-- 第8节：多支付渠道条款 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">8. <span x-text="t('terms.section8_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section8_content')"></p>
          </div>
        </section>

        <!-- 第9节：支付、积分与退款政策 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">9. <span x-text="t('terms.section9_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section9_content')"></p>
          </div>
        </section>

        <!-- 第10节：数据保留与隐私 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">10. <span x-text="t('terms.section10_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section10_content')"></p>
          </div>
        </section>

        <!-- 第11节：访问令牌机制 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">11. <span x-text="t('terms.section11_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section11_content')"></p>
          </div>
        </section>

        <!-- 第12节：订单超时与过期 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">12. <span x-text="t('terms.section12_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section12_content')"></p>
          </div>
        </section>

        <!-- 第13节：免责声明 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">13. <span x-text="t('terms.section13_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section13_content')"></p>
          </div>
        </section>

        <!-- 第14节：责任限制 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">14. <span x-text="t('terms.section14_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section14_content')"></p>
          </div>
        </section>

        <!-- 第15节：赔偿 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">15. <span x-text="t('terms.section15_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section15_content')"></p>
          </div>
        </section>

        <!-- 第16节：知识产权 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">16. <span x-text="t('terms.section16_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section16_content')"></p>
          </div>
        </section>

        <!-- 第17节：服务与条款修改 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">17. <span x-text="t('terms.section17_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section17_content')"></p>
          </div>
        </section>

        <!-- 第18节：争议解决 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">18. <span x-text="t('terms.section18_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section18_content')"></p>
          </div>
        </section>

        <!-- 第19节：其他条款 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">19. <span x-text="t('terms.section19_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section19_content')"></p>
          </div>
        </section>

        <!-- 第20节：联系信息 -->
        <section class="border-l-2 border-blue-500/30 pl-6">
          <h3 class="text-xl font-bold mb-4 text-blue-500">20. <span x-text="t('terms.section20_title')"></span></h3>
          <div class="space-y-4 text-sm leading-relaxed">
            <p style="color: var(--text-secondary);" x-text="t('terms.section20_content')"></p>
          </div>
        </section>

        <!-- 底部操作区 -->
        <div class="pt-8 border-t border-blue-500/20 flex justify-between items-center">
          <div class="text-[10px] font-mono uppercase" style="color: var(--text-muted);" x-text="t('terms.footer_legal_notice')"></div>
          <a href="/${lang}/purchase" 
             class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2 rounded-full transition-all transform hover:scale-105 active:scale-95 uppercase tracking-tighter shadow-lg shadow-blue-600/20">
            <span x-text="t('terms.back_home')"></span>
          </a>
        </div>
      </div>
    </div>
  </main>

  <script>
    function termsPageApp() {
      return {
        theme: localStorage.getItem('theme') || 'dark',
        lang: localStorage.getItem('lang') || 'zh',
        t(key) {
          return window.t ? window.t(key) : key;
        }
      }
    }
  </script>`

  const result = Layout({
    title: '服务条款',
    children: raw(content),
    lang,
    csrfToken
  })
  return result.toString()
}