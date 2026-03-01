<template>
  <div ref="webviewViewport" class="webview-viewport">
    <iframe
      class="mo-webview"
      ref="iframe"
      :src="src"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import is from 'electron-is'
  import { ElLoading } from 'element-plus'

  defineOptions({ name: 'mo-browser' })

  withDefaults(defineProps<{
    src?: string
  }>(), {
    src: ''
  })

  const webviewViewport = ref<HTMLDivElement | null>(null)
  const iframe = ref<HTMLIFrameElement | null>(null)
  const loading = ref<ReturnType<typeof ElLoading.service> | null>(null)

  const isRenderer = computed(() => is.renderer())

  onMounted(() => {
    if (iframe.value) {
      iframe.value.addEventListener('load', loadStop)
    }
  })

  function loadStart () {
    if (webviewViewport.value) {
      loading.value = ElLoading.service({
        target: webviewViewport.value
      })
    }
  }

  function loadStop () {
    if (loading.value) {
      nextTick(() => {
        loading.value!.close()
      })
    }
  }
</script>

<style lang="scss">
.webview-viewport {
  position: relative;
}
.mo-webview {
  display: inline-flex;;
  flex: 1;
  flex-basis: auto;
}
</style>
