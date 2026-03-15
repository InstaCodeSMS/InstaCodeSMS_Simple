/**
 * Purchase 页面视图
 * 购买服务页面
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 * 使用 Layout 组件避免重复的 HTML 结构
 * 使用全局 t() 函数实现多语言支持
 */

import Layout from '@/views/components/Layout'
import { raw } from 'hono/html'
import type { Language } from '@/i18n'

export default function PurchasePage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <!-- 主内容区 -->
  <main x-data="purchaseApp()" class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] rounded-full pointer-events-none"
         :class="theme === 'dark' ? 'bg-blue-600/5 blur-[120px]' : 'bg-blue-400/10 blur-[150px]'"></div>
    
    <div class="max-w-7xl mx-auto relative z-10">
      <!-- 测试提示栏 -->
      <div class="mb-8 p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm"
           x-show="!hideTestNotice"
           style="border-color: var(--border-color); background-color: var(--bg-tertiary);">
        <div class="flex items-center gap-3">
          <span class="text-yellow-500 text-lg">⚠️</span>
          <div class="flex-1">
            <div class="text-sm font-bold text-yellow-500 uppercase tracking-wider" x-text="t('purchase.test_mode_warning')"></div>
            <div class="text-xs mt-1" style="color: var(--text-muted);" x-text="t('purchase.test_mode_notice')"></div>
          </div>
          <button @click="hideTestNotice = true"
                  class="text-xs opacity-50 hover:opacity-100 transition-colors"
                  style="color: var(--text-muted);">不再显示</button>
        </div>
      </div>

      <!-- 标题区域 -->
      <div class="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div>
          <h2 class="text-[10px] font-mono tracking-[0.4em] uppercase mb-4 italic" style="color: var(--accent-blue);">
            <span x-text="t('purchase.subtitle')"></span>
          </h2>
          <h1 class="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none" style="color: var(--text-primary);">
            <span x-text="t('purchase.title').split('虚拟终端')[0]"></span><span style="color: var(--accent-blue);" x-text="t('purchase.title').includes('Virtual') ? 'Virtual Terminal' : '虚拟终端'"></span>
          </h1>
        </div>
        
        <!-- 搜索和排序 -->
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-80">
            <input x-model="searchQuery" type="text" :placeholder="t('purchase.search_placeholder')"
                   class="w-full border rounded-2xl px-6 py-4 text-xs transition-all outline-none focus:ring-4 focus:ring-blue-500/10"
                   style="background-color: var(--bg-input); border-color: var(--border-color-light); color: var(--text-primary);" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          </div>
          
          <div class="relative">
            <button @click="showSortMenu = !showSortMenu"
                    class="border rounded-2xl px-6 py-4 text-xs transition-all whitespace-nowrap flex items-center gap-2"
                    style="background-color: var(--bg-input); border-color: var(--border-color-light); color: var(--text-primary);">
              <span x-text="getSortLabel()"></span>
              <span class="text-[8px] opacity-50">▼</span>
            </button>
            <div x-show="showSortMenu" x-cloak @click.away="showSortMenu = false" x-transition
                 class="absolute top-full mt-2 right-0 border rounded-xl overflow-hidden shadow-lg z-50 min-w-[180px]"
                 style="background-color: var(--bg-secondary); border-color: var(--border-color-light);">
              <button @click="sortOption = 'default'; showSortMenu = false"
                      class="block w-full text-left px-5 py-3 text-xs transition-colors"
                      :class="sortOption === 'default' ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/5 hover:text-blue-500'"
                      style="color: var(--text-secondary);" x-text="t('purchase.sort_default')"></button>
              <button @click="sortOption = 'priceLow'; showSortMenu = false"
                      class="block w-full text-left px-5 py-3 text-xs transition-colors"
                      :class="sortOption === 'priceLow' ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/5 hover:text-blue-500'"
                      style="color: var(--text-secondary);" x-text="t('purchase.sort_price_low')"></button>
              <button @click="sortOption = 'priceHigh'; showSortMenu = false"
                      class="block w-full text-left px-5 py-3 text-xs transition-colors"
                      :class="sortOption === 'priceHigh' ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/5 hover:text-blue-500'"
                      style="color: var(--text-secondary);" x-text="t('purchase.sort_price_high')"></button>
            </div>
          </div>
        </div>
      </div>

      <!-- 产品卡片网格 -->
      <div x-show="filteredServices.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        <template x-for="service in filteredServices" :key="service.id">
          <div @click="service.num > 0 ? openModal(service) : null"
               class="group relative flex flex-col h-full p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden card-hover"
               :class="service.num > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
               :style="'background-color: var(--bg-secondary); border-color: var(--border-color); box-shadow: var(--shadow-card);'">
            
            <div x-show="service.num === 0" 
                 class="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                 :class="theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'"
                 x-text="t('purchase.out_of_stock')"></div>
            
            <div class="flex items-start justify-between mb-10">
              <div class="w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all duration-500 border"
                   :class="service.num > 0 ? 'group-hover:bg-blue-600 group-hover:text-white' : 'grayscale'"
                   style="background-color: var(--bg-tertiary); border-color: var(--border-color);">
                <span x-text="getServiceIcon(service.id)"></span>
              </div>
              <div class="text-right">
                <div class="text-[9px] font-mono uppercase tracking-widest mb-1 italic" style="color: var(--text-muted);" x-text="t('purchase.starting_price')"></div>
                <div class="text-3xl font-black font-mono tracking-tighter italic" style="color: var(--text-primary);">
                  <span class="text-sm font-normal not-italic opacity-40 mr-1">¥</span>
                  <span x-text="(service.sales_price || 0).toFixed(2)"></span>
                </div>
              </div>
            </div>
            
            <div class="flex-grow">
              <h3 class="text-xl font-black mb-3 uppercase tracking-tighter transition-colors"
                  :class="service.num > 0 ? 'group-hover:text-blue-500' : ''"
                  style="color: var(--text-primary);"
                  x-text="service.title"></h3>
              <p class="text-[11px] leading-relaxed line-clamp-2 min-h-[2.5rem]" style="color: var(--text-muted);">
                <span x-text="service.description || (this.lang === 'zh' ? '提供5天稳定使用保障' : '5-day stable usage guaranteed')"></span>
              </p>
            </div>
            
            <div class="mt-4 pt-4 border-t" style="border-color: var(--border-color);">
              <div class="flex items-center justify-between text-[10px]">
                <span class="uppercase tracking-wider" style="color: var(--text-muted);" x-text="t('purchase.stock')"></span>
                <span :class="service.num > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'"
                      x-text="service.num > 0 ? service.num : t('purchase.no_stock')"></span>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <div x-show="loading" class="text-center py-20">
        <i class="fas fa-spinner fa-spin text-4xl" style="color: var(--accent-blue);"></i>
        <p class="mt-4 text-sm" style="color: var(--text-muted);" x-text="t('common.loading')"></p>
      </div>
      
      <div x-show="!loading && filteredServices.length === 0" class="text-center py-20">
        <i class="fas fa-search text-4xl" style="color: var(--text-muted);"></i>
        <p class="mt-4 text-sm" style="color: var(--text-muted);" x-text="t('purchase.not_found')"></p>
      </div>
    </div>

    <!-- 购买弹窗 -->
    <div x-show="isModalOpen" x-cloak 
         class="fixed inset-0 flex items-center justify-center p-4 sm:p-6 z-[9999]"
         @keydown.escape.window="closeModal()">
      <div class="absolute inset-0 backdrop-blur-2xl"
           :class="theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/30'"
           @click="closeModal()"></div>
      
      <div class="relative w-full max-w-2xl border rounded-[3rem] overflow-hidden flex flex-col modal-content"
           :class="theme === 'dark' 
             ? 'bg-[#131620] border-[rgba(200,210,240,0.06)] shadow-2xl shadow-black/40' 
             : 'bg-white border-slate-200 shadow-2xl shadow-slate-300/40'">
        
        <div class="relative bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white">
          <div class="flex flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-14 h-14 shrink-0 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">
                <span x-text="activeService ? getServiceIcon(activeService.id) : '📱'"></span>
              </div>
              <div class="min-w-0">
                <h2 class="text-xl font-black uppercase tracking-tighter truncate" x-text="activeService?.title"></h2>
                <p class="text-[9px] font-bold text-blue-100 uppercase opacity-60 tracking-widest italic" x-text="t('purchase.configure_node')"></p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-[10px] font-mono uppercase opacity-60 mb-1 tracking-widest" x-text="t('purchase.total_cost')"></div>
              <div class="text-3xl font-black font-mono tracking-tighter">
                <span x-text="calculateTotal()"></span>
                <span class="text-xs uppercase opacity-70">CNY</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-8 space-y-10 custom-scrollbar overflow-y-auto max-h-[60vh]">
          
          <!-- Step 1: 选择区域 -->
          <div class="space-y-4">
            <p class="text-[9px] font-black uppercase tracking-widest" style="color: var(--text-muted);">
              Step 1 / <span x-text="t('purchase.step_region')"></span>
            </p>
            <div class="flex gap-3">
              <div class="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-blue-500 bg-blue-600/10">
                <img src="https://flagcdn.com/w40/us.png" alt="US" class="w-6 h-4 rounded-sm shadow-sm" />
                <span class="text-sm font-bold" style="color: var(--text-primary);">US</span>
                <i class="fas fa-check-circle text-blue-500 text-sm"></i>
              </div>
            </div>
            <p class="text-xs" style="color: var(--text-muted);" x-text="t('purchase.current_region_only')"></p>
          </div>

          <!-- Step 2: 选择有效期 -->
          <div class="space-y-4">
            <p class="text-[9px] font-black uppercase tracking-widest" style="color: var(--text-muted);">
              Step 2 / <span x-text="t('purchase.step_duration')"></span>
            </p>
            <div x-show="currentExpiryOptions.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <template x-for="(exp, idx) in currentExpiryOptions" :key="idx">
                <button @click="form.selectedExpiry = exp.expiry"
                        :class="form.selectedExpiry === exp.expiry 
                          ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/30' 
                          : 'border-[rgba(200,210,240,0.08)] bg-[#1a1e2c]'"
                        class="relative flex flex-col p-5 rounded-[1.5rem] border transition-all text-left group"
                        :style="theme === 'light' && form.selectedExpiry !== exp.expiry ? 'background-color: var(--bg-tertiary); border-color: var(--border-color-light);' : ''">
                  <span class="text-xl font-black font-mono" style="color: var(--text-primary);">
                    <span x-text="exp.label"></span>
                  </span>
                  <div class="text-[10px] font-mono font-bold" style="color: var(--accent-blue);">
                    ¥<span x-text="exp.price.toFixed(2)"></span>
                  </div>
                </button>
              </template>
            </div>
            <div x-show="currentExpiryOptions.length === 0" class="text-sm" style="color: var(--text-muted);" x-text="t('purchase.no_duration_options')"></div>
          </div>

          <!-- Step 3: 选择数量 -->
          <div class="space-y-4">
            <p class="text-[9px] font-black uppercase tracking-widest" style="color: var(--text-muted);">
              Step 3 / <span x-text="t('purchase.step_quantity')"></span>
            </p>
            <div class="flex items-center gap-4 p-2 rounded-2xl border w-fit"
                 style="background-color: var(--bg-tertiary); border-color: var(--border-color-light);">
              <button @click="form.quantity > 1 && form.quantity--"
                      class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                      style="background-color: var(--bg-secondary); color: var(--text-primary);">−</button>
              <div class="px-6 text-center">
                <span class="text-xl font-black font-mono" style="color: var(--text-primary);" x-text="form.quantity"></span>
                <p class="text-[8px] uppercase font-black tracking-tighter" style="color: var(--text-muted);" x-text="t('purchase.unit')"></p>
              </div>
              <button @click="form.quantity < (activeService?.num || 100) && form.quantity++"
                      class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                      style="background-color: var(--bg-secondary); color: var(--text-primary);">+</button>
            </div>
          </div>

          <!-- Step 4: 选择支付方式 -->
          <div class="space-y-4">
            <p class="text-[9px] font-black uppercase tracking-widest" style="color: var(--text-muted);">
              Step 4 / <span x-text="t('purchase.step_payment')"></span>
            </p>
            <div class="grid grid-cols-2 gap-4">
              <!-- 支付宝 -->
              <button @click="form.paymentMethod = 'alipay'"
                      :class="form.paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/30' : 'border-[rgba(200,210,240,0.08)]'"
                      class="relative flex flex-col items-center p-4 rounded-xl border transition-all group"
                      :style="theme === 'light' && form.paymentMethod !== 'alipay' ? 'background-color: var(--bg-tertiary); border-color: var(--border-color-light);' : ''">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">💳</span>
                  <div class="text-left">
                    <div class="text-sm font-bold" style="color: var(--text-primary);" x-text="t('purchase.alipay')"></div>
                    <div class="text-xs" style="color: var(--text-muted);">USD</div>
                  </div>
                </div>
                <i x-show="form.paymentMethod === 'alipay'" class="fas fa-check-circle text-blue-500 absolute top-2 right-2"></i>
              </button>
              <!-- USDT TRC20 -->
              <button @click="form.paymentMethod = 'usdt'"
                      :class="form.paymentMethod === 'usdt' ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/30' : 'border-[rgba(200,210,240,0.08)]'"
                      class="relative flex flex-col items-center p-4 rounded-xl border transition-all group"
                      :style="theme === 'light' && form.paymentMethod !== 'usdt' ? 'background-color: var(--bg-tertiary); border-color: var(--border-color-light);' : ''">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">₮</span>
                  <div class="text-left">
                    <div class="text-sm font-bold" style="color: var(--text-primary);">USDT</div>
                    <div class="text-xs" style="color: var(--text-muted);">TRC20</div>
                  </div>
                </div>
                <i x-show="form.paymentMethod === 'usdt'" class="fas fa-check-circle text-blue-500 absolute top-2 right-2"></i>
              </button>
            </div>
          </div>

          <div x-show="errorMessage" x-cloak class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div class="flex items-center gap-2 text-red-500">
              <i class="fas fa-exclamation-circle"></i>
              <span x-text="errorMessage"></span>
            </div>
          </div>
          
          <div class="pt-6 flex flex-row items-center gap-4 w-full border-t" style="border-color: var(--border-color);">
            <button @click="closeModal()" 
                    class="flex-1 py-5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors hover:opacity-80"
                    :class="theme === 'dark' ? 'border-[rgba(200,210,240,0.08)]' : 'border-slate-200'"
                    style="color: var(--text-muted);" x-text="t('purchase.cancel')"></button>
            <button @click="submitOrder()"
                    :disabled="isProcessing"
                    class="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
              <i x-show="!isProcessing" class="fas fa-shopping-cart mr-2"></i>
              <i x-show="isProcessing" class="fas fa-spinner fa-spin mr-2"></i>
              <span x-text="isProcessing ? t('purchase.processing') : t('purchase.confirm_purchase')"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div x-show="orderResult" x-cloak 
         class="fixed bottom-6 right-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-6 shadow-lg z-[9999]"
         style="background-color: var(--bg-secondary);">
      <div class="flex items-center gap-2 text-green-500 mb-2">
        <i class="fas fa-check-circle"></i>
        <span class="font-medium" x-text="$root.lang === 'zh' ? '购买成功！' : 'Purchase Successful!'"></span>
      </div>
      <div class="text-sm" style="color: var(--text-primary);">
        <p x-show="orderResult?.ordernum">
          <span x-text="$root.lang === 'zh' ? '订单号: ' : 'Order ID: '"></span>
          <span class="font-mono" x-text="orderResult?.ordernum"></span>
        </p>
        <p class="mt-1" style="color: var(--text-muted);">
          <span x-text="$root.lang === 'zh' ? '请前往' : 'Please go to'"></span>
          <a :href="'/' + $root.lang + '/receive'" class="text-blue-500 hover:underline" x-text="t('nav.receive')"></a>
          <span x-text="$root.lang === 'zh' ? '查看验证码' : 'to view codes'"></span>
        </p>
      </div>
      <button @click="orderResult = null" class="absolute top-2 right-2 text-xs opacity-50 hover:opacity-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </main>

  <script>
    function purchaseApp() {
      return {
        theme: localStorage.getItem('theme') || 'dark',
        lang: localStorage.getItem('lang') || 'zh',
        searchQuery: '',
        sortOption: 'default',
        showSortMenu: false,
        services: [],
        categories: [],
        loading: false,
        isModalOpen: false,
        isProcessing: false,
        activeService: null,
        prefixes: [],
        form: {
          selectedExpiry: 1,
          selectedPrefix: null,
          quantity: 1,
          paymentMethod: 'epay'
        },
        orderResult: null,
        errorMessage: null,
        expiryOptions: [
          { value: 1, days: '5-30', multiplier: 0.9, discount: 10 },
          { value: 2, days: '10-30', multiplier: 1, discount: 0 },
          { value: 3, days: '15-30', multiplier: 1, discount: 0 },
          { value: 4, days: '30-60', multiplier: 1, discount: 0 },
          { value: 5, days: '60-80', multiplier: 1, discount: 0 },
          { value: 6, days: '80+', multiplier: 1.1, discount: 0 }
        ],
        hideTestNotice: localStorage.getItem('hideTestNotice') === 'true',
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        get filteredServices() {
          let result = this.services.filter(s => 
            s.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
          if (this.sortOption === 'priceLow') {
            result = [...result].sort((a, b) => (a.sales_price || 0) - (b.sales_price || 0));
          } else if (this.sortOption === 'priceHigh') {
            result = [...result].sort((a, b) => (b.sales_price || 0) - (a.sales_price || 0));
          }
          return result;
        },
        
        // 当前产品的有效期选项（从 API 返回的数据中获取）
        get currentExpiryOptions() {
          if (!this.activeService || !this.activeService.expiry_options) {
            return [];
          }
          return this.activeService.expiry_options;
        },
        
        // 获取当前选中有效期的价格
        get selectedExpiryPrice() {
          const option = this.currentExpiryOptions.find(o => o.expiry === this.form.selectedExpiry);
          return option ? option.price : (this.activeService?.sales_price || 0);
        },
        
        init() {
          this.$watch('theme', val => localStorage.setItem('theme', val));
          this.$watch('lang', val => localStorage.setItem('lang', val));
          this.$watch('hideTestNotice', val => localStorage.setItem('hideTestNotice', val ? 'true' : 'false'));
          this.loading = true;
          fetch('/api/services')
            .then(res => res.json())
            .then(data => { 
              if(data.success) {
                this.services = data.data.list;
              }
              this.loading = false;
            })
            .catch(() => this.loading = false);
        },
        
        getServiceIcon(id) {
          const emojis = ['📱', '⚡', '🛡️', '🔑', '🚀', '🤖', '💬', '🌌', '📡', '🌐', '📧', '🎮', '🎬', '🎵', '📚'];
          // id 现在是 UUID 字符串，使用字符串的字符码求和来选择图标
          const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return emojis[hash % emojis.length];
        },
        
        getSortLabel() {
          if (this.sortOption === 'priceLow') return this.t('purchase.sort_price_low');
          if (this.sortOption === 'priceHigh') return this.t('purchase.sort_price_high');
          return this.t('purchase.sort_default');
        },
        
        calculateTotal() {
          if (!this.activeService) return '0.00';
          const qty = this.form.quantity || 1;
          const unitPrice = this.selectedExpiryPrice;
          return (unitPrice * qty).toFixed(2);
        },
        
        openModal(service) {
          this.activeService = service;
          // 默认选中第一个有效期选项
          const firstOption = service.expiry_options && service.expiry_options.length > 0 
            ? service.expiry_options[0].expiry 
            : 0;
          this.form.selectedExpiry = firstOption;
          this.form.selectedPrefix = null;
          this.form.quantity = 1;
          this.orderResult = null;
          this.errorMessage = null;
          this.isModalOpen = true;
          this.prefixes = [];
          // 使用 upstream_id 调用 prefixes API（上游 API 需要 upstream_id）
          if (service.upstream_id) {
            fetch('/api/services/' + service.upstream_id + '/prefixes')
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  this.prefixes = data.data.list || [];
                }
              });
          }
        },
        
        closeModal() {
          if (!this.isProcessing) {
            this.isModalOpen = false;
          }
        },
        
        async submitOrder() {
          this.isProcessing = true;
          this.errorMessage = null;
          
          try {
            const selectedOption = this.currentExpiryOptions.find(o => o.expiry === this.form.selectedExpiry);
            const totalAmount = parseFloat(this.calculateTotal());
            const unitPrice = totalAmount / this.form.quantity;
            
            const response = await fetch('/rpc/payment/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: totalAmount,
                payment_method: this.form.paymentMethod,
                product_info: {
                  service_id: this.activeService.id,
                  title: this.activeService.title,
                  quantity: this.form.quantity,
                  expiry: this.form.selectedExpiry,
                  expiry_days: selectedOption?.label || '未知',
                  unit_price: unitPrice
                },
                trade_type: this.form.paymentMethod === 'usdt' ? 'usdt.trc20' : 'alipay'
              })
            });
            
            const data = await response.json();
            
            if (data.success && data.data.payment_url) {
              // 直接跳转到易支付页面
              window.location.href = data.data.payment_url;
            } else {
              this.errorMessage = data.message || (this.lang === 'zh' ? '创建订单失败' : 'Failed to create order');
              this.isProcessing = false;
            }
          } catch (error) {
            this.errorMessage = this.lang === 'zh' ? '网络错误，请重试' : 'Network error, please try again';
            this.isProcessing = false;
          }
        }
      }
    }
  </script>`

  const result = Layout({
    title: '购买服务',
    children: raw(content),
    lang,
    csrfToken
  })
  return result.toString()
}