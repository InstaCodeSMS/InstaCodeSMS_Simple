/**
 * Checkout 页面视图
 * 订单确认 + 支付页面
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 * 使用 Layout 组件避免重复的 HTML 结构
 * 使用全局 t() 函数实现多语言支持
 */

import Layout from '@/views/components/Layout'
import { raw } from 'hono/html'
import type { Language } from '@/i18n'

export default function CheckoutPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  </style>

  <main x-data="checkoutApp()" class="min-h-screen py-24 px-6 relative flex items-center justify-center overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] rounded-full pointer-events-none"
         :class="theme === 'dark' ? 'bg-blue-600/5 blur-[120px]' : 'bg-blue-400/10 blur-[150px]'"></div>

    <div class="max-w-xl w-full relative z-10">
      <div class="border rounded-[3rem] overflow-hidden transition-colors duration-300"
           :class="theme === 'dark' 
             ? 'bg-[#131620] border-[rgba(200,210,240,0.06)] shadow-2xl shadow-black/30' 
             : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'">
        
        <!-- 头部蓝色区域 -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white relative">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-[10px] font-mono tracking-[0.3em] uppercase opacity-70 mb-1">
                <span x-text="tradeId ? this.t('checkout.waiting_payment') : this.t('checkout.initializing')"></span>
              </h2>
              <h1 class="text-2xl font-black uppercase tracking-tighter italic">
                <span x-text="tradeId ? this.t('checkout.please_confirm') : this.t('checkout.preparing_order')"></span>
              </h1>
            </div>
            <div x-show="tradeId" class="text-right">
              <div class="text-[10px] font-mono opacity-70 mb-1 uppercase" x-text="this.t('checkout.time_left')"></div>
              <div class="text-2xl font-black font-mono tracking-tighter text-yellow-300" x-text="formatTime(timeLeft)"></div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/10">
              <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📦</div>
              <div class="flex-1">
                <div class="text-[9px] font-bold uppercase opacity-60" x-text="this.t('checkout.product')"></div>
                <div class="text-sm font-black uppercase tracking-tight" x-text="productName || 'Loading...'"></div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-3">
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1" x-text="this.t('checkout.region')"></div>
                <div class="text-xs font-black flex items-center gap-1">
                  <img src="https://flagcdn.com/w20/us.png" alt="US" class="w-4 h-3 rounded-sm" />
                  <span x-text="region"></span>
                </div>
              </div>
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1" x-text="this.t('checkout.quantity')"></div>
                <div class="text-xs font-black" x-text="'x' + quantity"></div>
              </div>
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1" x-text="lang === 'zh' ? '有效期' : 'Duration'"></div>
                <div class="text-xs font-black" x-text="duration + (lang === 'zh' ? ' ' + this.t('checkout.days') : ' ' + this.t('checkout.days'))"></div>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
              <div class="text-[9px] font-bold uppercase opacity-60" x-text="this.t('checkout.amount_due')"></div>
              <div class="text-2xl font-black font-mono tracking-tighter">
                <span x-text="actualAmount || totalAmount"></span>
                <span class="text-xs">USDT</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="p-10 space-y-8">
          <!-- 错误状态 -->
          <div x-show="error" x-cloak class="flex flex-col items-center py-10 space-y-4">
            <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-3xl">❌</div>
            <p class="text-sm text-center" style="color: var(--text-secondary);" x-text="error"></p>
            <button @click="goBack()" class="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase" x-text="this.t('checkout.return_retry')"></button>
          </div>

          <!-- 加载状态 -->
          <div x-show="!tradeId && !error" class="flex flex-col items-center py-10 space-y-4">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[10px] font-mono uppercase tracking-widest animate-pulse" style="color: var(--text-muted);" x-text="lang === 'zh' ? '正在生成支付通道...' : 'Generating payment channel...'"></p>
          </div>

          <!-- 支付内容 -->
          <div x-show="tradeId && !error" x-cloak class="flex flex-col items-center justify-center space-y-6">
          <!-- 易支付跳转 -->
          <div x-show="paymentMethod === 'epay' && paymentUrl" class="w-full space-y-6">
            <div class="flex items-center justify-center gap-2 border p-4 rounded-2xl transition-colors"
                 :class="theme === 'dark'
                   ? 'bg-[#1a1e2c] border-[rgba(200,210,240,0.08)]'
                   : 'bg-slate-50 border-slate-200'">
              <span class="text-[10px]" style="color: var(--text-secondary);" x-text="lang === 'zh' ? '支付金额：' : 'Amount: '"></span>
              <span class="text-xl font-black text-blue-500">¥<span x-text="actualAmount"></span></span>
            </div>
            <button @click="redirectToPayment()"
              class="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/40 transition-all"
              x-text="this.t('checkout.proceed_payment')"></button>
          </div>

          <!-- 支付宝二维码 -->
          <div x-show="paymentMethod !== 'epay' || !paymentUrl" class="w-full space-y-6">
            <div class="relative group flex justify-center">
              <div class="absolute -inset-4 bg-blue-600/15 rounded-[2rem] blur-xl"></div>
              <div class="relative w-48 h-48 bg-white p-3 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                <img id="qrcode-img" :src="qrCodeUrl" alt="QR Code" class="w-full h-full rounded-2xl" x-show="qrCodeUrl" />
              </div>
            </div>

            <div class="w-full space-y-2">
              <p class="text-[9px] font-black uppercase text-center tracking-widest" style="color: var(--text-muted);" x-text="this.t('checkout.scan_alipay')"></p>
              <div class="flex items-center justify-center gap-2 border p-4 rounded-2xl transition-colors"
                   :class="theme === 'dark'
                     ? 'bg-[#1a1e2c] border-[rgba(200,210,240,0.08)]'
                     : 'bg-slate-50 border-slate-200'">
                <span class="text-[10px]" style="color: var(--text-secondary);" x-text="lang === 'zh' ? '支付金额：' : 'Amount: '"></span>
                <span class="text-xl font-black text-blue-500">¥<span x-text="actualAmount"></span></span>
              </div>
            </div>

            <div class="w-full p-4 rounded-2xl text-center"
                 :class="theme === 'dark'
                   ? 'bg-amber-600/5 border border-amber-600/10'
                   : 'bg-amber-50 border border-amber-100'">
              <p class="text-[10px] leading-relaxed" style="color: var(--text-secondary);">
                <span class="text-amber-500 font-bold" x-text="this.t('checkout.important_notice') + '：'"></span><br/>
                <span x-text="this.t('checkout.exact_amount')"></span>：<span class="font-bold text-amber-600">¥<span x-text="actualAmount"></span></span><br/>
                <span x-text="this.t('checkout.timeout_notice')"></span>
              </p>
            </div>

            <div x-show="isChecking" class="flex items-center justify-center gap-2 text-[10px]" style="color: var(--text-muted);">
              <div class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span x-text="this.t('checkout.waiting_confirmation')"></span>
            </div>
          </div>
            
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <button @click="goBack()" 
                class="flex-1 py-4 border rounded-2xl text-[10px] font-black uppercase transition-all"
                :class="theme === 'dark' ? 'border-[rgba(200,210,240,0.08)]' : 'border-slate-200'"
                style="color: var(--text-muted);" x-text="this.t('checkout.cancel_order')"></button>
              <button @click="checkPaymentNow()" 
                :disabled="isProcessing"
                class="flex-1 sm:flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50">
                <span x-text="isProcessing ? this.t('purchase.processing') : this.t('checkout.paid_check')"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部状态栏 -->
        <div class="py-4 px-10 border-t text-[8px] font-mono uppercase tracking-widest flex justify-between transition-colors duration-300"
             :class="theme === 'dark' 
               ? 'bg-[#0f1219] border-[rgba(200,210,240,0.06)]' 
               : 'bg-slate-50 border-slate-100'"
             style="color: var(--text-muted);">
          <span x-text="this.t('checkout.method') + ': ' + (paymentMethod?.toUpperCase() || '---')"></span>
          <span x-text="this.t('checkout.trade') + ': ' + (tradeId ? tradeId.substring(0, 8) + '...' : '---')"></span>
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
         class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-widest uppercase shadow-2xl shadow-blue-600/30 text-[10px]">
      <span x-text="toastMsg"></span>
    </div>
  </main>

  <script>
    function checkoutApp() {
      return {t(key) {
          return window.t ? window.t(key) : key;
        },
        
        theme: localStorage.getItem('theme') || 'dark',
        lang: localStorage.getItem('lang') || 'zh',
        orderId: '',
        tradeId: '',
        productName: '',
        region: 'US',
        duration: '5-30',
        quantity: 1,
        totalAmount: '0.00',
        actualAmount: '',
        walletAddress: '',
        paymentUrl: '',
        paymentMethod: '',
        expirationTime: 600,
        timeLeft: 600,
        qrCodeBase64: '',
        qrCodeUrl: '',
        error: null,
        isChecking: false,
        isProcessing: false,
        isCreating: false,
        timer: null,
        pollTimer: null,
        toastShow: false,
        toastMsg: '',
        
        init() {
          this.$watch('theme', val => localStorage.setItem('theme', val));
          this.$watch('lang', val => localStorage.setItem('lang', val));

          const params = new URLSearchParams(window.location.search);
          this.productName = params.get('title') || (this.lang === 'zh' ? '未知产品' : 'Unknown Product');
          this.region = params.get('region') || 'US';
          this.duration = params.get('duration') || '5-30';
          this.quantity = parseInt(params.get('quantity') || '1');
          this.totalAmount = params.get('amount') || '0.00';
          this.paymentMethod = params.get('method') || 'usdt';

          const serviceId = params.get('id');
          if (!serviceId) {
            this.error = this.lang === 'zh' ? '缺少产品信息，请重新选择' : 'Missing product info, please select again';
            return;
          }

          const expiryValue = parseInt(params.get('expiry') || '0');
          
          if (!this.isCreating) {
            this.isCreating = true;
            this.createPaymentOrder(serviceId, expiryValue);
          }
        },
        
        async createPaymentOrder(serviceId, expiryValue) {
          console.log('[Checkout] Creating payment order:', { serviceId, expiryValue, paymentMethod: this.paymentMethod });
          
          try {
            // 根据支付方式设置 trade_type
            const tradeType = this.paymentMethod === 'alipay' ? 'alipay' : 'usdt.trc20';
            console.log('[Checkout] trade_type:', tradeType);
            
            const response = await fetch('/rpc/payment/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: parseFloat(this.totalAmount),
                payment_method: this.paymentMethod,
                trade_type: tradeType,
                product_info: {
                  service_id: parseInt(serviceId),
                  title: this.productName,
                  quantity: this.quantity,
                  expiry: expiryValue,
                  expiry_days: this.duration,
                  unit_price: parseFloat(this.totalAmount) / this.quantity
                }
              })
            });

            const data = await response.json();
            console.log('[Checkout] API Response:', data);

            if (!data.success) {
              throw new Error(data.message || (this.lang === 'zh' ? '创建支付订单失败' : 'Failed to create payment order'));
            }

            if (!data.data || !data.data.trade_id || !data.data.order_id) {
              throw new Error(this.lang === 'zh' ? '支付平台返回数据异常，请稍后重试' : 'Payment platform returned invalid data');
            }

            this.orderId = data.data.order_id;
            this.tradeId = data.data.trade_id;
            this.actualAmount = data.data.actual_amount;
            this.expirationTime = data.data.expiration_time;
            this.timeLeft = data.data.expiration_time;
            this.paymentUrl = data.data.payment_url || '';
            this.qrCodeUrl = data.data.qr_code_url || this.generateQRCodeUrl(data.data.payment_url || '');

            this.startTimer();
            this.startPolling();

          } catch (err) {
            console.error('创建支付订单失败:', err);
            this.error = err.message || (this.lang === 'zh' ? '创建支付订单失败，请稍后重试' : 'Failed to create payment order');
          }
        },
        
        // 使用 QR Server API 生成二维码图片 URL
        // 避免 ORB 阻止问题，不需要加载外部 JS 库
        generateQRCodeUrl(text) {
          if (!text) return '';
          const size = 200;
          const encodedText = encodeURIComponent(text);
          return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodedText;
        },
        
        startTimer() {
          this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
              this.timeLeft--;
            } else {
              clearInterval(this.timer);
              clearInterval(this.pollTimer);
              this.error = this.t('checkout.payment_timeout');
            }
          }, 1000);
        },
        
        startPolling() {
          this.pollTimer = setInterval(() => {
            this.checkPaymentStatus();
          }, 5000);
          this.checkPaymentStatus();
        },
        
        async checkPaymentStatus() {
          if (!this.tradeId || this.isProcessing) return;
          this.isChecking = true;

          try {
            const response = await fetch('/rpc/payment/status?trade_id=' + this.tradeId);
            const data = await response.json();
            
            if (data.success && Number(data.data.status) === 2) {
              this.isProcessing = true;
              clearInterval(this.timer);
              clearInterval(this.pollTimer);
              this.showToast(this.t('checkout.creating_order'));
              await this.createUpstreamOrder();
            }
          } catch (err) {
            console.error('查询支付状态失败:', err);
          } finally {
            this.isChecking = false;
          }
        },
        
        async checkPaymentNow() {
          this.isProcessing = true;
          await this.checkPaymentStatus();
          if (!this.isProcessing) {
            this.showToast(this.lang === 'zh' ? '尚未检测到支付，请稍后重试' : 'Payment not detected, please try again');
          }
        },
        
        async createUpstreamOrder() {
          try {
            const orderResponse = await fetch('/rpc/payment/order/' + this.tradeId);
            const orderData = await orderResponse.json();

            if (!orderData.success) {
              throw new Error(this.lang === 'zh' ? '获取订单信息失败' : 'Failed to get order info');
            }

            const productInfo = orderData.data.product_info;

            const response = await fetch('/rpc/orders/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app_id: productInfo.service_id,
                type: 1,
                num: productInfo.quantity,
                expiry: productInfo.expiry
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              const tel = data.data.items?.[0]?.tel || '';
              const token = data.data.items?.[0]?.token || '';
              const ordernum = data.data.ordernum || this.orderId;

              window.location.href = '/' + this.lang + '/success?order_id=' + ordernum + '&tel=' + encodeURIComponent(tel) + '&token=' + encodeURIComponent(token);
            } else {
              throw new Error(data.message || this.t('checkout.order_failed'));
            }
          } catch (err) {
            console.error('创建上游订单失败:', err);
            this.error = this.t('checkout.contact_support');
            this.isProcessing = false;
          }
        },
        
        formatTime(s) {
          const min = Math.floor(s / 60);
          const sec = (s % 60).toString().padStart(2, '0');
          return min + ':' + sec;
        },
        
        copyAddress() {
          if (!this.walletAddress) return;
          navigator.clipboard.writeText(this.walletAddress);
          this.showToast(this.t('common.copied'));
        },

        redirectToPayment() {
          if (this.paymentUrl) {
            window.location.href = this.paymentUrl;
          }
        },
        
        showToast(msg) {
          this.toastMsg = msg;
          this.toastShow = true;
          setTimeout(() => {
            this.toastShow = false;
          }, 3000);
        },
        
        goBack() {
          clearInterval(this.timer);
          clearInterval(this.pollTimer);
          window.location.href = '/' + this.lang + '/purchase';
        }
      }
    }
  </script>`

  const result = Layout({
    title: '确认支付',
    children: raw(content),
    showHeader: false,
    showFooter: false,
    csrfToken
  })
  return result.toString()
}