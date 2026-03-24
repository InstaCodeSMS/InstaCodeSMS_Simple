/**
 * Register 页面视图
 * 用户注册页面 - 支持多语言
 */

import Layout from '../components/Layout'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'
import { getAuthBackgroundStyle, authBackgroundClass } from '../components/AuthBackground'

export function RegisterPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <main x-data="registerApp('${lang}')" class="min-h-screen py-24 px-4 sm:px-6 relative overflow-x-hidden ${authBackgroundClass}">
    <div class="max-w-md mx-auto mt-8 px-4">
      <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border)]">
        <h1 class="text-2xl font-bold mb-6 text-center" x-text="t('auth.register')"></h1>
        
        <form @submit.prevent="submitRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.email')"></label>
            <input 
              type="email" 
              x-model="form.email"
              required
              class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500"
              :placeholder="t('auth.email_placeholder')"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.password')"></label>
            <input 
              type="password" 
              x-model="form.password"
              required
              minlength="6"
              class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500"
              :placeholder="t('auth.password_placeholder')"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.confirm_password')"></label>
            <input 
              type="password" 
              x-model="form.confirmPassword"
              required
              minlength="6"
              class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500"
              :placeholder="t('auth.confirm_password_placeholder')"
            />
          </div>
          
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <span x-show="!isLoading" x-text="t('auth.register')"></span>
            <span x-show="isLoading" x-text="t('common.loading')"></span>
          </button>
        </form>
        
        <div x-show="message" :class="isSuccess ? 'text-green-500' : 'text-red-500'" class="mt-4 text-center text-sm" x-text="message"></div>
        
        <div class="mt-4 text-center text-sm text-muted">
          <span x-text="t('auth.have_account')"></span>
          <a :href="'/' + lang + '/login'" class="text-blue-500 hover:underline" x-text="t('auth.login_now')"></a>
        </div>
      </div>
    </div>
  </main>

  <script>
    function registerApp(lang) {
      return {
        lang: lang,
        form: {
          email: '',
          password: '',
          confirmPassword: ''
        },
        isLoading: false,
        message: '',
        isSuccess: false,
        
        t(key) {
          return window.t ? window.t(key) : key;
        },
        
        async submitRegister() {
          if (this.form.password.length < 6) {
            this.message = this.t('auth.password_min_length');
            this.isSuccess = false;
            return;
          }

          if (this.form.password !== this.form.confirmPassword) {
            this.message = this.t('auth.password_mismatch');
            this.isSuccess = false;
            return;
          }

          this.isLoading = true;
          this.message = '';

          try {
            const response = await fetch('/api/better-auth/sign-up/email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: this.form.email,
                password: this.form.password,
                name: this.form.email.split('@')[0]
              }),
              credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
              // 手动设置 cookies（因为 wrangler dev 的 Set-Cookie header 格式问题）
              // 关键：必须添加 Path=/ 否则 cookie 只在当前路径有效，跳转后丢失
              if (data.cookies && Array.isArray(data.cookies)) {
                data.cookies.forEach(cookieStr => {
                  // 确保包含 Path=/ 属性
                  const cookieWithPath = cookieStr.includes('Path=') 
                    ? cookieStr 
                    : cookieStr + '; Path=/';
                  document.cookie = cookieWithPath;
                });
              }
              
              this.isSuccess = true;
              this.message = this.t('auth.register_success');
              setTimeout(() => {
                window.location.href = '/' + this.lang + '/dashboard';
              }, 500);
            } else {
              this.isSuccess = false;
              this.message = data.error?.message || this.t('auth.register_failed');
            }
          } catch (error) {
            this.isSuccess = false;
            this.message = this.t('common.error');
          } finally {
            this.isLoading = false;
          }
        }
      }
    }
  </script>`

  return Layout({
    title: 'Register',
    children: raw(content),
    lang,
    csrfToken,
    extraStyles: getAuthBackgroundStyle()
  }).toString()
}
