/**
 * i18n 主模块
 *
 * Why: 提供统一的翻译函数和语言包访问接口
 * 支持服务端渲染和客户端 Alpine.js 双端使用
 */

import { zh } from './zh'
import { en } from './en'
import type { Language, Translations } from './types'

// 语言包映射
const translations: Record<Language, Translations> = { zh, en }

// 默认语言
export const DEFAULT_LANGUAGE: Language = 'en'

// 支持的语言列表
export const SUPPORTED_LANGUAGES: Language[] = ['zh', 'en']

/**
 * 获取指定语言的翻译包
 */
export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations[DEFAULT_LANGUAGE]
}

/**
 * 根据点分隔的 key 获取翻译文本
 */
export function t(lang: Language, key: string): string {
  const keys = key.split('.')
  let value: unknown = getTranslations(lang)

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return key
    }
  }

  return typeof value === 'string' ? value : key
}

/**
 * 获取 HTML lang 属性值
 */
export function getHtmlLang(lang: Language): string {
  return lang === 'zh' ? 'zh-CN' : 'en'
}

/**
 * 生成客户端 i18n 脚本
 * 注入到页面中，提供全局 t() 函数供 Alpine.js 使用
 * 同时注入中英文语言包，支持动态切换
 * 
 * @param lang - 当前语言
 * @returns 可直接嵌入 HTML 的 script 内容
 */
export function getI18nScript(lang: Language): string {
  const zhJson = JSON.stringify(zh)
  const enJson = JSON.stringify(en)
  const currentJson = lang === 'en' ? enJson : zhJson
  
  return `
    // 全局 i18n 配置 - 同时加载中英文语言包
    window.__I18N_ZH__ = ${zhJson};
    window.__I18N_EN__ = ${enJson};
    window.__LANG__ = '${lang}';
    window.__I18N__ = window.__LANG__ === 'en' ? window.__I18N_EN__ : window.__I18N_ZH__;
    
    // 全局翻译函数
    window.t = function(key) {
      const keys = key.split('.');
      let value = window.__I18N__;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key;
        }
      }
      return typeof value === 'string' ? value : key;
    };
    
    // 获取当前语言
    window.getLang = function() {
      return window.__LANG__;
    };
    
    // 设置语言（供语言切换使用）
    window.setLang = function(newLang) {
      if (['zh', 'en'].includes(newLang)) {
        window.__LANG__ = newLang;
        window.__I18N__ = newLang === 'en' ? window.__I18N_EN__ : window.__I18N_ZH__;
        localStorage.setItem('lang', newLang);
        // 触发语言变更事件
        window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: newLang } }));
      }
    };
  `
}

// 导出所有模块
export { zh, en }
export type { Language, Translations, TranslationMessages } from './types'