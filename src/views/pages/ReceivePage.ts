/**
 * Receive 页面视图
 * 接码终端页面
 * 
 * Why: 根据 .clinerules 规范，视图层应放在 src/views/pages/ 目录
 */

export default function ReceivePage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>接码终端 - SimpleFaka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css" rel="stylesheet" type="text/css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script src="https://unpkg.com/htmx.org@2.0.8"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    
    /* ===== 主题变量 ===== */
    .dark {
      --bg-primary: #0C0F16;
      --bg-secondary: #171B28;
      --bg-tertiary: rgba(30, 41, 59, 0.6);
      --bg-card: rgba(19, 22, 32, 0.3);
      --bg-input: #171B28;
      --bg-footer: #0A0D14;
      --text-primary: #E4E8F1;
      --text-secondary: #4D5470;
      --text-muted: #4D5470;
      --border-color: rgba(51, 65, 85, 0.5);
      --border-subtle: rgba(200, 210, 240, 0.06);
      --border-input: rgba(200, 210, 240, 0.1);
      --accent-primary: #2563EB;
      --accent-light: #3B82F6;
      --accent-dark: #1D4ED8;
      --nav-bg: rgba(12, 15, 22, 0.78);
      --glow-color: rgba(37, 99, 235, 0.15);
    }
    
    .light {
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fd;
      --bg-tertiary: #f0f4f8;
      --bg-card: rgba(255, 255, 255, 0.7);
      --bg-input: #f8f9fd;
      --bg-footer: #f8fafc;
      --text-primary: #1a1a2e;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --border-color: #e2e8f0;
      --border-subtle: #e2e8f0;
      --border-input: #e2e8f0;
      --accent-primary: #2563EB;
      --accent-light: #3B82F6;
      --accent-dark: #1D4ED8;
      --nav-bg: rgba(255, 255, 255, 0.85);
      --glow-color: rgba(59, 130, 246, 0.1);
    }
    
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s, color 0.3s;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, "Segoe UI", Arial, Roboto, "PingFang SC", miui, "Hiragino Sans GB", "Microsoft Yahei", sans-serif;
    }
    
    .card-bg {
      background-color: var(--bg-card);
      border-color: var(--border-subtle);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }
    
    .input-bg {
      background-color: var(--bg-input);
      border-color: var(--border-input);
      color: var(--text-primary);
    }
    
    .text-muted {
      color: var(--text-secondary);
    }
    
    .border-theme {
      border-color: var(--border-subtle);
    }

    .nav-bg {
      background-color: var(--nav-bg);
      border-color: var(--border-subtle);
    }
    
    .footer-bg {
      background-color: var(--bg-footer);
    }
    
    /* ===== 动画 ===== */
    .pulse-animation {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes scan {
      0% { transform: translateY(100%); }
      100% { transform: translateY(-100%); }
    }
    .animate-scan { animation: scan 3s linear infinite; }
    
    @keyframes ping-slow {
      0% { transform: scale(1); opacity: 0.3; }
      75%, 100% { transform: scale(1.5); opacity: 0; }
    }
    .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
    
    /* Toast 动画 */
    .toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
    .toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }
    
    /* 列表动画 */
    .list-enter-active, .list-leave-active { transition: all 0.4s ease; }
    .list-enter-from, .list-leave-to { opacity: 0; transform: translateY(-10px); }
    
    /* 自定义滚动条 */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--accent-primary); border-radius: 10px; opacity: 0.3; }
    
    /* 验证码高亮 */
    .code-highlight {
      display: inline-block;
      padding: 2px 8px;
      background-color: rgba(37, 99, 235, 0.15);
      color: #3B82F6;
      font-weight: 700;
      border-radius: 6px;
      border: 1px solid rgba(37, 99, 235, 0.3);
      font-family: monospace;
    }
    
    /* 顶部光晕 */
    .top-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 80rem;
      height: 600px;
      border-radius: 9999px;
      pointer-events: none;
    }
    
    .dark .top-glow {
      background: radial-gradient(ellipse, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
    }
    
    .light .top-glow {
      background: radial-gradient(ellipse, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
    }
  </style>
</head>
<body class="min-h-screen transition-colors duration-300 relative overflow-x-hidden" 
      x-data="receiveApp()"
      :class="theme"
      x-init="init()">
  
  <!-- 顶部光晕效果 -->
  <div class="top-glow blur-[100px]"></div>

  <!-- 导航栏 -->
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b nav-bg transition-all duration-300">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3">
        <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i class="fas fa-bolt text-white text-sm"></i>
        </div>
        <span class="text-lg font-bold tracking-tight">
          <span class="text-blue-500">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
      </a>
      
      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-1">
          <a href="/purchase" class="px-4 py-2 rounded-xl text-muted hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all text-xs font-bold uppercase tracking-wider">
            <span x-text="t('nav.purchase')"></span>
          </a>
          <a href="/receive" class="px-4 py-2 rounded-xl text-blue-500 bg-blue-500/10 text-xs font-bold uppercase tracking-wider">
            <span x-text="t('nav.receive')"></span>
          </a>
        </div>
        
        <!-- 语言切换 -->
        <button 
          @click="toggleLanguage()"
          class="h-10 px-3 rounded-xl flex items-center gap-2 hover:bg-[var(--bg-tertiary)] transition-all text-sm"
          :title="lang === 'zh' ? 'Switch to English' : '切换到中文'"
        >
          <img :src="lang === 'zh' ? 'https://flagcdn.com/w40/cn.png' : 'https://flagcdn.com/w40/gb.png'" 
               class="w-5 h-4 rounded object-cover" :alt="lang">
          <i class="fas fa-chevron-down text-xs text-muted"></i>
        </button>
        
        <!-- 主题切换 -->
        <button 
          @click="toggleTheme()"
          class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-all"
          :title="theme === 'dark' ? t('nav.light_mode') : t('nav.dark_mode')"
        >
          <i x-show="theme === 'dark'" class="fas fa-sun text-yellow-500"></i>
          <i x-show="theme === 'light'" class="fas fa-moon text-blue-500"></i>
        </button>
        
        <!-- 移动端菜单 -->
        <div class="sm:hidden relative" x-data="{ mobileOpen: false }">
          <button 
            @click="mobileOpen = !mobileOpen"
            class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-all"
          >
            <i class="fas fa-bars text-sm"></i>
          </button>
          <div 
            x-show="mobileOpen" 
            x-cloak
            @click.away="mobileOpen = false"
            x-transition
            class="absolute right-0 top-12 w-40 card-bg border rounded-2xl shadow-xl overflow-hidden"
          >
            <a href="/purchase" class="block px-4 py-3 hover:bg-[var(--bg-tertiary)] text-sm">
              <span x-text="t('nav.purchase')"></span>
            </a>
            <a href="/receive" class="block px-4 py-3 hover:bg-[var(--bg-tertiary)] text-blue-500 text-sm">
              <span x-text="t('nav.receive')"></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- 主内容 -->
  <main class="pt-28 pb-8 px-4 sm:px-6 relative z-10">
    <div class="max-w-3xl mx-auto">
      
      <!-- 标题区域 -->
      <header class="mb-12">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <!-- 状态指示器 -->
          <div class="order-2 lg:order-1 animate-in fade-in slide-in-from-left-4 duration-700">
            <div class="relative w-24 h-24 shrink-0">
              <!-- 脉冲动画 -->
              <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ping-slow" x-show="isPolling"></div>
              <!-- 主体 -->
              <div class="relative w-full h-full rounded-full border backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
                   :class="theme === 'dark' 
                     ? 'bg-[#131620]/50 border-[rgba(200,210,240,0.08)]' 
                     : 'bg-white/60 border-slate-200/60 shadow-sm'">
                <!-- 扫描动画 -->
                <div class="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent translate-y-full animate-scan" x-show="isPolling"></div>
                <!-- 状态点 -->
                <div class="w-3 h-3 rounded-full mb-1.5 transition-all duration-500"
                     :class="isPolling ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'bg-slate-400'"></div>
                <span class="text-[8px] font-mono text-blue-700 tracking-tighter uppercase font-bold">Node</span>
                <span class="text-[9px] font-mono tracking-widest uppercase font-black transition-colors"
                      :class="isPolling ? 'text-blue-500' : 'text-[var(--text-secondary)]'"
                      x-text="isPolling ? 'Active' : 'Standby'"></span>
              </div>
            </div>
          </div>
          
          <!-- 标题文字 -->
          <div class="order-1 lg:order-2 text-center lg:text-right animate-in fade-in slide-in-from-right-4 duration-700">
            <h2 class="text-[10px] font-mono tracking-[0.4em] text-blue-600 uppercase mb-3 italic leading-none">
              <span x-text="t('receive.terminal_receiver')"></span>
            </h2>
            <h1 class="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-4">
              <span x-html="t('receive.info_receiver_terminal_html')"></span>
            </h1>
          </div>
        </div>
      </header>

      <!-- Token 输入区 -->
      <section class="mb-10">
        <div class="card-bg border rounded-[2rem] p-6 sm:p-8 shadow-lg transition-all duration-300"
             :class="theme === 'dark' ? 'shadow-black/20' : 'shadow-slate-200/40'">
          <div class="flex flex-col sm:flex-row items-end gap-4">
            <div class="flex-1 w-full">
              <label class="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
                <span x-text="t('receive.access_token')"></span>
              </label>
              <div class="relative group">
                <input 
                  :type="showToken ? 'text' : 'password'" 
                  x-model="token"
                  :placeholder="t('receive.token_placeholder')"
                  class="w-full border rounded-2xl px-6 py-4 pr-14 font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-[60px] text-base tracking-wider input-bg"
                  :disabled="isPolling"
                  @input="sanitizeToken($event)"
                />
                <button 
                  type="button"
                  @click="showToken = !showToken"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-blue-500/10 text-muted hover:text-blue-500 transition-all z-20"
                  :title="showToken ? t('receive.hide_token') : t('receive.show_token')"
                >
                  <i :class="showToken ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-lg"></i>
                </button>
              </div>
              <p class="text-xs text-muted mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                <span x-text="t('receive.token_hint')"></span>
              </p>
            </div>
            
            <button 
              type="button"
              @click="toggleRadar()"
              class="w-full sm:w-44 px-8 py-4 h-[60px] rounded-2xl font-black tracking-widest uppercase transition-all duration-500 border text-base"
              :class="isPolling 
                ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' 
                : 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 hover:bg-blue-700'"
            >
              <i :class="isPolling ? 'fas fa-stop' : 'fas fa-satellite-dish'" class="mr-2"></i>
              <span x-text="isPolling ? t('receive.btn_stop') : t('receive.btn_start')"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- 工具栏 -->
      <section class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted uppercase tracking-[0.3em] font-mono italic">
              <span x-text="t('receive.incoming_stream')"></span>
            </span>
            <div class="h-px flex-1 border-t border-theme min-w-[80px] hidden sm:block"></div>
          </div>
          
          <div class="flex items-center gap-2 flex-wrap">
            <!-- 通知开关 -->
            <button 
              type="button"
              @click="toggleNotification()"
              class="px-3 py-2 rounded-xl border text-xs font-mono uppercase transition-all hover:scale-105"
              :class="notificationEnabled 
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' 
                : 'bg-[var(--bg-tertiary)] text-muted border-[var(--border-color)]'"
              :title="notificationEnabled ? t('receive.notification_on') : t('receive.notification_off')"
            >
              <i :class="notificationEnabled ? 'fas fa-bell' : 'fas fa-bell-slash'" class="mr-1.5"></i>
              <span x-text="notificationEnabled ? 'ON' : 'OFF'"></span>
            </button>
            
            <!-- 清空历史 -->
            <button 
              type="button"
              @click="clearHistory()"
              class="px-3 py-2 rounded-xl border text-xs font-mono uppercase transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              :class="theme === 'dark' 
                ? 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-muted hover:text-red-500 hover:border-red-500/30' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-500/30'"
              :disabled="messages.length === 0"
            >
              <i class="fas fa-trash-alt mr-1.5"></i>
              <span x-text="t('receive.clear_history')"></span>
            </button>
            
            <!-- 导出 -->
            <button 
              type="button"
              @click="exportMessages()"
              class="px-3 py-2 rounded-xl border text-xs font-mono uppercase transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              :class="theme === 'dark' 
                ? 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-muted hover:text-blue-500 hover:border-blue-500/30' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-500 hover:border-blue-500/30'"
              :disabled="messages.length === 0"
            >
              <i class="fas fa-download mr-1.5"></i>
              <span x-text="t('receive.export')"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- 消息流 -->
      <section class="mb-16">
        <div class="space-y-4">
          <template x-for="(msg, index) in messages" :key="msg.id">
            <div 
              class="card-bg border rounded-[2rem] p-6 sm:p-8 transition-all duration-500"
              :class="theme === 'dark' ? 'hover:border-blue-500/30' : 'hover:border-blue-400/40 shadow-sm'"
              x-transition
            >
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex-1 w-full">
                  <!-- 时间和状态 -->
                  <div class="flex items-center gap-2 mb-3 font-mono text-[10px] text-muted uppercase tracking-widest">
                    <div class="w-1.5 h-1.5 rounded-full"
                         :class="msg.id === 'waiting' ? 'bg-yellow-500 animate-pulse' : (msg.id === 'err' ? 'bg-red-500' : 'bg-emerald-500')"></div>
                    <span x-text="t('receive.system_time') + ': ' + msg.time"></span>
                    <span x-show="msg.tel" class="text-blue-500" x-text="'[' + msg.tel + ']'"></span>
                  </div>
                  
                  <!-- 消息内容 -->
                  <p class="text-base sm:text-lg leading-relaxed whitespace-pre-wrap" x-html="highlightCodes(msg.text)"></p>
                  
                  <!-- 验证码快速复制区 -->
                  <div x-show="msg.codes && msg.codes.length > 0" class="mt-4 flex flex-wrap items-center gap-3">
                    <template x-for="(code, idx) in msg.codes" :key="idx">
                      <div class="flex items-center gap-2">
                        <div class="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                          <span class="text-[10px] font-mono text-blue-500 block mb-0.5 uppercase tracking-tighter italic">
                            <span x-text="t('receive.verification_code')"></span>
                            <span x-show="msg.codes.length > 1" x-text="' #' + (idx + 1)"></span>
                          </span>
                          <span class="text-xl font-black text-blue-500 tracking-[0.15em]" x-text="code"></span>
                        </div>
                        <button 
                          @click="copyText(code)"
                          class="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-mono uppercase transition-all shadow-lg shadow-blue-600/20"
                        >
                          <span x-text="t('receive.copy_code')"></span>
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
                
                <!-- 复制全文按钮 -->
                <button 
                  x-show="!['waiting', 'err'].includes(msg.id)"
                  @click="copyText(msg.text)"
                  class="shrink-0 px-6 py-3 border rounded-xl text-[10px] font-mono uppercase transition-all hover:bg-blue-600 hover:text-white"
                  :class="theme === 'dark' 
                    ? 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-muted hover:border-blue-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-600'"
                >
                  <span x-text="t('receive.copy')"></span>
                </button>
              </div>
            </div>
          </template>
          
          <!-- 空状态 -->
          <div x-show="messages.length === 0" class="py-20 text-center border rounded-[2.5rem] border-theme">
            <p class="text-muted font-mono text-sm tracking-[0.2em] uppercase opacity-50 italic">
              <span x-text="t('receive.awaiting_input')"></span>
            </p>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-theme footer-bg py-10 px-4 sm:px-6 relative z-10">
    <div class="max-w-3xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <span class="text-base font-bold">
          <span class="text-blue-500">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
        <div class="flex items-center gap-6 text-sm text-muted">
          <a href="#" class="hover:text-[var(--text-primary)] transition-colors" x-text="t('footer.contact')"></a>
          <a href="/PrivacyPolicy" class="hover:text-[var(--text-primary)] transition-colors" x-text="t('footer.privacy')"></a>
          <a href="#" class="hover:text-[var(--text-primary)] transition-colors" x-text="t('footer.terms')"></a>
        </div>
        <p class="text-muted text-xs">© 2026 SIMPLEFAKA PROTOCOL. <span x-text="t('footer.copyright')"></span></p>
      </div>
    </div>
  </footer>

  <!-- Toast 提示 -->
  <div 
    x-show="toastShow" 
    x-cloak
    x-transition:enter="toast-enter-active"
    x-transition:leave="toast-leave-active"
    x-transition:enter-start="toast-enter-from"
    x-transition:leave-end="toast-leave-to"
    class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold tracking-widest uppercase shadow-2xl shadow-blue-600/30 text-xs"
  >
    <span x-text="toastMsg"></span>
  </div>

  <script>
    // ===== 国际化语言包 =====
    const i18n = {
      zh: {
        nav: {
          purchase: '购买服务',
          receive: '接码终端',
          dark_mode: '切换到暗色模式',
          light_mode: '切换到亮色模式'
        },
        receive: {
          terminal_receiver: '终端 / 信息接收器',
          info_receiver_terminal_html: '<span class="text-blue-600 italic">信息</span>接收终端',
          access_token: '访问令牌',
          token_placeholder: '请输入访问令牌...',
          token_hint: '购买服务后，系统会提供 Token 令牌，将其粘贴到此处即可接收验证码',
          show_token: '显示令牌',
          hide_token: '隐藏令牌',
          btn_start: '启动雷达',
          btn_stop: '停止雷达',
          incoming_stream: '实时数据流',
          notification_on: '通知已开启',
          notification_off: '通知已关闭',
          clear_history: '清空历史',
          export: '导出',
          system_time: '系统时间',
          verification_code: '验证码',
          copy_code: '复制',
          copy: '复制全文',
          awaiting_input: '等待终端输入...',
          token_required: '请输入访问令牌',
          token_invalid_char: '令牌只能包含字母和数字',
          radar_active: '雷达已启动',
          radar_offline: '雷达已关闭',
          radar_scanning: '雷达扫描中，等待信号...',
          new_signal: '收到新信号！',
          copied: '已复制到剪贴板',
          copy_failed: '复制失败',
          confirm_clear: '确定要清空所有历史记录吗？',
          history_cleared: '历史记录已清空',
          no_messages_export: '暂无消息可导出',
          export_success: '导出成功',
          notification_enabled: '通知已启用',
          notification_disabled: '通知已禁用',
          connection_failed: '连接失败，请稍后重试',
          shield_denied: '访问被拒绝'
        },
        footer: {
          contact: '联系支持',
          privacy: '隐私政策',
          terms: '服务条款',
          copyright: '版权所有'
        }
      },
      en: {
        nav: {
          purchase: 'Purchase',
          receive: 'Terminal',
          dark_mode: 'Switch to Dark Mode',
          light_mode: 'Switch to Light Mode'
        },
        receive: {
          terminal_receiver: 'Terminal / Inbound Receiver',
          info_receiver_terminal_html: 'Inbound <span class="text-blue-600 italic">Terminal</span>',
          access_token: 'Access Token',
          token_placeholder: 'Enter your access token...',
          token_hint: 'After purchasing, you will receive a token. Paste it here to receive verification codes.',
          show_token: 'Show Token',
          hide_token: 'Hide Token',
          btn_start: 'Start Radar',
          btn_stop: 'Stop Radar',
          incoming_stream: 'Incoming Stream',
          notification_on: 'Notification On',
          notification_off: 'Notification Off',
          clear_history: 'Clear',
          export: 'Export',
          system_time: 'System Time',
          verification_code: 'Code',
          copy_code: 'Copy',
          copy: 'Copy All',
          awaiting_input: 'Awaiting terminal input...',
          token_required: 'Please enter access token',
          token_invalid_char: 'Token can only contain letters and numbers',
          radar_active: 'Radar activated',
          radar_offline: 'Radar offline',
          radar_scanning: 'Radar scanning, awaiting signal...',
          new_signal: 'New signal received!',
          copied: 'Copied to clipboard',
          copy_failed: 'Copy failed',
          confirm_clear: 'Are you sure to clear all history?',
          history_cleared: 'History cleared',
          no_messages_export: 'No messages to export',
          export_success: 'Export successful',
          notification_enabled: 'Notification enabled',
          notification_disabled: 'Notification disabled',
          connection_failed: 'Connection failed, please try again',
          shield_denied: 'Access denied'
        },
        footer: {
          contact: 'Contact',
          privacy: 'Privacy Policy',
          terms: 'Terms of Service',
          copyright: 'All rights reserved'
        }
      }
    };

    // ===== Alpine.js 应用 =====
    function receiveApp() {
      return {
        // 状态
        theme: 'dark',
        lang: 'zh',
        token: '',
        showToken: false,
        isPolling: false,
        messages: [],
        notificationEnabled: false,
        toastShow: false,
        toastMsg: '',
        pollInterval: null,
        
        // 常量
        STORAGE_KEY: 'receive_messages_history',
        NOTIFICATION_KEY: 'receive_notification_enabled',
        LANGUAGE_KEY: 'receive_language',
        MAX_MESSAGES: 50,
        POLL_INTERVAL: 5000,
        TOAST_DURATION: 3000,
        
        // ===== 初始化 =====
        init() {
          // 加载保存的状态
          this.theme = localStorage.getItem('theme') || 'dark';
          this.lang = localStorage.getItem(this.LANGUAGE_KEY) || 'zh';
          this.notificationEnabled = localStorage.getItem(this.NOTIFICATION_KEY) === 'true';
          this.loadMessages();
          
          // 监听主题变化
          this.$watch('theme', (val) => {
            localStorage.setItem('theme', val);
            document.body.className = 'min-h-screen transition-colors duration-300 relative overflow-x-hidden ' + val;
          });
          
          // 监听语言变化
          this.$watch('lang', (val) => {
            localStorage.setItem(this.LANGUAGE_KEY, val);
          });
          
          // 检查URL参数
          const urlParams = new URLSearchParams(window.location.search);
          const tokenParam = urlParams.get('token');
          if (tokenParam) {
            this.token = tokenParam.replace(/[^a-zA-Z0-9]/g, '');
            this.$nextTick(() => this.startRadar());
          }
          
          // 请求通知权限
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        },
        
        // ===== 翻译函数 =====
        t(key) {
          const keys = key.split('.');
          let value = i18n[this.lang];
          for (const k of keys) {
            value = value?.[k];
          }
          return value || key;
        },
        
        // ===== 主题切换 =====
        toggleTheme() {
          this.theme = this.theme === 'dark' ? 'light' : 'dark';
          this.showToast(this.theme === 'dark' ? this.t('nav.dark_mode') : this.t('nav.light_mode'));
        },
        
        // ===== 语言切换 =====
        toggleLanguage() {
          this.lang = this.lang === 'zh' ? 'en' : 'zh';
          document.documentElement.lang = this.lang === 'zh' ? 'zh-CN' : 'en';
        },
        
        // ===== Token 输入处理 =====
        sanitizeToken(e) {
          const input = e.target.value;
          const originalLength = input.length;
          const sanitized = input.replace(/[^a-zA-Z0-9]/g, '');
          
          if (sanitized.length < originalLength) {
            this.showToast(this.t('receive.token_invalid_char'));
          }
          
          this.token = sanitized;
        },
        
        // ===== 雷达控制 =====
        toggleRadar() {
          if (this.isPolling) {
            this.stopRadar();
          } else {
            if (!this.token || this.token.trim() === '') {
              this.showToast(this.t('receive.token_required'));
              return;
            }
            this.startRadar();
          }
        },
        
        startRadar() {
          this.isPolling = true;
          this.fetchSms();
          this.pollInterval = setInterval(() => {
            if (this.isPolling) {
              this.fetchSms();
            }
          }, this.POLL_INTERVAL);
          this.showToast(this.t('receive.radar_active'));
        },
        
        stopRadar() {
          this.isPolling = false;
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
          // 移除等待消息
          this.messages = this.messages.filter(m => m.id !== 'waiting');
          this.showToast(this.t('receive.radar_offline'));
        },
        
        // ===== API 请求 =====
        fetchSms() {
          fetch('/api/sms/' + this.token.trim() + '/json')
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data && data.data.sms) {
                // 移除等待消息
                this.messages = this.messages.filter(m => m.id !== 'waiting');
                
                // 提取验证码
                const codes = this.extractCodes(data.data.sms);
                
                // 添加新消息
                const newMessage = {
                  id: Date.now(),
                  text: data.data.sms,
                  tel: this.maskPhone(data.data.tel || ''),
                  codes: codes,
                  time: this.formatTime()
                };
                
                this.messages.unshift(newMessage);
                
                // 限制消息数量
                if (this.messages.length > this.MAX_MESSAGES) {
                  this.messages = this.messages.slice(0, this.MAX_MESSAGES);
                }
                
                // 保存到 localStorage
                this.saveMessages();
                
                // 发送通知
                this.playNotification(data.data.sms);
                
                // 停止雷达
                this.stopRadar();
                
                this.showToast(this.t('receive.new_signal'));
              } else if (this.messages.length === 0 || this.messages[0].id !== 'waiting') {
                // 显示等待状态
                this.messages = [{
                  id: 'waiting',
                  text: this.t('receive.radar_scanning'),
                  tel: '',
                  codes: [],
                  time: this.formatTime()
                }];
              }
            })
            .catch(err => {
              console.error('Fetch error:', err);
            });
        },
        
        // ===== 验证码提取 =====
        extractCodes(text) {
          const codes = [];
          const patterns = [
            /(?:验证码|验证码是|code|is|为|码)[:：\\s]*([0-9]{4,8})/gi,
            /(?:验证码|验证码是|code|is|为|码)[:：\\s]*([A-Z0-9]{4,8})/gi,
            /[【\\[（(]([A-Z0-9]{4,8})[】\\]）)]/gi,
            /\\b([0-9]{4,8})\\b/g
          ];
          
          const seen = new Set();
          
          for (const pattern of patterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
              if (match[1] && !seen.has(match[1])) {
                const code = match[1].toUpperCase();
                // 过滤全是相同字符的验证码
                if (!/^(.)\\1+$/.test(code) && code.length >= 4) {
                  codes.push(code);
                  seen.add(code);
                }
              }
            }
            if (codes.length > 0) break; // 找到后停止
          }
          
          return codes;
        },
        
        // ===== 高亮验证码 =====
        highlightCodes(text) {
          if (!text) return text;
          
          const codes = this.extractCodes(text);
          let highlighted = text;
          
          codes.forEach(code => {
            const regex = new RegExp('\\\\b' + code + '\\\\b', 'g');
            highlighted = highlighted.replace(regex, '<span class="code-highlight">' + code + '</span>');
          });
          
          return highlighted;
        },
        
        // ===== 手机号脱敏 =====
        maskPhone(phone) {
          const phoneStr = String(phone);
          if (phoneStr.length < 7) return phoneStr;
          return phoneStr.slice(0, 3) + '****' + phoneStr.slice(-4);
        },
        
        // ===== 时间格式化 =====
        formatTime() {
          const now = new Date();
          return now.toLocaleTimeString('zh-CN', { hour12: false });
        },
        
        // ===== 复制功能 =====
        copyText(text) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
              .then(() => this.showToast(this.t('receive.copied')))
              .catch(() => this.fallbackCopy(text));
          } else {
            this.fallbackCopy(text);
          }
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
            this.showToast(this.t('receive.copied'));
          } catch (e) {
            this.showToast(this.t('receive.copy_failed'));
          }
          document.body.removeChild(textarea);
        },
        
        // ===== Toast 提示 =====
        showToast(msg) {
          this.toastMsg = msg;
          this.toastShow = true;
          setTimeout(() => {
            this.toastShow = false;
          }, this.TOAST_DURATION);
        },
        
        // ===== 消息持久化 =====
        saveMessages() {
          try {
            const validMessages = this.messages.filter(m => !['waiting', 'err'].includes(m.id));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validMessages));
          } catch (e) {
            console.error('Save failed:', e);
          }
        },
        
        loadMessages() {
          try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                this.messages = parsed.slice(0, this.MAX_MESSAGES);
              }
            }
          } catch (e) {
            console.error('Load failed:', e);
          }
        },
        
        // ===== 清空历史 =====
        clearHistory() {
          if (confirm(this.t('receive.confirm_clear'))) {
            this.messages = [];
            localStorage.removeItem(this.STORAGE_KEY);
            this.showToast(this.t('receive.history_cleared'));
          }
        },
        
        // ===== 导出功能 (TXT格式) =====
        exportMessages() {
          const validMessages = this.messages.filter(m => !['waiting', 'err'].includes(m.id));
          
          if (validMessages.length === 0) {
            this.showToast(this.t('receive.no_messages_export'));
            return;
          }
          
          // 构建 TXT 内容
          let content = '=== SimpleFaka 消息记录导出 ===\\n';
          content += '导出时间: ' + new Date().toLocaleString('zh-CN') + '\\n';
          content += '消息总数: ' + validMessages.length + '\\n';
          content += '\\n' + '-'.repeat(50) + '\\n\\n';
          
          validMessages.forEach((msg, idx) => {
            content += '[' + msg.time + ']';
            if (msg.tel) content += ' ' + msg.tel;
            content += '\\n';
            content += '内容: ' + msg.text + '\\n';
            if (msg.codes && msg.codes.length > 0) {
              content += '验证码: ' + msg.codes.join(', ') + '\\n';
            }
            content += '\\n' + '-'.repeat(50) + '\\n\\n';
          });
          
          content += '--- END OF EXPORT ---\\n';
          content += '© 2026 SIMPLEFAKA PROTOCOL\\n';
          
          // 创建下载
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'simplefaka_messages_' + Date.now() + '.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          this.showToast(this.t('receive.export_success'));
        },
        
        // ===== 通知功能 =====
        toggleNotification() {
          this.notificationEnabled = !this.notificationEnabled;
          localStorage.setItem(this.NOTIFICATION_KEY, String(this.notificationEnabled));
          this.showToast(this.notificationEnabled ? this.t('receive.notification_enabled') : this.t('receive.notification_disabled'));
        },
        
        playNotification(text) {
          if (!this.notificationEnabled) return;
          
          // 浏览器通知
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SimpleFaka - ' + this.t('receive.new_signal'), {
              body: text.substring(0, 100),
              icon: '/logo.png'
            });
          }
          
          // 音频提示音
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (e) {
            console.log('Audio notification failed:', e);
          }
          
          // 移动端震动
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      };
    }
  </script>
</body>
</html>`
}