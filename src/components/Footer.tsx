export default function Footer() {
  return `
  <footer class="border-t transition-colors duration-300 py-14 px-6"
          style="background-color: var(--bg-primary); border-color: var(--border-color);">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <!-- 品牌名 -->
        <span class="text-xl font-black tracking-tight">
          <span style="color: var(--accent-blue)">SIMPLE</span><span class="text-purple-500">FAKA</span>
        </span>
        
        <!-- 链接 -->
        <div class="flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
          <a href="#" class="hover:opacity-80 transition-opacity">联系支持</a>
          <a href="#" class="hover:opacity-80 transition-opacity">隐私政策</a>
          <a href="#" class="hover:opacity-80 transition-opacity">服务条款</a>
        </div>
        
        <!-- 版权 -->
        <p class="text-xs" style="color: var(--text-muted);">
          © 2026 SIMPLEFAKA PROTOCOL. 版权所有.
        </p>
      </div>
    </div>
  </footer>
  `
}