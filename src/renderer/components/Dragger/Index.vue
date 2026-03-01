<template>
  <div v-if="false"></div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ADD_TASK_TYPE } from '@shared/constants'
  import { useAppStore } from '@/store/app'

  defineOptions({ name: 'mo-dragger' })

  const { t } = useI18n()
  const instance = getCurrentInstance()

  let preventDefault: (ev: Event) => void
  let onDragEnter: (ev: DragEvent) => void
  let onDragLeave: (ev: DragEvent) => void
  let onDrop: (ev: DragEvent) => void

  onMounted(() => {
    const appStore = useAppStore()
    preventDefault = (ev: Event) => ev.preventDefault()
    let count = 0

    onDragEnter = () => {
      if (count === 0) {
        appStore.showAddTaskDialog(ADD_TASK_TYPE.TORRENT)
      }
      count++
    }

    onDragLeave = () => {
      count--
      if (count === 0) {
        appStore.hideAddTaskDialog()
      }
    }

    onDrop = (ev: DragEvent) => {
      count = 0

      const fileList = [...(ev.dataTransfer?.files ?? [])]
        .map(item => ({ raw: item, name: item.name }))
        .filter(item => /\.torrent$/.test(item.name))
      if (!fileList.length) {
        instance?.proxy?.$msg.error(t('task.select-torrent'))
      }
    }

    document.addEventListener('dragover', preventDefault)
    document.body.addEventListener('dragenter', onDragEnter as EventListener)
    document.body.addEventListener('dragleave', onDragLeave as EventListener)
    document.body.addEventListener('drop', onDrop as EventListener)
  })

  onUnmounted(() => {
    document.removeEventListener('dragover', preventDefault)
    document.body.removeEventListener('dragenter', onDragEnter as EventListener)
    document.body.removeEventListener('dragleave', onDragLeave as EventListener)
    document.body.removeEventListener('drop', onDrop as EventListener)
  })
</script>
