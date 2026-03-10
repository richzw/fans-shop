import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'

const savedLocale = localStorage.getItem('locale') || 'zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

export function setLocale(lang) {
  i18n.global.locale.value = lang
  localStorage.setItem('locale', lang)
}

export default i18n
