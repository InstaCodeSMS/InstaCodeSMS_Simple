/**
 * Success 页面
 * 支付成功提示页面
 */

export default function SuccessPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>支付成功 - SimpleFaka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/dist/full.min.css" rel="stylesheet" type="text/css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    
    .dark {
      --bg-primary: rgb(12, 15, 22);
      --bg-secondary: rgb(19, 22, 32);
      --bg-tertiary: rgb(26, 30, 44);
      --text-primary: rgb(228, 232, 241);
      --text-secondary: rgb(148, 163, 184);
      --text-muted: rgb(100, 116, 139);
      --border-color: rgba(200, 210, 240, 0.06);
      --accent-blue: rgb(37, 99, 235);
    }
    
    .light {
      --bg-primary: rgb(248, 250, 252);
      --bg-secondary: rgb(255, 255, 255);
      --bg-tertiary: rgb(241, 245, 249);
      --text-primary: rgb(15, 23, 42);
      --text-secondary: rgb(71, 85, 105);
      --text-muted: rgb(100, 116, 139);
      --border-color: rgba(226, 232, 240, 0.8);
      --accent-blue: rgb(37, 99, 235);
    }
    
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.7s ease-out;
    }
    
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-zoom-in {
      animation: zoomIn 0.5s ease-out;
    }
  </style>
