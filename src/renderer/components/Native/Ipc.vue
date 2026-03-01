<template>
  <div v-if="false"></div>
</template>

<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import { commands } from '@/components/CommandManager/instance'

  defineOptions({ name: 'mo-ipc' })

  let _removeCommandListener: (() => void) | null = null

  function bindIpcEvents () {
    _removeCommandListener = window.electronAPI.onCommand((command: string, ...args: unknown[]) => {
      commands.execute(command, ...args)
    })
  }

  function unbindIpcEvents () {
    if (_removeCommandListener) {
      _removeCommandListener()
      _removeCommandListener = null
    }
  }

  bindIpcEvents()

  onUnmounted(() => {
    unbindIpcEvents()
  })
</script>
