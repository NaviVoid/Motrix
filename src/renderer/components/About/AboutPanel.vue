<template>
  <el-dialog
    custom-class="app-about-dialog"
    width="61.8vw"
    :model-value="visible"
    @open="handleOpen"
    :before-close="handleClose"
    @closed="handleClosed">
    <mo-app-info :version="version" :engine="engineInfo" />
    <template #footer><mo-copyright /></template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, onBeforeMount } from 'vue'
  import { useAppStore } from '@/store/app'
  import MoAppInfo from '@/components/About/AppInfo.vue'
  import MoCopyright from '@/components/About/Copyright.vue'

  defineOptions({ name: 'mo-about-panel' })

  const props = withDefaults(defineProps<{
    visible?: boolean
  }>(), {
    visible: false
  })

  const appStore = useAppStore()

  const version = ref('')

  const engineInfo = computed(() => appStore.engineInfo)

  onBeforeMount(async () => {
    version.value = await window.electronAPI.getAppVersion()
  })

  function handleOpen () {
    appStore.fetchEngineInfo()
  }

  function handleClose (done: () => void) {
    appStore.hideAboutPanel()
  }

  function handleClosed () {
  }
</script>

<style lang="scss">
.app-about-dialog {
  max-width: 632px;
  min-width: 380px;
  .el-dialog__header {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
