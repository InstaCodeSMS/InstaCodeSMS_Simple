/**
 * Profile 页面视图
 * 用户个人资料设置页面 - 支持多语言
 */

import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'

export function ProfilePage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <div class="min-h-screen">
    ${Sidebar()}
    <div class="transition-all duration-300 md:ml-64">
      <div class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden">
        <main x-data="profileApp()" x-init="init()" class="max-w-2xl mx-auto">
          <!-- 页面标题 -->
          <div class="mb-8">
            <h1 class="text-2xl font-bold" style="color: var(--text-primary);" x-text="t('profile.title')"></h1>
            <p class="mt-2 text-sm" style="color: var(--text-muted);" x-text="t('profile.subtitle')"></p>
          </div>

          <!-- 用户名设置卡片 -->
          <div class="rounded-xl p-6 mb-6" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
            <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);" x-text="t('profile.username_section')"></h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);" x-text="t('profile.username_label')"></label>
                <div class="flex gap-3">
                  <div class="flex-1 relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input 
                      type="text" 
                      x-model="form.username"
                      @input="checkUsernameTimeout()"
                      maxlength="50"
                      class="w-full pl-8 pr-3 py-2 rounded-lg transition-all duration-300"
                      style="background-color: var(--bg-tertiary); border: 0.667px solid var(--border-color); color: var(--text-primary);"
                      :class="{ 'border-green-500': usernameAvailable === true, 'border-red-500': usernameAvailable === false }"
                      :placeholder="t('profile.username_placeholder')"
                    />
                    <!-- 检查状态图标 -->
                    <div class="absolute right-3 top-1/2 -translate-y-1/2">
                      <template x-if="checkingUsername">
                        <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </template>
                      <template x-if="usernameAvailable === true && form.username">
                        <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </template>
                      <template x-if="usernameAvailable === false">
                        <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </template>
                    </div>
                  </div>
                </div>
                <!-- 提示信息 -->
                <p class="mt-2 text-xs" style="color: var(--text-muted);" x-text="t('profile.username_hint')"></p>
                <!-- 可用性提示 -->
                <p x-show="usernameAvailable === true && form.username" class="mt-2 text-xs text-green-500" x-text="t('profile.username_available')"></p>
                <p x-show="usernameAvailable === false" class="mt-2 text-xs text-red-500" x-text="t('profile.username_taken')"></p>
              </div>

              <div class="flex justify-end">
                <button 
                  @click="saveUsername()"
                  :disabled="saving || usernameAvailable === false"
                  class="px-6 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;">
                  <span x-show="!saving" x-text="t('common.save')"></span>
                  <span x-show="saving" x-text="t('common.saving')"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- 账户信息卡片 -->
          <div class="rounded-xl p-6" style="background-color: var(--bg-secondary); border: 0.667px solid var(--border-color);">
            <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);" x-text="t('profile.account_section')"></h2>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center py-3" style="border-bottom: 0.667px solid var(--border-color);">
                <span style="color: var(--text-secondary);" x-text="t('profile.email_label')"></span>
                <span style="color: var(--text-primary);" x-text="profile.email"></span>
              </div>
              <div class="flex justify-between items-center py-3" style="border-bottom: 0.667px solid var(--border-color);">
                <span style="color: var(--text-secondary);" x-text="t('profile.role_label')"></span>
                <span class="px-2 py-1 rounded-full text-xs" 
                      style="background-color: var(--bg-tertiary); color: var(--text-primary);"
                      x-text="profile.role"></span>
              </div>
              <div class="flex justify-between items-center py-3">
                <span style="color: var(--text-secondary);" x-text="t('profile.created_at_label')"></span>
                <span style="color: var(--text-primary);" x-text="formatDate(profile.created_at)"></span>
              </div>
            </div>
          </div>

          <!-- 成功/错误消息 -->
          <div x-show="message" 
               :class="isSuccess ? 'bg-green-500/20 border-green-500/50 text-green-500' : 'bg-red-500/20 border-red-500/50 text-red-500'"
               class="mt-4 p-4 rounded-lg border transition-all duration-300"
               x-text="message">
          </div>
        </main>
      </div>
    </div>
  </div>

  <script>
    function profileApp() {
      return {
        profile: {
          email: '',
          role: '',
          created_at: '',
          username: null
        },
        form: {
          username: ''
        },
        checkingUsername: false,
        usernameAvailable: null,
        saving: false,
        message: '',
        isSuccess: false,
        checkTimeout: null,
        originalUsername: '',
        
        init() {
          this.loadProfile();
        },
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        async loadProfile() {
          try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            if (data.success && data.data) {
              this.profile = {
                email: data.data.email,
                role: data.data.role || 'User',
                created_at: data.data.created_at,
                username: data.data.username
              };
              this.form.username = data.data.username || '';
              this.originalUsername = data.data.username || '';
            }
          } catch (error) {
            console.error('Failed to load profile:', error);
          }
        },
        
        checkUsernameTimeout() {
          if (this.checkTimeout) {
            clearTimeout(this.checkTimeout);
          }
          
          if (!this.form.username || this.form.username.length < 3) {
            this.usernameAvailable = null;
            return;
          }
          
          if (this.form.username === this.originalUsername) {
            this.usernameAvailable = true;
            return;
          }
          
          var usernameRegex = /^[a-zA-Z0-9_]+$/;
          if (!usernameRegex.test(this.form.username)) {
            this.usernameAvailable = false;
            return;
          }
          
          var self = this;
          this.checkingUsername = true;
          this.checkTimeout = setTimeout(async function() {
            try {
              var url = '/api/user/check-username?username=' + encodeURIComponent(self.form.username);
              var response = await fetch(url);
              var data = await response.json();
              self.usernameAvailable = data.available;
            } catch (error) {
              console.error('Failed to check username:', error);
              self.usernameAvailable = null;
            } finally {
              self.checkingUsername = false;
            }
          }, 500);
        },
        
        async saveUsername() {
          if (!this.form.username || this.form.username.length < 3) {
            this.message = this.t('profile.username_too_short');
            this.isSuccess = false;
            return;
          }
          
          if (this.usernameAvailable === false) {
            this.message = this.t('profile.username_taken');
            this.isSuccess = false;
            return;
          }
          
          this.saving = true;
          this.message = '';
          
          try {
            var response = await fetch('/api/user/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: this.form.username
              })
            });
            
            var data = await response.json();
            
            if (data.success) {
              this.isSuccess = true;
              this.message = this.t('profile.save_success');
              this.originalUsername = this.form.username;
              this.profile.username = this.form.username;
            } else {
              this.isSuccess = false;
              this.message = data.message || this.t('profile.save_failed');
            }
          } catch (error) {
            this.isSuccess = false;
            this.message = this.t('common.error');
          } finally {
            this.saving = false;
          }
        },
        
        formatDate(dateString) {
          if (!dateString) return '';
          var date = new Date(dateString);
          return date.toLocaleString();
        }
      }
    }
  </script>`

  return Layout({
    title: 'Profile',
    children: raw(content),
    lang,
    csrfToken,
    headerType: 'dashboard',
    showSidebar: true,
    showFooter: false
  }).toString()
}