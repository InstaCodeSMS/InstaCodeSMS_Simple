/**
 * Register 页面视图
 * 用户注册页面 - 支持多语言
 * 
 * 改进：
 * - 隐藏完整 Header/Footer，简化页面
 * - 在表单内添加 Logo + 返回首页
 * - 添加密码可见切换
 */

import Layout from '../components/Layout'
import { raw } from 'hono/html'
import type { Language } from '../../i18n'
import { getAuthBackgroundStyle, authBackgroundClass } from '../components/AuthBackground'

export function RegisterPage(csrfToken: string = '', lang: Language = 'zh'): string {
  const content = `
  <main x-data="registerApp('${lang}')" class="min-h-screen py-12 px-4 sm:px-6 relative overflow-x-hidden ${authBackgroundClass}">
    <div class="max-w-md mx-auto mt-8 px-4">
      <div class="bg-[var(--bg-primary)] rounded-xl p-6 sm:p-8 border border-[var(--border)] shadow-xl">
        
        <!-- Logo + 返回首页 -->
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <a href="/" class="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
            <i class="fas fa-bolt text-blue-500"></i>
            <span>SIMPLE<span class="text-blue-500">FAKA</span></span>
          </a>
          <a href="/" class="text-sm text-[var(--text-secondary)] hover:text-blue-500 transition-colors" x-text="t('auth.back_home')"></a>
        </div>
        
        <!-- 标题 -->
        <h1 class="text-2xl font-bold mb-6 text-center" x-text="t('auth.register')"></h1>
        
        <form @submit.prevent="submitRegister" class="space-y-4">
          <!-- 邮箱 -->
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.email')"></label>
            <input 
              type="email" 
              x-model="form.email"
              required
              class="w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              :placeholder="t('auth.email_placeholder')"
            />
          </div>
          
          <!-- 密码 -->
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.password')"></label>
            <div class="relative">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                x-model="form.password"
                required
                minlength="6"
                class="w-full px-3 py-2.5 pr-10 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                :placeholder="t('auth.password_placeholder')"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </button>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-1" x-text="t('auth.password_min_length')"></p>
          </div>
          
          <!-- 确认密码 -->
          <div>
            <label class="block text-sm font-medium mb-2" x-text="t('auth.confirm_password')"></label>
            <div class="relative">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                x-model="form.confirmPassword"
                required
                minlength="6"
                class="w-full px-3 py-2.5 pr-10 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                :placeholder="t('auth.confirm_password_placeholder')"
              />
              <button 
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <i :class="showConfirmPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </button>
            </div>
          </div>
          
          <!-- 注册按钮 -->
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <span x-show="!isLoading" x-text="t('auth.register')"></span>
            <span x-show="isLoading" class="flex items-center justify-center gap-2">
              <i class="fa fa-spinner fa-spin"></i>
              <span x-text="t('common.loading')"></span>
            </span>
          </button>
        </form>
        
        <!-- 错误/成功消息 -->
        <div x-show="message" :class="isSuccess ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'" class="mt-4 text-center text-sm py-2 px-3 rounded-lg" x-text="message"></div>
        
        <!-- 登录链接 -->
        <div class="mt-6 text-center text-sm text-[var(--text-secondary)]">
          <span x-text="t('auth.have_account')"></span>
          <a :href="'/' + lang + '/login'" class="text-blue-500 hover:underline ml-1" x-text="t('auth.login_now')"></a>
        </div>
        
        <!-- 条款提示 -->
        <div class="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
          <span x-text="t('auth.terms_hint')"></span>
          <a :href="'/' + lang + '/terms'" class="text-blue-500 hover:underline" x-text="t('auth.terms_link')"></a>
          <span x-text="t('auth.and')"></span>
          <a :href="'/' + lang + '/privacy'" class="text-blue-500 hover:underline" x-text="t('auth.privacy_link')"></a>
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
        showPassword: false,
        showConfirmPassword: false,
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
    showHeader: false,
    showFooter: false,
    extraStyles: getAuthBackgroundStyle()
  }).toString()
}
