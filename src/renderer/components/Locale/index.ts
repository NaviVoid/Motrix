import i18n from '@/plugins/i18n'
import { getLanguage } from '@shared/locales'

interface LocaleManager {
  changeLanguage (lng: string): void
  changeLanguageByLocale (locale: string): void
  getI18n (): typeof i18n.global
}

const localeManager: LocaleManager = {
  changeLanguage (lng: string): void {
    ;(i18n.global.locale as unknown as { value: string }).value = lng
  },

  changeLanguageByLocale (locale: string): void {
    const lng = getLanguage(locale)
    this.changeLanguage(lng)
  },

  getI18n (): typeof i18n.global {
    return i18n.global
  }
}

export function getLocaleManager (): LocaleManager {
  return localeManager
}
