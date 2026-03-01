import { createI18n, type I18n } from 'vue-i18n'
import resources from '@shared/locales/all'

interface LocaleResource {
  translation?: Record<string, any>
  [key: string]: any
}

// Transform i18next format { locale: { translation: { ...keys } } }
// to vue-i18n format { locale: { ...keys } }
const messages: Record<string, Record<string, any>> = {}
for (const [locale, resource] of Object.entries(resources as Record<string, LocaleResource>)) {
  messages[locale] = resource.translation || resource
}

const i18n: I18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages
})

export default i18n
