<template>
  <el-button
    class="select-directory"
    @click.stop="onFolderClick"
  >
    <mo-icon name="folder" width="10" height="10" />
  </el-button>
</template>

<script setup lang="ts">
  import '@/components/Icons/folder'

  defineOptions({ name: 'mo-select-directory' })

  const emit = defineEmits<{
    selected: [path: string]
  }>()

  function onFolderClick () {
    window.electronAPI.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    }).then(({ canceled, filePaths }: { canceled: boolean; filePaths: string[] }) => {
      if (canceled || filePaths.length === 0) {
        return
      }

      const [path] = filePaths
      emit('selected', path)
    })
  }
</script>
