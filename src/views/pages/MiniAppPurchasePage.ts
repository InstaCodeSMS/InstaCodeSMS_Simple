/**
 * Mini App 购买页面
 * 简化版，直接渲染产品列表
 */

import { raw } from 'hono/html'
import type { Language } from '@/i18n'
import type { Product } from '@/views/components/ProductCard'

interface MiniAppPurchasePageProps {
  products: Product[]
  lang?: Language
  csrfToken?: string
}

/**
 * 获取服务图标
 */
function getServiceIcon(id: string): string {
  const emojis = ['📱', '⚡', '🛡️', '🔑', '🚀', '🤖', '💬', '🌌', '📡', '🌐', '📧', '🎮', '🎬', '🎵', '📚']
  const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return emojis[hash % emojis.length]
}

/**
 * Mini App 购买页面
 */
export function MiniAppPurchasePage({ products, lang = 'zh', csrfToken = '' }: MiniAppPurchasePageProps): string {
  const texts = {
    zh: {
      title: '购买服务',
      subtitle: '选择产品',
      searchPlaceholder: '搜索产品...',
      notFound: '未找到产品',
      startingPrice: '起售价',
      stock: '库存',
      outOfStock: '售罄',
      buy: '购买'
    },
    en: {
      title: 'Purchase',
      subtitle: 'Select Product',
      searchPlaceholder: 'Search products...',
      notFound: 'No products found',
      startingPrice: 'Starting at',
      stock: 'Stock',
      outOfStock: 'Out of Stock',
      buy: 'Buy'
    }
  }
  
  const t = texts[lang]
  
  // 渲染产品卡片
  const productCards = products.map(p => {
    const icon = getServiceIcon(p.id)
    const inStock = p.num > 0
    const stockClass = inStock ? 'text-success' : 'text-error'
    const stockText = inStock ? String(p.num) : t.outOfStock
    const opacityClass = !inStock ? 'opacity-60' : ''
    const onclick = inStock ? `onclick="openProductModal('${p.id}')"` : ''
    const buyBtn = inStock ? `<button class="btn btn-primary btn-block mt-4" onclick="event.stopPropagation(); openProductModal('${p.id}')">${t.buy}</button>` : ''
    
    return `<div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow p-4 ${opacityClass}" ${onclick}>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-base-200">
            <span>${icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base truncate">${p.title}</h3>
            <p class="text-sm opacity-60 line-clamp-1">${p.description || ''}</p>
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
          <div>
            <span class="text-xs opacity-60">${t.startingPrice}</span>
            <div class="text-2xl font-bold text-primary">
              <span class="text-sm font-normal opacity-60">¥</span>
              ${(p.sales_price || 0).toFixed(2)}
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs opacity-60">${t.stock}</span>
            <div class="${stockClass} font-bold">${stockText}</div>
          </div>
        </div>
        ${buyBtn}
      </div>`
  }).join('')
  
  // 构建完整页面
  const page = `
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold" style="color: var(--text-primary);">${t.title}</h1>
      <p class="text-sm opacity-60" style="color: var(--text-muted);">${t.subtitle}</p>
    </div>
    
    <!-- 搜索栏 -->
    <div class="mb-6">
      <div class="relative">
        <input type="text" 
               id="searchInput"
               placeholder="${t.searchPlaceholder}"
               class="input input-bordered w-full pr-10"
               oninput="filterProducts(this.value)"
               style="background-color: var(--bg-input); border-color: var(--border-color-light); color: var(--text-primary);" />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
      </div>
    </div>
    
    <!-- 产品列表 -->
    <div id="productList" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      ${productCards}
    </div>
    
    <!-- 空状态 -->
    <div id="emptyState" class="hidden text-center py-12">
      <span class="text-4xl">🔍</span>
      <p class="mt-4 text-sm" style="color: var(--text-muted);">${t.notFound}</p>
    </div>
    
    <!-- 购买弹窗 Modal -->
    <dialog id="purchaseModal" class="modal modal-bottom">
      <div class="modal-box" style="background-color: var(--bg-secondary);">
        <h3 class="font-bold text-lg mb-4" id="modalTitle" style="color: var(--text-primary);">产品名称</h3>
        
        <div class="mb-4">
          <label class="text-sm font-medium mb-2 block" style="color: var(--text-secondary);">选择有效期</label>
          <div id="expiryOptions" class="grid grid-cols-2 gap-2"></div>
        </div>
        
        <div class="mb-4">
          <label class="text-sm font-medium mb-2 block" style="color: var(--text-secondary);">数量</label>
          <div class="flex items-center gap-2">
            <button class="btn btn-sm" onclick="changeQuantity(-1)">−</button>
            <span id="quantity" class="text-lg font-bold px-4">1</span>
            <button class="btn btn-sm" onclick="changeQuantity(1)">+</button>
          </div>
        </div>
        
        <div class="mb-4">
          <label class="text-sm font-medium mb-2 block" style="color: var(--text-secondary);">支付方式</label>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-outline btn-sm" onclick="selectPayment('alipay')" id="btn-alipay">💳 支付宝</button>
            <button class="btn btn-outline btn-sm" onclick="selectPayment('usdt')" id="btn-usdt">₮ USDT</button>
          </div>
        </div>
        
        <div class="mb-4 p-4 rounded-xl" style="background-color: var(--bg-tertiary);">
          <div class="flex justify-between items-center">
            <span style="color: var(--text-muted);">总价</span>
            <span class="text-2xl font-bold text-primary">¥<span id="totalPrice">0.00</span></span>
          </div>
        </div>
        
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">取消</button>
          </form>
          <button class="btn btn-primary" onclick="submitOrder()">确认购买</button>
        </div>
      </div>
    </dialog>
    
    <script>
      var allProducts = ${JSON.stringify(products)};
      var selectedProduct = null;
      var selectedExpiry = null;
      var quantity = 1;
      var paymentMethod = 'alipay';
      
      function filterProducts(query) {
        var filtered = allProducts.filter(function(p) { 
          return p.title.toLowerCase().indexOf(query.toLowerCase()) >= 0;
        });
        var productList = document.getElementById('productList');
        var emptyState = document.getElementById('emptyState');
        if (filtered.length === 0) {
          productList.innerHTML = '';
          emptyState.classList.remove('hidden');
        } else {
          emptyState.classList.add('hidden');
          productList.innerHTML = filtered.map(createProductCard).join('');
        }
      }
      
      function createProductCard(product) {
        var icon = getServiceIcon(product.id);
        var inStock = product.num > 0;
        var stockClass = inStock ? 'text-success' : 'text-error';
        var stockText = inStock ? product.num : '售罄';
        var opacityClass = !inStock ? 'opacity-60' : '';
        var onclick = inStock ? 'onclick="openProductModal(\\'' + product.id + '\\')"' : '';
        var buyBtn = inStock ? '<button class="btn btn-primary btn-block mt-4" onclick="event.stopPropagation(); openProductModal(\\'' + product.id + '\\')">购买</button>' : '';
        return '<div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow p-4 ' + opacityClass + '" ' + onclick + '>' +
          '<div class="flex items-start gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-base-200"><span>' + icon + '</span></div>' +
          '<div class="flex-1 min-w-0"><h3 class="font-bold text-base truncate">' + product.title + '</h3>' +
          '<p class="text-sm opacity-60 line-clamp-1">' + (product.description || '') + '</p></div></div>' +
          '<div class="flex items-center justify-between mt-4 pt-4 border-t border-base-200"><div><span class="text-xs opacity-60">起售价</span>' +
          '<div class="text-2xl font-bold text-primary"><span class="text-sm font-normal opacity-60">¥</span>' + (product.sales_price || 0).toFixed(2) + '</div></div>' +
          '<div class="text-right"><span class="text-xs opacity-60">库存</span><div class="' + stockClass + ' font-bold">' + stockText + '</div></div></div>' +
          buyBtn + '</div>';
      }
      
      function getServiceIcon(id) {
        var emojis = ['📱', '⚡', '🛡️', '🔑', '🚀', '🤖', '💬', '🌌', '📡', '🌐', '📧', '🎮', '🎬', '🎵', '📚'];
        var hash = String(id).split('').reduce(function(acc, char) { return acc + char.charCodeAt(0); }, 0);
        return emojis[hash % emojis.length];
      }
      
      function openProductModal(productId) {
        selectedProduct = allProducts.find(function(p) { return p.id === productId; });
        if (!selectedProduct) return;
        document.getElementById('modalTitle').textContent = selectedProduct.title;
        var expiryContainer = document.getElementById('expiryOptions');
        if (selectedProduct.expiry_options && selectedProduct.expiry_options.length > 0) {
          expiryContainer.innerHTML = selectedProduct.expiry_options.map(function(exp, idx) { 
            return '<button class="btn btn-sm ' + (idx === 0 ? 'btn-primary' : 'btn-outline') + '" onclick="selectExpiry(' + exp.expiry + ', ' + exp.price + ')" id="expiry-' + exp.expiry + '">' + exp.label + ' - ¥' + exp.price.toFixed(2) + '</button>';
          }).join('');
          selectedExpiry = selectedProduct.expiry_options[0].expiry;
        } else {
          expiryContainer.innerHTML = '<p class="text-sm opacity-60">无有效期选项</p>';
          selectedExpiry = null;
        }
        quantity = 1;
        document.getElementById('quantity').textContent = '1';
        updateTotal();
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        document.getElementById('purchaseModal').showModal();
      }
      
      function selectExpiry(expiry, price) {
        selectedExpiry = expiry;
        var buttons = document.querySelectorAll('#expiryOptions button');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].classList.remove('btn-primary');
          buttons[i].classList.add('btn-outline');
        }
        var btn = document.getElementById('expiry-' + expiry);
        if (btn) { btn.classList.remove('btn-outline'); btn.classList.add('btn-primary'); }
        updateTotal();
      }
      
      function changeQuantity(delta) {
        var max = selectedProduct ? selectedProduct.num : 100;
        quantity = Math.max(1, Math.min(quantity + delta, max));
        document.getElementById('quantity').textContent = quantity;
        updateTotal();
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
      
      function selectPayment(method) {
        paymentMethod = method;
        document.querySelectorAll('#btn-alipay, #btn-usdt').forEach(function(btn) { btn.classList.remove('btn-primary'); });
        var btn = document.getElementById('btn-' + method);
        if (btn) btn.classList.add('btn-primary');
      }
      
      function updateTotal() {
        if (!selectedProduct) return;
        var unitPrice = selectedProduct.sales_price || 0;
        if (selectedProduct.expiry_options && selectedExpiry) {
          var option = selectedProduct.expiry_options.find(function(o) { return o.expiry === selectedExpiry; });
          if (option) unitPrice = option.price;
        }
        document.getElementById('totalPrice').textContent = (unitPrice * quantity).toFixed(2);
      }
      
      function submitOrder() {
        if (!selectedProduct) return;
        var selectedOption = selectedProduct.expiry_options ? selectedProduct.expiry_options.find(function(o) { return o.expiry === selectedExpiry; }) : null;
        var totalAmount = parseFloat(document.getElementById('totalPrice').textContent);
        fetch('/rpc/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            payment_method: paymentMethod,
            product_info: {
              service_id: selectedProduct.id,
              title: selectedProduct.title,
              quantity: quantity,
              expiry: selectedExpiry,
              expiry_days: selectedOption ? selectedOption.label : '未知',
              unit_price: totalAmount / quantity
            },
            trade_type: paymentMethod === 'usdt' ? 'usdt.trc20' : 'alipay'
          })
        }).then(function(res) { return res.json(); }).then(function(data) {
          if (data.success && data.data && data.data.payment_url) {
            window.location.href = data.data.payment_url;
          } else {
            alert(data.message || '创建订单失败');
          }
        }).catch(function() { alert('网络错误，请重试'); });
      }
      
      selectPayment('alipay');
    </script>
  `
  
  return raw(page)
}

export default MiniAppPurchasePage