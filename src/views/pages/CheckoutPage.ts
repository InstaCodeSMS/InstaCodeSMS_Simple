/**
 * Checkout 页面视图
 * 订单确认 + 支付页面
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 * 使用 Layout 组件避免重复的 HTML 结构
 */

import Layout from '@/views/components/index.ts'
import { raw } from 'hono/html'

export default function CheckoutPage(csrfToken: string = ''): string {
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
                <span x-text="tradeId ? '等待支付' : '正在初始化'"></span>
              </h2>
              <h1 class="text-2xl font-black uppercase tracking-tighter italic">
                <span x-text="tradeId ? '请确认支付' : '正在准备订单'"></span>
              </h1>
            </div>
            <div x-show="tradeId" class="text-right">
              <div class="text-[10px] font-mono opacity-70 mb-1 uppercase">剩余时间</div>
              <div class="text-2xl font-black font-mono tracking-tighter text-yellow-300" x-text="formatTime(timeLeft)"></div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/10">
              <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📦</div>
              <div class="flex-1">
                <div class="text-[9px] font-bold uppercase opacity-60">产品</div>
                <div class="text-sm font-black uppercase tracking-tight" x-text="productName || 'Loading...'"></div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-3">
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1">区域</div>
                <div class="text-xs font-black flex items-center gap-1">
                  <img src="https://flagcdn.com/w20/us.png" alt="US" class="w-4 h-3 rounded-sm" />
                  <span x-text="region"></span>
                </div>
              </div>
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1">有效期</div>
                <div class="text-xs font-black" x-text="duration + ' 天'"></div>
              </div>
              <div class="p-3 bg-black/20 rounded-xl border border-white/10">
                <div class="text-[8px] font-bold uppercase opacity-60 mb-1">数量</div>
                <div class="text-xs font-black" x-text="'x' + quantity"></div>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
              <div class="text-[9px] font-bold uppercase opacity-60">应付金额</div>
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
            <button @click="goBack()" class="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase">
              返回重试
            </button>
          </div>

          <!-- 加载状态 -->
          <div x-show="!tradeId && !error" class="flex flex-col items-center py-10 space-y-4">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[10px] font-mono uppercase tracking-widest animate-pulse" style="color: var(--text-muted);">正在生成支付通道...</p>
          </div>

          <!-- 支付内容 -->
          <div x-show="tradeId && !error" x-cloak class="flex flex-col items-center justify-center space-y-6">
            <!-- USDT 支付 - 显示二维码 -->
            <template x-if="paymentMethod === 'usdt'">
              <div class="w-full space-y-6">
                <!-- 二维码 -->
                <div class="relative group flex justify-center">
                  <div class="absolute -inset-4 bg-blue-600/15 rounded-[2rem] blur-xl"></div>
                  <div class="relative w-48 h-48 bg-white p-3 rounded-3xl shadow-2xl flex items-center justify-center">
                    <canvas id="qrcode" class="w-full h-full rounded-2xl"></canvas>
                  </div>
                </div>

                <!-- 钱包地址 -->
                <div class="w-full space-y-2">
                  <p class="text-[9px] font-black uppercase text-center tracking-widest" style="color: var(--text-muted);">钱包地址 (TRC20)</p>
                  <div class="flex items-center gap-2 border p-4 rounded-2xl group transition-colors"
                       :class="theme === 'dark'
                         ? 'bg-[#1a1e2c] border-[rgba(200,210,240,0.08)] hover:border-blue-500/40'
                         : 'bg-slate-50 border-slate-200 hover:border-blue-400/50'">
                    <code class="flex-1 text-[11px] font-mono text-blue-500 break-all select-all" x-text="walletAddress"></code>
                    <button @click="copyAddress()" class="p-2 transition-colors hover:scale-110" style="color: var(--text-muted);">📋</button>
                  </div>
                </div>

                <!-- 提示信息 -->
                <div class="w-full p-4 rounded-2xl text-center"
                     :class="theme === 'dark' 
                       ? 'bg-blue-600/5 border border-blue-600/10' 
                       : 'bg-blue-50 border border-blue-100'">
                  <p class="text-[10px] leading-relaxed" style="color: var(--text-secondary);">
                    请使用 TRON 钱包扫描二维码或手动转账<br/>
                    转账金额：<span class="font-bold text-blue-500" x-text="actualAmount"></span> USDT<br/>
                    <span class="text-amber-500">请勿修改金额，否则可能无法自动到账</span>
                  </p>
                </div>

                <!-- 支付状态 -->
                <div x-show="isChecking" class="flex items-center gap-2 text-[10px]" style="color: var(--text-muted);">
                  <div class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>正在等待支付确认...</span>
                </div>
              </div>
            </template>

            <!-- 支付宝支付 - 显示二维码 -->
            <template x-if="paymentMethod === 'alipay'">
              <div class="w-full space-y-6">
                <!-- 二维码 -->
                <div class="relative group flex justify-center">
                  <div class="absolute -inset-4 bg-blue-600/15 rounded-[2rem] blur-xl"></div>
                  <div class="relative w-48 h-48 bg-white p-3 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                    <img x-show="qrCodeBase64" :src="'data:image/png;base64,' + qrCodeBase64" class="w-full h-full rounded-2xl object-contain" />
                    <img x-show="qrCodeUrl && !qrCodeBase64" :src="qrCodeUrl" class="w-full h-full rounded-2xl object-contain" />
                  </div>
                </div>

                <!-- 支付金额 -->
                <div class="w-full space-y-2">
                  <p class="text-[9px] font-black uppercase text-center tracking-widest" style="color: var(--text-muted);">请使用支付宝扫码支付</p>
                  <div class="flex items-center justify-center gap-2 border p-4 rounded-2xl transition-colors"
                       :class="theme === 'dark'
                         ? 'bg-[#1a1e2c] border-[rgba(200,210,240,0.08)]'
                         : 'bg-slate-50 border-slate-200'">
                    <span class="text-[10px]" style="color: var(--text-secondary);">支付金额：</span>
                    <span class="text-xl font-black text-blue-500">¥<span x-text="actualAmount"></span></span>
                  </div>
                </div>

                <!-- 提示信息 -->
                <div class="w-full p-4 rounded-2xl text-center"
                     :class="theme === 'dark' 
                       ? 'bg-amber-600/5 border border-amber-600/10' 
                       : 'bg-amber-50 border border-amber-100'">
                  <p class="text-[10px] leading-relaxed" style="color: var(--text-secondary);">
                    <span class="text-amber-500 font-bold">重要提示：</span><br/>
                    请务必支付准确金额：<span class="font-bold text-amber-600">¥<span x-text="actualAmount"></span></span><br/>
                    支付时无需填写备注信息<br/>
                    请在 5 分钟内完成支付，超时订单将被自动删除
                  </p>
                </div>

                <div x-show="isChecking" class="flex items-center justify-center gap-2 text-[10px]" style="color: var(--text-muted);">
                  <div class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>正在等待支付确认...</span>
                </div>
              </div>
            </template>
            
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <button @click="goBack()" 
                class="flex-1 py-4 border rounded-2xl text-[10px] font-black uppercase transition-all"
                :class="theme === 'dark' ? 'border-[rgba(200,210,240,0.08)]' : 'border-slate-200'"
                style="color: var(--text-muted);">
                取消订单
              </button>
              <button @click="checkPaymentNow()" 
                :disabled="isProcessing"
                class="flex-1 sm:flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50">
                <span x-text="isProcessing ? '处理中...' : '我已支付，查询结果'"></span>
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
          <span>Method: <span x-text="paymentMethod?.toUpperCase()"></span></span>
          <span>Trade: <span x-text="tradeId ? tradeId.substring(0, 8) + '...' : '---'"></span></span>
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

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    function checkoutApp() {
      return {
        theme: localStorage.getItem('theme') || 'dark',
        orderId: '',
        tradeId: '',
        productName: '',
        region: 'US',
        duration: '5-30',
        quantity: 1,
        totalAmount: '0.00',
        actualAmount: '',
        paymentMethod: 'usdt',
        walletAddress: '',
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
          
          const params = new URLSearchParams(window.location.search);
          this.productName = params.get('title') || '未知产品';
          this.region = params.get('region') || 'US';
          this.duration = params.get('duration') || '5-30';
          this.quantity = parseInt(params.get('quantity') || '1');
          this.totalAmount = params.get('amount') || '0.00';
          this.paymentMethod = params.get('method') || 'usdt';
          
          const serviceId = params.get('id');
          if (!serviceId) {
            this.error = '缺少产品信息，请重新选择';
            return;
          }
          
          const expiryValue = parseInt(params.get('expiry') || '0');
          
          if (!this.isCreating) {
            this.isCreating = true;
            this.createPaymentOrder(serviceId, expiryValue);
          }
        },
        
        async createPaymentOrder(serviceId, expiryValue) {
          try {
            this.orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
            
            const response = await fetch('/api/payment/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: this.orderId,
                amount: parseFloat(this.totalAmount),
                payment_method: this.paymentMethod,
                trade_type: 'usdt.trc20',
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
            
            if (!data.success) {
              throw new Error(data.message || '创建支付订单失败');
            }
            
            this.tradeId = data.data.trade_id;
            this.walletAddress = data.data.token;
            this.actualAmount = data.data.actual_amount;
            this.expirationTime = data.data.expiration_time;
            this.timeLeft = data.data.expiration_time;
            
            if (this.paymentMethod === 'alipay') {
              this.qrCodeBase64 = data.data.qr_code || '';
              this.qrCodeUrl = data.data.qr_code_url || '';
            }
            
            if (this.paymentMethod === 'usdt') {
              this.$nextTick(() => {
                this.generateQRCode();
              });
            }
            
            this.startTimer();
            this.startPolling();
            
          } catch (err) {
            console.error('创建支付订单失败:', err);
            this.error = err.message || '创建支付订单失败，请稍后重试';
          }
        },
        
        generateQRCode() {
          const canvas = document.getElementById('qrcode');
          if (canvas && this.walletAddress) {
            QRCode.toCanvas(canvas, this.walletAddress, {
              width: 180,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' }
            }, function(error) {
              if (error) console.error('生成二维码失败:', error);
            });
          }
        },
        
        startTimer() {
          this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
              this.timeLeft--;
            } else {
              clearInterval(this.timer);
              clearInterval(this.pollTimer);
              this.error = '支付超时，请重新下单';
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
            const response = await fetch('/api/payment/status?trade_id=' + this.tradeId);
            const data = await response.json();
            
            if (data.success && data.data.status === 2) {
              this.isProcessing = true;
              clearInterval(this.timer);
              clearInterval(this.pollTimer);
              this.showToast('支付成功，正在创建订单...');
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
            this.showToast('尚未检测到支付，请稍后重试');
          }
        },
        
        async createUpstreamOrder() {
          try {
            const orderResponse = await fetch('/api/payment/order/' + this.tradeId);
            const orderData = await orderResponse.json();
            
            if (!orderData.success) {
              throw new Error('获取订单信息失败');
            }
            
            const productInfo = orderData.data.product_info;
            
            const response = await fetch('/api/orders/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app_id: productInfo.service_id,
                num: productInfo.quantity,
                expiry: productInfo.expiry
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              const tel = data.data.items?.[0]?.tel || '';
              const token = data.data.items?.[0]?.token || '';
              const ordernum = data.data.ordernum || this.orderId;
              
              window.location.href = '/success?order_id=' + ordernum + '&tel=' + encodeURIComponent(tel) + '&token=' + encodeURIComponent(token);
            } else {
              throw new Error(data.message || '创建订单失败');
            }
          } catch (err) {
            console.error('创建上游订单失败:', err);
            this.error = '支付成功但创建订单失败，请联系客服';
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
          this.showToast('地址已复制到剪贴板');
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
          window.location.href = '/purchase';
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
