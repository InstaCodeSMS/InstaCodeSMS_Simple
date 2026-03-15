/**
 * Mini App 主应用逻辑
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('miniApp', () => ({
    cartCount: 0,
    user: null,
    
    init() {
      this.user = window.telegram?.user
      this.loadCartCount()
      window.addEventListener('cart-updated', () => {
        this.loadCartCount()
      })
      console.log('[App] Initialized', { user: this.user })
    },
    
    async loadCartCount() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        this.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
      } catch (error) {
        console.error('[App] Failed to load cart count:', error)
        this.cartCount = 0
      }
    },
    
    goToOrders() {
      window.telegram?.hapticFeedback('selection')
      htmx.ajax('GET', '/mini-app/pages/orders', {
        target: '#content',
        swap: 'innerHTML'
      })
    },
    
    goToCart() {
      window.telegram?.hapticFeedback('selection')
      htmx.ajax('GET', '/mini-app/pages/cart', {
        target: '#content',
        swap: 'innerHTML'
      })
    },
    
    goToHome() {
      window.telegram?.hapticFeedback('selection')
      htmx.ajax('GET', '/mini-app/pages/home', {
        target: '#content',
        swap: 'innerHTML'
      })
    }
  }))
  
  Alpine.data('cart', () => ({
    items: [],
    
    init() {
      this.loadCart()
    },
    
    loadCart() {
      try {
        this.items = JSON.parse(localStorage.getItem('cart') || '[]')
      } catch (error) {
        console.error('[Cart] Failed to load:', error)
        this.items = []
      }
    },
    
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.items))
      window.dispatchEvent(new Event('cart-updated'))
    },
    
    addToCart(product, quantity = 1) {
      const existing = this.items.find(item => item.id === product.id)
      
      if (existing) {
        existing.quantity += quantity
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.sales_price,
          quantity: quantity
        })
      }
      
      this.saveCart()
      window.telegram?.hapticFeedback('notification', 'success')
      window.telegram?.showAlert('已添加到购物车')
    },
    
    updateQuantity(itemId, quantity) {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.quantity = Math.max(1, quantity)
        this.saveCart()
      }
    },
    
    removeItem(itemId) {
      this.items = this.items.filter(item => item.id !== itemId)
      this.saveCart()
      window.telegram?.hapticFeedback('notification', 'warning')
    },
    
    clearCart() {
      window.telegram?.showConfirm('确定要清空购物车吗？', (confirmed) => {
        if (confirmed) {
          this.items = []
          this.saveCart()
          window.telegram?.hapticFeedback('notification', 'success')
        }
      })
    },
    
    get total() {
      return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    
    get count() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0)
    }
  }))
})

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('htmx:configRequest', (event) => {
    const userId = window.telegram?.getUserId()
    const initData = window.telegram?.getInitData()
    
    if (userId) {
      event.detail.headers['X-Telegram-User-Id'] = userId
    }
    if (initData) {
      event.detail.headers['X-Telegram-Init-Data'] = initData
    }
  })
  
  document.body.addEventListener('htmx:afterSwap', (event) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
  
  document.body.addEventListener('htmx:responseError', (event) => {
    console.error('[HTMX] Response error:', event.detail)
    window.telegram?.showAlert('加载失败，请重试')
  })
})