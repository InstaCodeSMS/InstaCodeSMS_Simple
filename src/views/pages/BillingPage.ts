/**
 * Billing 页面视图
 * 账单中心页面 - 支持多语言
 */

import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'

export function BillingPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <div class="min-h-screen">
    ${Sidebar()}
    <div class="transition-all duration-300 md:ml-64">
      <div class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
        <main x-data="billingApp()" x-init="init()" class="max-w-4xl mx-auto">
          <!-- 页面标题 -->
          <div class="mb-8">
            <h1 class="text-2xl font-bold" style="color: var(--text-primary);" x-text="t('billing.title')"></h1>
            <p class="mt-2 text-sm" style="color: var(--text-muted);" x-text="t('billing.subtitle')"></p>
          </div>

          <!-- 余额卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- 账户余额 -->
            <div class="rounded-xl p-6" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm" style="color: var(--text-muted);" x-text="t('billing.balance')"></p>
                  <p class="text-3xl font-bold mt-2" style="color: var(--text-primary);">
                    <span x-text="formatBalance(wallet.balance)"></span>
                    <span class="text-sm font-normal" x-text="t('billing.yuan')"></span>
                  </p>
                </div>
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 冻结金额 -->
            <div class="rounded-xl p-6" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm" style="color: var(--text-muted);" x-text="t('billing.frozen_balance')"></p>
                  <p class="text-3xl font-bold mt-2" style="color: var(--text-primary);">
                    <span x-text="formatBalance(wallet.frozenBalance)"></span>
                    <span class="text-sm font-normal" x-text="t('billing.yuan')"></span>
                  </p>
                </div>
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 充值按钮 -->
          <div class="mb-8">
            <button 
              @click="showRechargeModal = true"
              class="px-6 py-3 rounded-lg font-medium transition-all duration-300"
              style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span x-text="t('billing.recharge')"></span>
              </span>
            </button>
          </div>

          <!-- 交易记录 -->
          <div class="rounded-xl p-6" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold" style="color: var(--text-primary);" x-text="t('billing.transactions')"></h2>
              <select 
                x-model="filterType"
                @change="loadTransactions()"
                class="px-3 py-1.5 rounded-lg text-sm"
                style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
                <option value="" x-text="t('billing.filter_all')"></option>
                <option value="recharge" x-text="t('billing.filter_recharge')"></option>
                <option value="consume" x-text="t('billing.filter_consume')"></option>
                <option value="refund" x-text="t('billing.filter_refund')"></option>
              </select>
            </div>

            <!-- 交易列表 -->
            <div class="space-y-3">
              <template x-if="transactions.length === 0">
                <div class="text-center py-8">
                  <svg class="w-12 h-12 mx-auto mb-4" style="color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p style="color: var(--text-muted);" x-text="t('billing.no_transactions')"></p>
                </div>
              </template>

              <template x-for="tx in transactions" :key="tx.id">
                <div class="flex items-center justify-between py-3" style="border-bottom: 0.667px solid var(--border-color);">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span 
                        class="px-2 py-0.5 rounded text-xs"
                        :class="{
                          'bg-green-500\\/20 text-green-500': tx.type === 'recharge',
                          'bg-red-500\\/20 text-red-500': tx.type === 'consume',
                          'bg-blue-500\\/20 text-blue-500': tx.type === 'refund'
                        }"
                        x-text="getTransactionTypeLabel(tx.type)"></span>
                      <span class="text-sm" style="color: var(--text-muted);" x-text="tx.description || '-'"></span>
                    </div>
                    <p class="text-xs mt-1" style="color: var(--text-muted);" x-text="formatDate(tx.created_at)"></p>
                  </div>
                  <div class="text-right">
                    <p 
                      class="font-medium"
                      :class="{
                        'text-green-500': tx.amount > 0,
                        'text-red-500': tx.amount < 0
                      }">
                      <span x-text="tx.amount > 0 ? '+' : ''"></span>
                      <span x-text="formatBalance(tx.amount)"></span>
                    </p>
                    <p class="text-xs" style="color: var(--text-muted);">
                      <span x-text="t('billing.transaction_balance')"></span>: 
                      <span x-text="formatBalance(tx.balance_after)"></span>
                    </p>
                  </div>
                </div>
              </template>
            </div>

            <!-- 加载更多 -->
            <div x-show="hasMore" class="mt-4 text-center">
              <button 
                @click="loadMore()"
                :disabled="loading"
                class="px-4 py-2 rounded-lg text-sm transition-all duration-300"
                style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
                <span x-show="!loading" x-text="t('billing.load_more')"></span>
                <span x-show="loading" x-text="t('common.loading')"></span>
              </button>
            </div>

            <!-- 导出按钮 -->
            <div class="mt-4 pt-4 border-t flex justify-end gap-2" style="border-color: var(--border-color);">
              <button 
                @click="exportTransactions('csv')"
                class="px-4 py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-2"
                style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>CSV</span>
              </button>
            </div>
          </div>

          <!-- 充值弹窗 -->
          <div 
            x-show="showRechargeModal"
            x-transition:enter="transition ease-out duration-300"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition ease-in duration-200"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background-color: rgba(0, 0, 0, 0.5);"
            @click.self="showRechargeModal = false">
            
            <div 
              class="w-full max-w-md rounded-xl p-6"
              style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);"
              @click.stop>
              <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);" x-text="t('billing.recharge_title')"></h3>
              
              <div class="space-y-4">
                <!-- 充值金额 -->
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);" x-text="t('billing.recharge_amount')"></label>
                  <input 
                    type="number" 
                    x-model="rechargeAmount"
                    min="10"
                    max="10000"
                    step="0.01"
                    class="w-full px-4 py-2 rounded-lg transition-all duration-300"
                    style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
                    :placeholder="t('billing.recharge_amount')">
                  <p class="mt-1 text-xs" style="color: var(--text-muted);" x-text="t('billing.recharge_min')"></p>
                </div>

                <!-- 支付方式 -->
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);" x-text="t('billing.recharge_method')"></label>
                  <div class="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      @click="rechargeMethod = 'alipay'"
                      :class="rechargeMethod === 'alipay' ? 'ring-2 ring-blue-500' : ''"
                      class="px-4 py-3 rounded-lg transition-all duration-300 text-center"
                      style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color);">
                      <span style="color: var(--text-primary);">Alipay</span>
                    </button>
                    <button 
                      type="button"
                      @click="rechargeMethod = 'usdt'"
                      :class="rechargeMethod === 'usdt' ? 'ring-2 ring-blue-500' : ''"
                      class="px-4 py-3 rounded-lg transition-all duration-300 text-center"
                      style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color);">
                      <span style="color: var(--text-primary);">USDT</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 mt-6">
                <button 
                  type="button"
                  @click="showRechargeModal = false"
                  class="flex-1 px-4 py-2 rounded-lg transition-all duration-300"
                  style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
                  x-text="t('common.cancel')"></button>
                <button 
                  type="button"
                  @click="submitRecharge()"
                  :disabled="rechargeSubmitting || !rechargeAmount || rechargeAmount < 10"
                  class="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
                  <span x-show="!rechargeSubmitting" x-text="t('common.confirm')"></span>
                  <span x-show="rechargeSubmitting" x-text="t('common.loading')"></span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>

  <script>
