<template>
  <el-container class="content panel" direction="vertical">
    <el-header class="panel-header" height="84">
      <h4 class="hidden-xs-only">{{ title }}</h4>
      <mo-subnav-switcher
        :title="title"
        :subnavs="subnavs"
        class="hidden-sm-and-up"
      />
    </el-header>
    <mo-browser
      v-if="isRenderer"
      class="lab-webview"
      :src="url"
    />
  </el-container>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import is from 'electron-is'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'

  import { APP_THEME } from '@shared/constants'
  import MoSubnavSwitcher from '@/components/Subnav/SubnavSwitcher.vue'
  import MoBrowser from '@/components/Browser/index.vue'
  import '@/components/Icons/info-square'

  defineOptions({ name: 'mo-preference-lab' })

  const { t } = useI18n()
  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()

  const locale = ref(preferenceStore.config.locale)

  const isRenderer = computed(() => is.renderer())
  const systemTheme = computed(() => appStore.systemTheme)
  const config = computed(() => preferenceStore.config)
  const theme = computed(() => preferenceStore.config.theme)

  const currentTheme = computed(() => {
    if (theme.value === APP_THEME.AUTO) {
      return systemTheme.value
    } else {
      return theme.value
    }
  })

  const url = computed(() => {
    const result = `https://motrix.app/lab?lite=true&theme=${currentTheme.value}&lang=${locale.value}`
    return result
  })

  const title = computed(() => {
    return t('preferences.lab')
  })

  const subnavs = computed(() => {
    return [
      {
        key: 'basic',
        title: t('preferences.basic'),
        route: '/preference/basic'
      },
      {
        key: 'advanced',
        title: t('preferences.advanced'),
        route: '/preference/advanced'
      },
      {
        key: 'lab',
        title: t('preferences.lab'),
        route: '/preference/lab'
      }
    ]
  })
</script>

<style lang="scss">
.lab-webview {
  display: inline-flex;;
  flex: 1;
  flex-basis: auto;
  overflow: auto;
  box-sizing: border-box;
  padding: 0;
}
</style>
