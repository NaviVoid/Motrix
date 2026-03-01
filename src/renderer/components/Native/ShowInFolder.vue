<template>
  <i @click.stop="onFolderClick">
    <mo-icon name="folder" width="10" height="10" />
  </i>
</template>

<script setup lang="ts">
  import '@/components/Icons/folder'
  import { useI18n } from 'vue-i18n'
  import {
    showItemInFolder
  } from '@/utils/native'

  defineOptions({ name: 'mo-show-in-folder' })

  const { t } = useI18n()

  const props = defineProps<{
    path?: string
  }>()

  function onFolderClick () {
    if (!props.path) {
      return
    }
    showItemInFolder(props.path, {
      errorMsg: t('task.file-not-exist')
    })
  }
</script>
