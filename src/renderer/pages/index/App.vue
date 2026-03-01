<template>
  <div id="app">
    <mo-title-bar
      v-if="isRenderer"
      :showActions="showWindowActions"
    />
    <router-view />
    <mo-engine-client
      :secret="rpcSecret"
    />
    <mo-ipc v-if="isRenderer" />
    <mo-dynamic-tray v-if="enableTraySpeedometer" />
  </div>
</template>

<script setup lang="ts">
  import { computed, watch, onBeforeMount } from 'vue'
  import { storeToRefs } from 'pinia'
  import is from 'electron-is'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { APP_RUN_MODE, APP_THEME } from '@shared/constants'
  import MoDynamicTray from '@/components/Native/DynamicTray.vue'
  import MoEngineClient from '@/components/Native/EngineClient.vue'
  import MoIpc from '@/components/Native/Ipc.vue'
  import MoTitleBar from '@/components/Native/TitleBar.vue'
  import { getLanguage } from '@shared/locales'
  import { getLocaleManager } from '@/components/Locale'

  defineOptions({ name: 'motrix-app' })

  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()

  const isMac = computed(() => is.macOS())
  const isRenderer = computed(() => is.renderer())

  const systemTheme = computed(() => appStore.systemTheme)

  const showWindowActions = computed(() => {
    return (is.windows() || is.linux()) && preferenceStore.config.hideAppMenu
  })
  const runMode = computed(() => preferenceStore.config.runMode)
  const traySpeedometer = computed(() => preferenceStore.config.traySpeedometer)
  const rpcSecret = computed(() => preferenceStore.config.rpcSecret)

  const { theme, locale, direction } = storeToRefs(preferenceStore)

  const themeClass = computed(() => {
    if (theme.value === APP_THEME.AUTO) {
      return `theme-${systemTheme.value}`
    } else {
      return `theme-${theme.value}`
    }
  })

  const i18nClass = computed(() => {
    return `i18n-${locale.value}`
  })

  const directionClass = computed(() => {
    return `dir-${direction.value}`
  })

  const enableTraySpeedometer = computed(() => {
    return isMac.value && isRenderer.value && traySpeedometer.value && runMode.value !== APP_RUN_MODE.HIDE_TRAY
  })

  function updateRootClassName () {
    const tc = themeClass.value || ''
    const ic = i18nClass.value || ''
    const dc = directionClass.value || ''
    const className = `${tc} ${ic} ${dc}`
    document.documentElement.className = className
  }

  watch(locale, (val) => {
    const lng = getLanguage(val)
    getLocaleManager().changeLanguage(lng)
  })

  watch(themeClass, () => {
    updateRootClassName()
  })

  watch(i18nClass, () => {
    updateRootClassName()
  })

  watch(directionClass, () => {
    updateRootClassName()
  })

  onBeforeMount(() => {
    updateRootClassName()
  })
</script>

<style>
</style>
