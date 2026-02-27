/**
 * Telegram Mini App 结算页面
 * 订单确认和支付
 */

export default function TelegramMiniAppCheckout(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>结算 - SimpleFaka</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="tg-safe-area" x-data="checkoutApp()">
    <!-- 顶部导航 -->
    <div class="sticky top-0 bg-white border-b border-gray-200 z-10">
      <div class="px-4 py-3 flex items-center justify-between">
        <button @click="goBack()" class="text-blue-500 text-sm font-semibold">← 返回</button>
        <h1 class="text-lg font-bold">确认订单</h1>
        <div class="w-12"></div>
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="px-4 py-4 pb-32">
      <div class="bg-white rounded-lg p-4 mb-4">
        <h2 class="font-semibold mb-2" x-text="product?.title"></h2>
        <p class="text-sm text-gray-500 mb-4" x-text="product?.description"></p>

        <!-- 有效期选择 -->
        <div class="mb-4">
          <label class="text-sm font-semibold mb-2 block">选择有效期</label>
          <div class="space-y-2">
            <template x-for="option in expiryOptions" :key="option.expiry">
              <button
                @click="selectedExpiry = option.expiry"
                :class="selectedExpiry === option.expiry ? 'bg-blue-500 text-white' : 'bg-gray-100'"
                class="w-full px-3 py-2 rounded text-sm font-semibold transition"
              >
                <span x-text="option.label"></span> - ¥<span x-text="option.price?.toFixed(2)"></span>
              </button>
            </template>
          </div>
        </div>

        <!-- 数量选择 -->
        <div class="mb-4">
          <label class="text-sm font-semibold mb-2 block">数量</label>
          <div class="flex items-center gap-2">
            <button @click="quantity = Math.max(1, quantity - 1)" class="px-3 py-1 bg-gray-200 rounded font-semibold">-</button>
            <input x-model.number="quantity" type="number" min="1" class="w-12 text-center border border-gray-300 rounded">
            <button @click="quantity++" class="px-3 py-1 bg-gray-200 rounded font-semibold">+</button>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="mb-4">
          <label class="text-sm font-semibold mb-2 block">支付方式</label>
          <div class="space-y-2">
            <button
              @click="paymentMethod = 'usdt'"
              :class="paymentMethod === 'usdt' ? 'bg-blue-500 text-white' : 'bg-gray-100'"
              class="w-full px-3 py-2 rounded text-sm font-semibold transition"
            >
              USDT
            </button>
            <button
              @click="paymentMethod = 'alipay'"
              :class="paymentMethod === 'alipay' ? 'bg-blue-500 text-white' : 'bg-gray-100'"
              class="w-full px-3 py-2 rounded text-sm font-semibold transition"
            >
              支付宝
            </button>
          </div>
        </div>

        <!-- 价格总计 -->
        <div class="border-t pt-4">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">小计</span>
            <span>¥<span x-text="subtotal.toFixed(2)"></span></span>
          </div>
          <div class="flex justify-between text-lg font-bold">
            <span>总计</span>
            <span class="text-blue-500">¥<span x-text="total.toFixed(2)"></span></span>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div x-show="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p x-text="error"></p>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 tg-safe-area">
      <button
        @click="submitOrder()"
        :disabled="isSubmitting"
        class="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span x-show="!isSubmitting">立即支付</span>
        <span x-show="isSubmitting">处理中...</span>
      </button>
    </div>
  </div>

  <script>
    function checkoutApp() {
      return {
        product: null,
        expiryOptions: [],
        selectedExpiry: null,
        quantity: 1,
        paymentMethod: 'usdt',
        isSubmitting: false,
        error: '',

        get subtotal() {
          const option = this.expiryOptions.find(o => o.expiry === this.selectedExpiry)
          return (option?.price || 0) * this.quantity
        },

        get total() {
          return this.subtotal
        },

        async init() {
          const tg = window.Telegram.WebApp
          tg.ready()
          tg.expand()

          // 从 URL 获取 productId
          const params = new URLSearchParams(window.location.search)
          const productId = params.get('productId')

          if (productId) {
            await this.loadProduct(productId)
          }
        },

        async loadProduct(productId) {
          try {
            const response = await fetch(\`/api/telegram-mini-app/products/\${productId}\`)
            const data = await response.json()
            if (data.success) {
              this.product = data.data
              this.expiryOptions = data.data.expiry_pricing?.options || []
              if (this.expiryOptions.length > 0) {
                this.selectedExpiry = this.expiryOptions[0].expiry
              }
            } else {
              this.error = '加载商品失败'
            }
          } catch (error) {
            console.error('Failed to load product:', error)
            this.error = '加载商品失败'
          }
        },

        async submitOrder() {
          if (!this.selectedExpiry) {
            this.error = '请选择有效期'
            return
          }

          this.isSubmitting = true
          this.error = ''

          try {
            const response = await fetch('/api/telegram-mini-app/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: this.product.id,
                expiry: this.selectedExpiry,
                quantity: this.quantity,
                paymentMethod: this.paymentMethod
              })
            })

            const data = await response.json()
            if (data.success) {
              // 跳转到支付页面或成功页面
              window.location.href = \`/telegram-mini-app/success?orderId=\${data.data.orderId}\`
            } else {
              this.error = '订单创建失败: ' + data.message
            }
          } catch (error) {
            console.error('Error:', error)
            this.error = '错误: ' + error.message
          } finally {
            this.isSubmitting = false
          }
        },

        goBack() {
          window.history.back()
        }
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      const app = checkoutApp()
      app.init()
    })
  </script>
</body>
</html>
  `.trim()
}
