import type { i18n, TFunction } from 'i18next'
import resources from '@shared/locales/app'
import LocaleManager from '@shared/locales/LocaleManager'

const localeManager: LocaleManager = new LocaleManager({
  resources
})

export const getLocaleManager = (): LocaleManager => {
  return localeManager
}

export const setupLocaleManager = (locale: string): LocaleManager => {
  localeManager.changeLanguageByLocale(locale)

  return localeManager
}

export const getI18n = (): i18n => {
  return localeManager.getI18n()
}

export const getI18nTranslator = (): TFunction => {
  return localeManager.getI18n().t
}
