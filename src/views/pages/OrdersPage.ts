/**
 * Orders 页面视图
 * 订单管理页面 - 支持多语言
 * 
 * Why: 用户查看虚拟号码租用订单的管理中心
 */

import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'

export function OrdersPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <div class="min-h-screen">
    ${Sidebar()}
    <div class="transition-all duration-300 md:ml-64">
      <div class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
        <main x-data="ordersApp()" x-init="init()" class="max-w-5xl mx-auto">
          <!-- 页面标题 -->
          <div class="mb-8">
            <h1 class="text-2xl font-bold" style="color: var(--text-primary);" x-text="t('orders.title')"></h1>
            <p class="mt-2 text-sm" style="color: var(--text-muted);" x-text="t('orders.subtitle')"></p>
          </div>

          <!-- 统计卡片 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <!-- 总订单 -->
            <div class="rounded-xl p-4" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs" style="color: var(--text-muted);" x-text="t('orders.stats_total')"></p>
                  <p class="text-2xl font-bold mt-1" style="color: var(--text-primary);" x-text="stats.total"></p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 进行中 -->
            <div class="rounded-xl p-4" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs" style="color: var(--text-muted);" x-text="t('orders.stats_active')"></p>
                  <p class="text-2xl font-bold mt-1 text-green-500" x-text="stats.active"></p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 已完成 -->
            <div class="rounded-xl p-4" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs" style="color: var(--text-muted);" x-text="t('orders.stats_completed')"></p>
                  <p class="text-2xl font-bold mt-1 text-blue-500" x-text="stats.completed"></p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 总消费 -->
            <div class="rounded-xl p-4" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs" style="color: var(--text-muted);" x-text="t('orders.stats_spent')"></p>
                  <p class="text-2xl font-bold mt-1" style="color: var(--text-primary);">
                    <span x-text="formatAmount(stats.totalSpent)"></span>
                  </p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 筛选标签 -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button 
              @click="filterStatus = ''"
              :class="filterStatus === '' ? 'ring-2 ring-blue-500' : ''"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
              x-text="t('orders.filter_all')">
            </button>
            <button 
              @click="filterStatus = 'active'"
              :class="filterStatus === 'active' ? 'ring-2 ring-green-500' : ''"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
              x-text="t('orders.filter_active')">
            </button>
            <button 
              @click="filterStatus = 'completed'"
              :class="filterStatus === 'completed' ? 'ring-2 ring-blue-500' : ''"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
              x-text="t('orders.filter_completed')">
            </button>
            <button 
              @click="filterStatus = 'expired'"
              :class="filterStatus === 'expired' ? 'ring-2 ring-yellow-500' : ''"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
              x-text="t('orders.filter_expired')">
            </button>
          </div>

          <!-- 订单列表 -->
          <div class="space-y-4">
            <!-- 空状态 -->
            <template x-if="orders.length === 0 && !loading">
              <div class="text-center py-12 rounded-xl" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
                <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p style="color: var(--text-muted);" x-text="t('orders.no_orders')"></p>
                <a :href="'/' + lang + '/purchase'" class="inline-block mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-300" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
                  <span x-text="t('orders.go_purchase')"></span>
                </a>
              </div>
            </template>

            <!-- 订单卡片 -->
            <template x-for="order in filteredOrders" :key="order.id">
              <div class="rounded-xl overflow-hidden transition-all duration-300" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
                <!-- 订单头部 -->
                <div class="flex items-center justify-between px-4 py-3" style="background-color: var(--bg-tertiary); border-bottom: 0.667px solid var(--border-color);">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono" style="color: var(--text-muted);" x-text="'#' + order.order_no"></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- 状态标签 -->
                    <span 
                      class="px-2 py-1 text-xs rounded-full font-medium"
                      :class="{
                        'bg-green-500/20 text-green-500': order.status === 'active',
                        'bg-blue-500/20 text-blue-500': order.status === 'completed',
                        'bg-yellow-500/20 text-yellow-500': order.status === 'expired',
                        'bg-red-500/20 text-red-500': order.status === 'cancelled',
                        'bg-gray-500/20 text-gray-500': order.status === 'pending'
                      }"
                      x-text="getStatusLabel(order.status)">
                    </span>
                    <!-- 剩余时间（活跃订单） -->
                    <span 
                      x-show="order.status === 'active'"
                      class="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400"
                      x-text="getRemainingTime(order.expires_at)">
                    </span>
                  </div>
                </div>

                <!-- 订单内容 -->
                <div class="p-4">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <!-- 左侧信息 -->
                    <div class="flex-1">
                      <!-- 服务名称 -->
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-lg font-semibold" style="color: var(--text-primary);" x-text="order.service_name"></span>
                        <span class="text-xs px-2 py-0.5 rounded" style="background-color: var(--bg-tertiary); color: var(--text-muted);" x-text="order.region"></span>
                      </div>

                      <!-- 号码信息 -->
                      <div x-show="order.phone_number" class="flex items-center gap-2 mb-2">
                        <svg class="w-4 h-4" style="color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <span class="font-mono text-sm" style="color: var(--text-primary);" x-text="order.phone_number"></span>
                        <button 
                          @click="copyToClipboard(order.phone_number)"
                          class="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                          title="复制号码">
                          <svg class="w-4 h-4" style="color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>

                      <!-- 验证码（已完成订单） -->
                      <div x-show="order.verification_code && order.status === 'completed'" class="flex items-center gap-2 p-2 rounded-lg" style="background-color: var(--bg-tertiary);">
                        <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        <span class="text-sm" style="color: var(--text-muted);" x-text="t('orders.verification_code') + ':'"></span>
                        <span class="font-mono font-bold text-green-500" x-text="order.verification_code"></span>
                        <button 
                          @click="copyToClipboard(order.verification_code)"
                          class="ml-2 p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                          title="复制验证码">
                          <svg class="w-4 h-4" style="color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>

                      <!-- 订单详情 -->
                      <div class="flex flex-wrap items-center gap-4 mt-3 text-xs" style="color: var(--text-muted);">
                        <span x-text="formatAmount(order.amount) + ' ' + t('orders.yuan')"></span>
                        <span x-text="formatDate(order.created_at)"></span>
                        <span x-show="order.duration" x-text="order.duration + ' ' + t('orders.minutes')"></span>
                      </div>
                    </div>

                    <!-- 右侧操作 -->
                    <div class="flex flex-col gap-2">
                      <!-- 活跃订单操作 -->
                      <template x-if="order.status === 'active'">
                        <div class="flex gap-2">
                          <a 
                            :href="'/' + lang + '/receive?token=' + order.sms_token"
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                            style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
                            <span x-text="t('orders.go_terminal')"></span>
                          </a>
                          <button 
                            @click="refreshOrder(order.id)"
                            :disabled="order.refreshing"
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
                            <svg x-show="!order.refreshing" class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            <span x-text="t('orders.refresh')"></span>
                          </button>
                        </div>
                      </template>

                      <!-- 已完成订单操作 -->
                      <template x-if="order.status === 'completed'">
                        <button 
                          @click="showOrderDetail(order)"
                          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                          style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
                          <span x-text="t('orders.view_detail')"></span>
                        </button>
                      </template>

                      <!-- 待支付订单操作 -->
                      <template x-if="order.status === 'pending'">
                        <div class="flex gap-2">
                          <a 
                            :href="'/' + lang + '/checkout?trade_id=' + order.trade_id"
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                            style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
                            <span x-text="t('orders.continue_payment')"></span>
                          </a>
                          <button 
                            @click="cancelOrder(order.id)"
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-red-500"
                            style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color);">
                            <span x-text="t('orders.cancel')"></span>
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 加载更多 -->
          <div x-show="hasMore" class="mt-6 text-center">
            <button 
              @click="loadMore()"
              :disabled="loading"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
              <span x-show="!loading" x-text="t('orders.load_more')"></span>
              <span x-show="loading" x-text="t('common.loading')"></span>
            </button>
          </div>

          <!-- 加载状态 -->
          <div x-show="loading" class="text-center py-8">
            <svg class="animate-spin w-8 h-8 mx-auto" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </main>
      </div>
    </div>
  </div>

  <script>
    function ordersApp() {
      return {
        orders: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          totalSpent: 0
        },
        filterStatus: '',
        loading: false,
        lang: '${lang}',
        
        init: function() {
          this.loadOrders();
          this.loadStats();
        },
        
        t: function(key) {
          return window.t ? window.t(key) : key;
        },
        
        get filteredOrders() {
          var self = this;
          if (!self.filterStatus) {
            return self.orders;
          }
          return self.orders.filter(function(order) {
            return order.status === self.filterStatus;
          });
        },
        
        loadOrders: async function() {
          var self = this;
          self.loading = true;
          
          try {
            var response = await fetch('/api/orders');
            var data = await response.json();
            
            if (data.success && data.data) {
              self.orders = data.data.orders || [];
            }
          } catch (error) {
            console.error('Failed to load orders:', error);
          } finally {
            self.loading = false;
          }
        },
        
        loadStats: async function() {
          var self = this;
          try {
            var response = await fetch('/api/orders/stats');
            var data = await response.json();
            
            if (data.success && data.data) {
              self.stats = data.data;
            }
          } catch (error) {
            console.error('Failed to load stats:', error);
          }
        },
        
        refreshOrder: async function(orderId) {
          var self = this;
          var order = self.orders.find(function(o) { return o.id === orderId; });
          if (order) {
            order.refreshing = true;
            // 刷新订单状态
            await self.loadOrders();
            order.refreshing = false;
          }
        },
        
        getStatusLabel: function(status) {
          var labels = {
            'pending': this.t('orders.status_pending'),
            'active': this.t('orders.status_active'),
            'completed': this.t('orders.status_completed'),
            'expired': this.t('orders.status_expired'),
            'cancelled': this.t('orders.status_cancelled')
          };
          return labels[status] || status;
        },
        
        getRemainingTime: function(expiresAt) {
          if (!expiresAt) return '';
          var now = new Date();
          var expires = new Date(expiresAt);
          var diff = expires - now;
          
          if (diff <= 0) return this.t('orders.expired');
          
          var minutes = Math.floor(diff / 60000);
          var seconds = Math.floor((diff % 60000) / 1000);
          
          return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        },
        
        formatAmount: function(milli) {
          if (milli === null || milli === undefined) return '0.00';
          return (milli / 1000).toFixed(2);
        },
        
        formatDate: function(dateString) {
          if (!dateString) return '';
          var date = new Date(dateString);
          return date.toLocaleString();
        },
        
        copyToClipboard: async function(text) {
          try {
            await navigator.clipboard.writeText(text);
            // 显示复制成功提示
            if (window.showToast) {
              window.showToast(this.t('common.copied'));
            }
          } catch (error) {
            console.error('Copy failed:', error);
          }
        }
      }
    }
  </script>`

  return Layout({
    title: 'Orders',
    children: raw(content),
    lang,
    csrfToken,
    headerType: 'dashboard',
    showSidebar: true,
    showFooter: false
  }).toString()
}