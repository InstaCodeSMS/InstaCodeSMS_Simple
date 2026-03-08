/**
 * Footer Component
 * 
 * Why: 四列布局Footer，使用Alpine.js全局t()函数实现多语言
 */

export default function Footer() {
  return `
  <footer class="text-base-content" style="background-color: var(--bg-secondary);">
    <!-- 主要内容区 -->
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- 第一列：品牌区 -->
        <div class="space-y-4">
          <h3 class="text-xl font-bold" x-text="t('common.brand_name')"></h3>
          <p class="text-sm opacity-70" x-text="t('footer.brand.slogan')"></p>
          <p class="text-xs opacity-60" x-text="t('footer.brand.features')"></p>
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
            <li><a href="#" class="opacity-70 hover:opacity-100 transition-opacity" x-text="t('footer.support.status')"></a></li>
          </ul>
        </div>
        
        <!-- 第四列：联系我们 -->
        <div class="space-y-4">
          <h4 class="font-semibold" x-text="t('footer.contact.title')"></h4>
          <ul class="space-y-3">
            <li>
              <a href="https://t.me/InstaCodeSMS" target="_blank" rel="noopener noreferrer" 
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
                <span x-text="t('footer.contact.telegram')"></span>
              </a>
            </li>
            <li>
              <a href="https://facebook.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                <span x-text="t('footer.contact.facebook')"></span>
              </a>
            </li>
            <li>
              <a href="https://twitter.com/InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                <span x-text="t('footer.contact.twitter')"></span>
              </a>
            </li>
            <li>
              <a href="https://youtube.com/@InstaCodeSMS" target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 
49.56 0 0 1 16.2 
0A2 
2 
0 
0 
1 
21.5 
7a24.12 
24.12 
0 
0 
1 
0 
10 
2 
２ 
０ 
０ 
１ 
-１.４ 
１．４ 
４９．５５ 
４９．５５ 
０ 
０ 
１ 
-１６．２ 
０A２ 
２ 
０ 
０ 
１ 
２．５ 
１７"></path><path d="m10 15  
5-3-5-3z"></path></svg>
                <span x-text="t('footer.contact.youtube')"></span>
              </a>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
    
    <!-- 底部版权栏 -->
    <div class="border-t" style="border-color: var(--border-color);">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-sm opacity-60 space-x-4">
          <span x-text="t('footer.copyright')"></span>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.privacy')"></a>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.terms')"></a>
          <span class="opacity-40">|</span>
          <a href="#" class="hover:opacity-100 transition-opacity" x-text="t('footer.status')"></a>
        </div>
      </div>
    </div>
  </footer>
  `
}
