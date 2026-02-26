/**
 * Success 页面视图
 * 支付成功页面
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 * 使用 Layout 组件避免重复的 HTML 结构
 */

import Layout from '../components/index.ts'
import { raw } from 'hono/html'

export default function SuccessPage(csrfToken: string = ''): string {
  const content = `
  <style>
    @keyframes bounce {
      0%, 100% { transform: translateY(-5%); }
      50% { transform: translateY(0); }
    }
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    
    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  </style>

  <main x-data="successApp()" class="min-h-screen py-24 px-6 relative flex items-center justify-center overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] rounded-full pointer-events-none"
         :class="theme === 'dark' ? 'bg-green-600/5 blur-[120px]' : 'bg-green-400/10 blur-[150px]'"></div>

    <div class="max-w-xl w-full relative z-10">
      <div class="border rounded-[3rem] overflow-hidden transition-colors duration-300"
           :class="theme === 'dark' 
             ? 'bg-[#131620] border-[rgba(200,210,240,0.06)] shadow-2xl shadow-black/30' 
             : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'">
        
        <!-- 成功头部 -->
        <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-white/10 opacity-50"></div>
          <div class="relative">
            <!-- 成功图标 -->
            <div class="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <div class="relative">
                <div class="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                <svg class="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tighter mb-2">支付成功</h1>
            <p class="text-sm opacity-80">Payment Successful</p>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="p-8 space-y-6">
          <!-- 订单信息卡片 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 rounded-2xl transition-colors"
                 :class="theme === 'dark' ? 'bg-[#1a1e2c]' : 'bg-slate-50'">
              <span class="text-xs font-mono uppercase tracking-widest" style="color: var(--text-muted);">订单编号</span>
              <code class="text-sm font-mono font-bold text-blue-500" x-text="orderId"></code>
            </div>
            
            <div x-show="phoneNumber" class="flex items-center justify-between p-4 rounded-2xl transition-colors"
                 :class="theme === 'dark' ? 'bg-[#1a1e2c]' : 'bg-slate-50'">
              <span class="text-xs font-mono uppercase tracking-widest" style="color: var(--text-muted);">手机号码</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold" style="color: var(--text-primary);" x-text="phoneNumber"></span>
                <button @click="copyToClipboard(phoneNumber)" 
                        class="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors">
                  复制
                </button>
              </div>
            </div>
            
            <div x-show="token" class="flex items-center justify-between p-4 rounded-2xl transition-colors"
                 :class="theme === 'dark' ? 'bg-[#1a1e2c]' : 'bg-slate-50'">
              <span class="text-xs font-mono uppercase tracking-widest" style="color: var(--text-muted);">访问令牌</span>
              <div class="flex items-center gap-2">
                <code class="text-sm font-mono font-bold text-green-500 max-w-[200px] truncate" x-text="token"></code>
                <button @click="copyToClipboard(token)" 
                        class="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors">
                  复制
                </button>
              </div>
            </div>
          </div>

          <!-- 提示信息 -->
          <div class="p-4 rounded-2xl text-center"
               :class="theme === 'dark' 
                 ? 'bg-blue-600/5 border border-blue-600/10' 
                 : 'bg-blue-50 border border-blue-100'">
            <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
              <span class="font-bold text-blue-500">💡 温馨提示：</span><br/>
              请妥善保管您的访问令牌，用于在接码终端接收验证码。<br/>
              手机号码将用于接收短信验证码。
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <a href="/purchase" 
               class="flex-1 py-4 border rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-colors hover:opacity-80"
               :class="theme === 'dark' ? 'border-[rgba(200,210,240,0.08)]' : 'border-slate-200'"
               style="color: var(--text-muted);">
              继续购买
            </a>
            <a :href="'/receive?token=' + (token || '')" 
               class="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-center text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
              前往接码终端
            </a>
          </div>
        </div>

        <!-- 底部状态栏 -->
        <div class="py-4 px-8 border-t text-center transition-colors duration-300"
             :class="theme === 'dark' 
               ? 'bg-[#0f1219] border-[rgba(200,210,240,0.06)]' 
               : 'bg-slate-50 border-slate-100'">
          <p class="text-[10px] font-mono uppercase tracking-widest" style="color: var(--text-muted);">
            感谢您的信任，祝您使用愉快 🎉
          </p>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div x-show="toastShow" x-cloak
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-y-4"
         x-transition:enter-end="opacity-1 transform translate-y-0"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-1"
         x-transition:leave-end="opacity-0"
         class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-green-600 text-white rounded-2xl font-bold tracking-widest uppercase shadow-2xl shadow-green-600/30 text-[10px]">
      <span x-text="toastMsg"></span>
    </div>
  </main>

  <script>
    function successApp() {
      return {
        theme: localStorage.getItem('theme') || 'dark',
        orderId: '',
        phoneNumber: '',
        token: '',
        toastShow: false,
        toastMsg: '',
        
        init() {
          this.$watch('theme', val => localStorage.setItem('theme', val));
          
          const params = new URLSearchParams(window.location.search);
          this.orderId = params.get('order_id') || '未知';
          this.phoneNumber = params.get('tel') || '';
          this.token = params.get('token') || '';
        },
        
        copyToClipboard(text) {
          if (!text) return;
          navigator.clipboard.writeText(text).then(() => {
            this.showToast('已复制到剪贴板');
          }).catch(() => {
            this.fallbackCopy(text);
          });
        },
        
        fallbackCopy(text) {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            this.showToast('已复制到剪贴板');
          } catch (e) {
            this.showToast('复制失败，请手动复制');
          }
          document.body.removeChild(textarea);
        },
        
        showToast(msg) {
          this.toastMsg = msg;
          this.toastShow = true;
          setTimeout(() => {
            this.toastShow = false;
          }, 2000);
        }
      }
    }
  </script>`

  const result = Layout({
    title: '支付成功',
    children: raw(content),
    showHeader: false,
    showFooter: false,
    csrfToken
  })
  return result.toString()
}
