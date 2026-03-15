/**
 * Telegram Web App SDK 集成
 */

class TelegramIntegration {
  constructor() {
    this.webApp = null
    this.user = null
    this.init()
  }
  
  init() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.webApp.ready()
      this.webApp.expand()
      
      this.user = this.webApp.initDataUnsafe?.user
      this.syncTheme()
      this.setupBackButton()
      this.setupMainButton()
      
      console.log('[Telegram] Initialized', {
        user: this.user,
        theme: this.webApp.colorScheme
      })
    } else {
      console.warn('[Telegram] Web App SDK not available')
    }
  }
  
  syncTheme() {
    if (!this.webApp) return
    
    const theme = this.webApp.colorScheme
    const html = document.documentElement
    
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark')
      html.classList.add('dark')
    } else {
      html.setAttribute('data-theme', 'light')
      html.classList.remove('dark')
    }
    
    // 监听主题变化
    this.webApp.onEvent('themeChanged', () => {
      this.syncTheme()
    })
  }
  
  setupBackButton() {
    if (!this.webApp?.BackButton) return
    
    this.webApp.BackButton.onClick(() => {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        this.close()
      }
    })
  }
  
  setupMainButton() {
    if (!this.webApp?.MainButton) return
    
    this.webApp.MainButton.setText('返回 Bot')
    this.webApp.MainButton.onClick(() => {
      this.goToBot()
    })
  }
  
  showBackButton() {
    if (this.webApp?.BackButton) {
      this.webApp.BackButton.show()
    }
  }
  
  hideBackButton() {
    if (this.webApp?.BackButton) {
      this.webApp.BackButton.hide()
    }
  }
  
  showMainButton(text = '返回 Bot') {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.setText(text)
      this.webApp.MainButton.show()
    }
  }
  
  hideMainButton() {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.hide()
    }
  }
  
  goToBot() {
    if (this.webApp) {
      const botUsername = this.webApp.initDataUnsafe?.bot_username
      if (botUsername) {
        this.webApp.openTelegramLink(`https://t.me/${botUsername}`)
      } else {
        this.close()
      }
    }
  }
  
  openBotCommand(command) {
    if (this.webApp) {
      const botUsername = this.webApp.initDataUnsafe?.bot_username
      if (botUsername) {
        this.webApp.openTelegramLink(`https://t.me/${botUsername}?start=${command}`)
      }
    }
  }
  
  close() {
    if (this.webApp) {
      this.webApp.close()
    }
  }
  
  showAlert(message) {
    if (this.webApp) {
      this.webApp.showAlert(message)
    } else {
      alert(message)
    }
  }
  
  showConfirm(message, callback) {
    if (this.webApp) {
      this.webApp.showConfirm(message, callback)
    } else {
      const result = confirm(message)
      callback(result)
    }
  }
  
  showPopup(params) {
    if (this.webApp) {
      this.webApp.showPopup(params)
    }
  }
  
  hapticFeedback(type = 'impact', style = 'medium') {
    if (this.webApp?.HapticFeedback) {
      if (type === 'impact') {
        this.webApp.HapticFeedback.impactOccurred(style)
      } else if (type === 'notification') {
        this.webApp.HapticFeedback.notificationOccurred(style)
      } else if (type === 'selection') {
        this.webApp.HapticFeedback.selectionChanged()
      }
    }
  }
  
  getUserId() {
    return this.user?.id || null
  }
  
  getInitData() {
    return this.webApp?.initData || ''
  }
}

// 全局实例
window.telegram = new TelegramIntegration()