</head>
<body class="min-h-screen transition-colors duration-300" 
      x-data="successApp()"
      :class="theme"
      x-init="init()">
  
  <main class="min-h-screen py-24 px-6 relative overflow-x-hidden flex items-center justify-center">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] rounded-full pointer-events-none"
         :class="theme === 'dark' ? 'bg-blue-600/5 blur-[120px]' : 'bg-blue-400/10 blur-[150px]'"></div>

    <div class="max-w-xl w-full relative z-10">
      <!-- 成功标题 -->
      <div class="mb-10 flex flex-col items-center text-center animate-fade-in">
        <div class="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
             :class="theme === 'dark' 
               ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
               : 'bg-emerald-50 border border-emerald-200/60 shadow-lg shadow-emerald-100/40'">
          ✅
        </div>
        <h2 class="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase mb-2 italic">部署成功</h2>
        <h1 class="text-4xl font-black tracking-tighter uppercase leading-none" style="color: var(--text-primary);">
          终端配置完成
        </h1>
      </div>

      <div class="border rounded-[3rem] overflow-hidden animate-zoom-in transition-colors duration-300"
           :class="theme === 'dark' 
             ? 'bg-[#131620] border-[rgba(200,210,240,0.06)] shadow-2xl shadow-black/30' 
             : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'">
        
        <!-- 号码展示区 -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 p-10 text-white relative overflow-hidden text-center">
          <div class="absolute inset-0 opacity-10" style="background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');"></div>
          <p class="relative z-10 text-[10px] font-mono uppercase opacity-70 tracking-[0.3em] mb-4">您的虚拟号码</p>
          <h3 class="relative z-10 text-5xl font-black font-mono tracking-tighter italic mb-6" x-text="mobileNumber || '---'"></h3>
          <button @click="copyNumber()" 
            class="relative z-10 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-black uppercase transition-all active:scale-95">
            复制号码
          </button>
        </div>

        <!-- 详情区域 -->
        <div class="p-10 space-y-8">
          <div class="grid grid-cols-1 gap-4">
            <!-- Access Token -->
            <div class="p-6 rounded-3xl border group transition-all"
                 :class="theme === 'dark' 
                   ? 'bg-[#131620]/30 border-[rgba(200,210,240,0.06)] hover:border-blue-500/30' 
                   : 'bg-slate-50/80 border-slate-200/80 hover:border-blue-400/40'">
              <p class="text-[9px] font-black uppercase tracking-widest mb-3 italic" style="color: var(--text-muted);">访问令牌 (Token)</p>
              <div class="flex items-center justify-between">
                <code class="text-blue-500 font-mono text-sm tracking-wider truncate mr-4" x-text="userToken"></code>
                <button @click="copyToken()" 
                  class="shrink-0 text-[10px] font-bold transition-colors hover:text-blue-500"
                  style="color: var(--text-muted);">复制</button>
              </div>
            </div>

            <!-- 过期时间 -->
            <div class="p-6 rounded-3xl border"
                 :class="theme === 'dark' 
                   ? 'bg-[#131620]/30 border-[rgba(200,210,240,0.06)]' 
                   : 'bg-slate-50/80 border-slate-200/80'">
              <p class="text-[9px] font-black uppercase tracking-widest mb-3 italic" style="color: var(--text-muted);">节点过期时间</p>
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm" style="color: var(--text-primary);" x-text="expireTime || '---'"></span>
                <span class="px-3 py-1 bg-blue-600/10 rounded-lg text-[9px] font-black text-blue-500 uppercase">自动释放</span>
              </div>
            </div>
          </div>

          <!-- 警告提示 -->
          <div class="p-6 rounded-3xl"
               :class="theme === 'dark' 
                 ? 'bg-amber-500/5 border border-amber-500/10' 
                 : 'bg-amber-50 border border-amber-200/60'">
            <div class="flex gap-4">
              <span class="text-amber-500 text-lg">⚠️</span>
              <div class="space-y-2">
                <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest">使用须知</p>
                <p class="text-[11px] leading-relaxed font-medium" style="color: var(--text-secondary);">
                  请妥善保管您的访问令牌，这是获取验证码的唯一凭证。<br/>
                  号码过期后将自动释放，无法续费。
                </p>
              </div>
            </div>
          </div>

          <!-- 跳转按钮 -->
          <button @click="goToReceive()" 
            class="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all transform active:scale-95 group">
            进入接码终端
            <span class="inline-block ml-2 group-hover:translate-x-2 transition-transform">→</span>
          </button>
        </div>

        <!-- 底部状态栏 -->
        <div class="py-5 px-10 border-t text-center transition-colors duration-300"
             :class="theme === 'dark' 
               ? 'bg-[#0f1219] border-[rgba(200,210,240,0.06)]' 
               : 'bg-slate-50 border-slate-100'">
          <p class="text-[8px] font-mono uppercase tracking-[0.3em] leading-none" style="color: var(--text-muted);">
            订单号: <span x-text="orderId"></span> | 协议: Secured-Lease-V4
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
         class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-widest uppercase shadow-2xl shadow-blue-600/30 text-[10px]">
      <span x-text="toastMsg"></span>
    </div>
  </main>

  <script>
    function successApp() {
      return {
        theme: localStorage.getItem('theme') || 'dark',
        orderId: 'N/A',
        mobileNumber: '',
        userToken: 'LOADING...',
        expireTime: '',
        toastShow: false,
        toastMsg: '',
        
        init() {
          this.$watch('theme', val => localStorage.setItem('theme', val));
          
          // 从 URL 参数获取订单信息
          const params = new URLSearchParams(window.location.search);
          this.orderId = params.get('order_id') || 'N/A';
          this.mobileNumber = params.get('tel') || '';
          this.userToken = params.get('token') || localStorage.getItem('user_token') || 'GUEST';
          
          // 计算过期时间（默认 30 天后）
          const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          this.expireTime = expireDate.toLocaleString('zh-CN');
          
          // 如果有订单 ID，尝试获取订单详情
          if (this.orderId && this.orderId !== 'N/A') {
            this.fetchOrderDetails();
          }
        },
        
        async fetchOrderDetails() {
          try {
            const res = await fetch('/api/orders/' + this.orderId);
            const data = await res.json();
            if (data.success && data.data) {
              if (data.data.list && data.data.list[0]) {
                this.mobileNumber = data.data.list[0].tel || this.mobileNumber;
                this.userToken = data.data.list[0].token || this.userToken;
              }
            }
          } catch (e) {
            console.log('获取订单详情失败，使用默认值');
          }
        },
        
        showToast(msg) {
          this.toastMsg = msg;
          this.toastShow = true;
          setTimeout(() => {
            this.toastShow = false;
          }, 3000);
        },
        
        copyNumber() {
          if (!this.mobileNumber) return;
          navigator.clipboard.writeText(this.mobileNumber);
          this.showToast('号码已复制到剪贴板');
        },
        
        copyToken() {
          if (!this.userToken || this.userToken === 'LOADING...') return;
          navigator.clipboard.writeText(this.userToken);
          this.showToast('令牌已复制到剪贴板');
        },
        
        goToReceive() {
          window.location.href = '/receive?token=' + this.userToken;
        }
      }
    }
  </script>
</body>
</html>`
}