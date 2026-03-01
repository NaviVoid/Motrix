<template>
  <div style="display: none;">
    <img
      id="tray-icon-light-normal"
      src="/mo-tray-light-normal@2x.png"
    >
    <img
      id="tray-icon-light-active"
      src="/mo-tray-light-active@2x.png"
    >
    <img
      id="tray-icon-dark-normal"
      src="/mo-tray-dark-normal@2x.png"
    >
    <img
      id="tray-icon-dark-active"
      src="/mo-tray-dark-active@2x.png"
    >
  </div>
</template>

<script setup lang="ts">
  import { computed, watch, onMounted } from 'vue'
  import { useAppStore } from '@/store/app'

  import { getInverseTheme } from '@shared/utils'
  import { APP_THEME } from '@shared/constants'

  defineOptions({ name: 'mo-dynamic-tray' })

  const cache: Record<string, ImageBitmap> = {}

  const appStore = useAppStore()

  const iconStatus = computed(() => appStore.stat.numActive > 0 ? 'active' : 'normal')
  const theme = computed(() => appStore.systemTheme)
  const focused = computed(() => appStore.trayFocused)
  const uploadSpeed = computed(() => appStore.stat.uploadSpeed)
  const downloadSpeed = computed(() => appStore.stat.downloadSpeed)
  const speed = computed(() => appStore.stat.uploadSpeed + appStore.stat.downloadSpeed)

  const scale = computed(() => 2)

  const currentTheme = computed(() => {
    if (theme.value === APP_THEME.DARK) {
      return theme.value
    }
    return focused.value ? getInverseTheme(theme.value) : theme.value
  })

  const iconKey = computed(() => {
    const bigSur = (appStore as any).bigSur
    return bigSur ? 'tray-icon-light-normal' : `tray-icon-${currentTheme.value}-${iconStatus.value}`
  })

  watch(speed, async () => {
    await drawTray()
  })

  watch(iconKey, async () => {
    await drawTray()
  })

  onMounted(() => {
    setTimeout(async () => {
      await drawTray()
    }, 200)
  })

  async function getIcon (key: string): Promise<ImageBitmap> {
    if (cache[key]) {
      return cache[key]
    }

    const iconImage = document.getElementById(key) as HTMLImageElement
    const result = await createImageBitmap(iconImage)
    cache[key] = result

    return result
  }

  async function drawTray () {
    const icon = await getIcon(iconKey.value)

    ;(global as any).app.trayWorker.postMessage({
      type: 'tray:draw',
      payload: {
        theme: currentTheme.value,
        icon,
        uploadSpeed: uploadSpeed.value,
        downloadSpeed: downloadSpeed.value,
        scale: scale.value
      }
    })
  }
</script>
