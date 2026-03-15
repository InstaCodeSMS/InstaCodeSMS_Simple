/**
 * Dashboard 内容片段组件
 * 
 * Why: 为 Dashboard 页面提供可被 HTMX 局部刷新的内容
 * 保持现有的功能逻辑，适配新的侧边栏布局
 */

export function DashboardContent(csrfToken: string = ''): string {
  const content = `
  <main class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold" x-text="t('dashboard.title')"></h1>
        <button 
          hx-post="/api/auth/logout"
          hx-on::after-request="window.location.href = '/' + lang + '/login'"
          class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          x-text="t('auth.logout')"
        ></button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)]">
          <h3 class="text-lg font-semibold mb-2" x-text="t('dashboard.account_info')"></h3>
          <div
            id="user-info" 
            hx-get="/api/user/profile" 
            hx-trigger="load"
            hx-swap="innerHTML"
          >
            <div class="animate-pulse space-y-2">
              <div class="h-4 bg-gray-300 rounded w-3/4"></div>
              <div class="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)]">
          <h3 class="text-lg font-semibold mb-2" x-text="t('dashboard.balance')"></h3>
          <div class="text-2xl font-bold text-green-500">¥0.00</div>
          <p class="text-sm text-muted mt-1" x-text="t('dashboard.current_balance')"></p>
        </div>
        
        <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)]">
          <h3 class="text-lg font-semibold mb-2" x-text="t('dashboard.order_stats')"></h3>
          <div class="text-2xl font-bold" id="order-count">0</div>
          <p class="text-sm text-muted mt-1" x-text="t('dashboard.total_orders')"></p>
        </div>
      </div>

      <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)]">
        <h3 class="text-lg font-semibold mb-4" x-text="t('dashboard.recent_orders')"></h3>
        <div 
          id="orders-list" 
          hx-get="/api/user/orders" 
          hx-trigger="load"
          hx-swap="innerHTML"
        >
          <div class="animate-pulse space-y-4">
            <div class="h-4 bg-gray-300 rounded"></div>
            <div class="h-4 bg-gray-300 rounded w-5/6"></div>
            <div class="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>

    <script>
      document.body.addEventListener('htmx:afterSwap', function(event) {
        if (event.detail.target.id === 'user-info') {
          const response = JSON.parse(event.detail.xhr.responseText);
          if (response.success && response.data) {
            const lang = window.getLang ? window.getLang() : 'zh';
            event.detail.target.innerHTML = \`
              <div class="space-y-2">
                <p class="text-sm"><span class="text-muted">\${lang === 'zh' ? '邮箱：' : 'Email: '}</span>\${response.data.email}</p>
                <p class="text-sm"><span class="text-muted">\${lang === 'zh' ? '角色：' : 'Role: '}</span>\${response.data.role}</p>
              </div>
            \`;
          }
        }
        
        if (event.detail.target.id === 'orders-list') {
          const response = JSON.parse(event.detail.xhr.responseText);
          if (response.success && response.data) {
            const orders = response.data;
            const lang = window.getLang ? window.getLang() : 'zh';
            document.getElementById('order-count').textContent = orders.length;
            
            if (orders.length === 0) {
              event.detail.target.innerHTML = '<div class="text-center py-8 text-muted">' + (lang === 'zh' ? '暂无订单记录' : 'No orders yet') + '</div>';
            } else {
              event.detail.target.innerHTML = orders.map(order => \`
                <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border)] mb-4">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h4 class="font-medium">\${order.product_info?.title || (lang === 'zh' ? '未知产品' : 'Unknown Product')}</h4>
                      <p class="text-sm text-muted">\${lang === 'zh' ? '订单号: ' : 'Order ID: '}\${order.order_id}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold">¥\${order.amount}</p>
                      <span class="px-2 py-1 rounded text-xs \${
                        order.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }">
                        \${
                          order.status === 'paid' ? (lang === 'zh' ? '已支付' : 'Paid') : 
                          order.status === 'pending' ? (lang === 'zh' ? '待支付' : 'Pending') : 
                          (lang === 'zh' ? '已取消' : 'Cancelled')
                        }
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-muted">\${new Date(order.created_at).toLocaleString()}</p>
                </div>
              \`).join('');
            }
          }
        }
      });
    </script>
  </main>`

  return content
}