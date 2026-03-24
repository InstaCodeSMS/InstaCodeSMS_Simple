/**
 * Footer Component
 * 
 * Why: 四列布局Footer，使用Alpine.js全局t()函数实现多语言
 */

export default function Footer() {
  return `
  <footer class="text-base-content" style="background-color: var(--bg-secondary);">
    <!-- 主要内容区 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- 第一列：品牌区 -->
        <div class="space-y-4">
          <h3 class="text-xl font-bold" x-text="t('common.brand_name')"></h3>
          <p class="text-sm opacity-70" x-text="t('footer.brand.slogan')"></p>
          <p class="text-xs opacity-60" x-text="t('footer.brand.features')"></p>
          <!-- 社交平台图标 -->
          <div class="flex gap-3 pt-2">
            <a href="https://t.me/InstaCodeSMS" target="_blank" rel="noopener noreferrer" title="Telegram"
               class="opacity-70 hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            <a href="https://facebook.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer" title="Facebook"
               class="opacity-70 hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://twitter.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer" title="X (Twitter)"
               class="opacity-70 hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://youtube.com/@InstaCodeSMS" target="_blank" rel="noopener noreferrer" title="YouTube"
               class="opacity-70 hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
        
        <!-- 第二列：产品服务 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.products.title')"></h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.smsCode')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.virtualNumber')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.bulkPurchase')"></a></li>
            <li><a href="/purchase" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.products.pricing')"></a></li>
          </ul>
        </div>
        
        <!-- 第三列：帮助支持 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.support.title')"></h4>
          <ul class="space-y-2 text-sm">
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.guide')"></a></li>
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.apiDocs')"></a></li>
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.faq')"></a></li>
          </ul>
        </div>
        
      </div>
    </div>
    
        <!-- 底部版权栏 -->
    <div class="border-t" style="border-color: var(--border-color);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div class="flex flex-wrap justify-center items-center gap-4 text-sm opacity-60">
          <span x-text="t('footer.copyright')"></span>
          <span class="opacity-40">|</span>
          <a href="/privacy" class="hover:opacity-100 transition-opacity" x-text="t('footer.privacy')" onclick="event.preventDefault(); window.location.href = (window.location.pathname.startsWith('/en') ? '/en/privacy' : '/zh/privacy')"></a>
          <span class="opacity-40">|</span>
          <a href="/terms" class="hover:opacity-100 transition-opacity" x-text="t('footer.terms')" onclick="event.preventDefault(); window.location.href = (window.location.pathname.startsWith('/en') ? '/en/terms' : '/zh/terms')"></a>
          <span class="opacity-40">|</span>
          <iframe src="https://status.instacodesms.com/badge?theme=dark" width="250" height="30" frameborder="0" scrolling="no" style="color-scheme: normal;"></iframe>
        </div>
      </div>
    </div>
  </footer>
  `
}