function billingApp() {
  return {
    wallet: { balance: 0, frozenBalance: 0 },
    transactions: [],
    filterType: '',
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: false,
    showRechargeModal: false,
    rechargeAmount: 100,
    rechargeMethod: 'alipay',
    rechargeSubmitting: false,
    lang: '${lang}',
    
    init: function() {
      this.loadWallet();
      this.loadTransactions();
    },
    
    t: function(key) {
      return window.t ? window.t(key) : key;
    },
    
    loadWallet: async function() {
      var self = this;
      try {
        var response = await fetch('/api/wallet');
        var data = await response.json();
        if (data.success && data.data) {
          self.wallet = {
            balance: data.data.balance || 0,
            frozenBalance: data.data.frozenBalance || 0
          };
        }
      } catch (error) {
        console.error('Failed to load wallet:', error);
      }
    },
    
    loadTransactions: async function() {
      var self = this;
      self.loading = true;
      self.page = 1;
      self.transactions = [];
      
      try {
        var url = '/api/wallet/transactions?page=' + self.page + '&pageSize=' + self.pageSize;
        if (self.filterType) {
          url += '&type=' + self.filterType;
        }
        
        var response = await fetch(url);
        var data = await response.json();
        
        if (data.success && data.data) {
          self.transactions = data.data.transactions || [];
          self.hasMore = self.transactions.length === self.pageSize;
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        self.loading = false;
      }
    },
    
    loadMore: async function() {
      var self = this;
      if (self.loading || !self.hasMore) return;
      
      self.loading = true;
      self.page++;
      
      try {
        var url = '/api/wallet/transactions?page=' + self.page + '&pageSize=' + self.pageSize;
        if (self.filterType) {
          url += '&type=' + self.filterType;
        }
        
        var response = await fetch(url);
        var data = await response.json();
        
        if (data.success && data.data) {
          self.transactions = self.transactions.concat(data.data.transactions || []);
          self.hasMore = (data.data.transactions || []).length === self.pageSize;
        }
      } catch (error) {
        console.error('Failed to load more:', error);
      } finally {
        self.loading = false;
      }
    },
    
    submitRecharge: async function() {
      var self = this;
      if (!self.rechargeAmount || self.rechargeAmount < 10) {
        alert(self.t('billing.recharge_min'));
        return;
      }
      
      self.rechargeSubmitting = true;
      
      try {
        var response = await fetch('/api/wallet/recharge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(self.rechargeAmount),
            paymentMethod: self.rechargeMethod
          })
        });
        
        var data = await response.json();
        
        if (data.success && data.data) {
          window.location.href = data.data.checkoutUrl;
        } else {
          alert(data.message || self.t('billing.recharge_failed'));
        }
      } catch (error) {
        console.error('Recharge error:', error);
        alert(self.t('billing.recharge_failed'));
      } finally {
        self.rechargeSubmitting = false;
      }
    },
    
    formatBalance: function(milli) {
      if (milli === null || milli === undefined) return '0.000';
      return (milli / 1000).toFixed(3);
    },
    
    getTransactionTypeLabel: function(type) {
      var labels = {
        'recharge': this.t('billing.type_recharge'),
        'consume': this.t('billing.type_consume'),
        'refund': this.t('billing.type_refund'),
        'freeze': this.t('billing.type_freeze'),
        'unfreeze': this.t('billing.type_unfreeze')
      };
      return labels[type] || type;
    },
    
    formatDate: function(dateString) {
      if (!dateString) return '';
      var date = new Date(dateString);
      return date.toLocaleString();
    },
    
    exportTransactions: function(format) {
      var self = this;
      if (self.transactions.length === 0) {
        alert(self.lang === 'zh' ? 'No data to export' : 'No transactions to export');
        return;
      }
      
      var headers = [
        self.lang === 'zh' ? 'Time' : 'Time',
        self.lang === 'zh' ? 'Type' : 'Type',
        self.lang === 'zh' ? 'Amount' : 'Amount',
        self.lang === 'zh' ? 'Balance' : 'Balance',
        self.lang === 'zh' ? 'Description' : 'Description'
      ];
      
      var rows = self.transactions.map(function(tx) {
        return [
          self.formatDate(tx.created_at),
          self.getTransactionTypeLabel(tx.type),
          (tx.amount / 1000).toFixed(3),
          (tx.balance_after / 1000).toFixed(3),
          tx.description || ''
        ].join(',');
      });
      
      var csvContent = headers.join(',') + '\\n' + rows.join('\\n');
      var BOM = '\\uFEFF';
      var blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      var link = document.createElement('a');
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'transactions_' + new Date().toISOString().slice(0, 10) + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
}
  </script>`

  return Layout({
    title: 'Billing',
    children: raw(content),
    lang,
    csrfToken,
    headerType: 'dashboard',
    showSidebar: true,
    showFooter: false
  }).toString()
}