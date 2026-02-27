/**
 * Telegram Mini App 主页面
 * 商品列表展示
 */

export default function TelegramMiniAppIndex(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>SimpleFaka - 商城</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .tg-safe-area {
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }
  </style>
</head>
<body class="bg-gray-50">
  <div class="tg-safe-area" x-data="miniApp()">
    <!-- 顶部导航 -->
    <div class="sticky top-0 bg-white border-b border-gray-200 z-10">
      <div class="px-4 py-3 flex items-center justify-between">
        <h1 class="text-lg font-bold">SimpleFaka</h1>
        <button @click="goBack()" class="text-blue-500 text-sm font-semibold">返回</button>
      </div>
    </div>

    <!-- 搜索和排序 -->
    <div class="px-4 py-3 space-y-3">
      <input
        x-model="searchQuery"
        type="text"
        placeholder="搜索商品..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <div class="flex gap-2">
        <button
          @click="sortBy = 'default'"
          :class="sortBy === 'default' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
          class="px-3 py-1 rounded text-sm font-semibold"
        >
          默认
        </button>
        <button
          @click="sortBy = 'priceLow'"
          :class="sortBy === 'priceLow' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
          class="px-3 py-1 rounded text-sm font-semibold"
        >
          价格低
        </button>
        <button
          @click="sortBy = 'priceHigh'"
          :class="sortBy === 'priceHigh' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
          class="px-3 py-1 rounded text-sm font-semibold"
        >
          价格高
        </button>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="px-4 py-4 space-y-3 pb-20">
      <template x-for="product in filteredProducts" :key="product.id">
        <div
          @click="selectProduct(product)"
          class="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-sm flex-1" x-text="product.title"></h3>
            <span class="text-lg font-bold text-blue-500 ml-2">¥<span x-text="product.sales_price?.toFixed(2)"></span></span>
          </div>
          <p class="text-xs text-gray-500 mb-2" x-text="product.description || ''"></p>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500">库存: <span x-text="product.num"></span></span>
            <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold">选择</button>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div x-show="loading" class="text-center py-8">
        <div class="inline-block animate-spin">⏳</div>
        <p class="text-gray-500 text-sm mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div x-show="!loading && filteredProducts.length === 0" class="text-center py-8">
        <p class="text-gray-500 text-sm">暂无商品</p>
      </div>
    </div>
  </div>

  <script>
    function miniApp() {
      return {
        products: [],
        searchQuery: '',
        sortBy: 'default',
        loading: true,

        get filteredProducts() {
          let filtered = this.products.filter(p =>
            p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
          )

          if (this.sortBy === 'priceLow') {
            filtered.sort((a, b) => (a.sales_price || 0) - (b.sales_price || 0))
          } else if (this.sortBy === 'priceHigh') {
            filtered.sort((a, b) => (b.sales_price || 0) - (a.sales_price || 0))
          }

          return filtered
        },

        async init() {
          // 初始化 Telegram Web App
          const tg = window.Telegram.WebApp
          tg.ready()
          tg.expand()

          // 获取商品列表
          await this.loadProducts()
        },

        async loadProducts() {
          try {
            const response = await fetch('/api/telegram-mini-app/products')
            const data = await response.json()
            if (data.success) {
              this.products = data.data || []
            } else {
              console.error('Failed to load products:', data.message)
            }
          } catch (error) {
            console.error('Failed to load products:', error)
          } finally {
            this.loading = false
          }
        },

        selectProduct(product) {
          // 跳转到结算页面
          window.location.href = \`/telegram-mini-app/checkout?productId=\${product.id}\`
        },

        goBack() {
          window.Telegram.WebApp.close()
        }
      }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      const app = miniApp()
      app.init()
    })
  </script>
</body>
</html>
  `.trim()
}
