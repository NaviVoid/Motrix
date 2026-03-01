import is from 'electron-is'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { ElLoading, ElMessage } from 'element-plus'
import axios from 'axios'

import App from './App.vue'
import router from '@/router'
import store from '@/store'
import i18n from '@/plugins/i18n'
import { usePreferenceStore } from '@/store/preference'
import { getLocaleManager } from '@/components/Locale'
import Icon from '@/components/Icons/Icon.vue'
import Msg from '@/components/Msg'
import { commands } from '@/components/CommandManager/instance'
import TrayWorker from '@/workers/tray.worker?worker'

import '@/components/Theme/Index.scss'

interface TrayPayload {
  tray?: Blob
  [key: string]: unknown
}

const updateTray = is.renderer()
  ? async (payload: TrayPayload) => {
    const { tray } = payload
    if (!tray) {
      return
    }

    const ab = await tray.arrayBuffer()
    window.electronAPI.sendCommand('application:update-tray', ab)
  }
  : () => {}

function initTrayWorker (): Worker {
  const worker = new TrayWorker()

  worker.addEventListener('message', (event: MessageEvent) => {
    const { type, payload } = event.data

    switch (type) {
    case 'initialized':
    case 'log':
      console.log('[Motrix] Log from Tray Worker: ', payload)
      break
    case 'tray:drawed':
      updateTray(payload)
      break
    default:
      console.warn('[Motrix] Tray Worker unhandled message type:', type, payload)
    }
  })

  return worker
}

// Create app and install Pinia before using stores
const app = createApp(App)
app.use(store)

const preferenceStore = usePreferenceStore()

interface PreferenceConfig {
  locale: string
  [key: string]: unknown
}

function init (config: PreferenceConfig): void {
  const { locale } = config
  const localeManager = getLocaleManager()
  localeManager.changeLanguageByLocale(locale)

  app.config.globalProperties.$http = axios

  app.use(i18n)
  app.use(router)
  app.use(ElementPlus, {
    size: 'small',
    i18n: (key: string, value: unknown) => i18n.global.t(key, value as Record<string, unknown>)
  })
  app.use(Msg, ElMessage, {
    showClose: true
  })
  app.component('mo-icon', Icon)

  const loading = ElLoading.service({
    fullscreen: true,
    background: 'rgba(0, 0, 0, 0.1)'
  })

  app.mount('#app')

  ;(globalThis as any).app = app
  ;(globalThis as any).app.commands = commands
  import('./commands')

  ;(globalThis as any).app.trayWorker = initTrayWorker()

  setTimeout(() => {
    loading.close()
  }, 400)
}

preferenceStore.fetchPreference()
  .then((config: PreferenceConfig) => {
    console.info('[Motrix] load preference:', config)
    init(config)
  })
  .catch((err: unknown) => {
    alert(err)
  })
