import i18next, { Resource, i18n } from 'i18next'
import { getLanguage } from '@shared/locales'

interface LocaleManagerOptions {
  resources?: Resource
}

export default class LocaleManager {
  private options: LocaleManagerOptions

  constructor (options: LocaleManagerOptions = {}) {
    this.options = options

    i18next.init({
      fallbackLng: 'en-US',
      resources: options.resources
    })
  }

  changeLanguage (lng: string): Promise<ReturnType<typeof i18next.changeLanguage>> {
    return i18next.changeLanguage(lng)
  }

  changeLanguageByLocale (locale: string): Promise<ReturnType<typeof i18next.changeLanguage>> {
    const lng = getLanguage(locale)
    return this.changeLanguage(lng)
  }

  getI18n (): i18n {
    return i18next
  }
}
