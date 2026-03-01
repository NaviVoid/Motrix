<template>
  <el-tag :effect="theme" class="tag-task-status" :type="type">
    {{ status && status.toUpperCase() }}
  </el-tag>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { APP_THEME, TASK_STATUS } from '@shared/constants'
  import colors from '@shared/colors'

  defineOptions({ name: 'mo-task-status' })

  const statusTypeMap: Record<string, string> = {
    [TASK_STATUS.ACTIVE]: 'success',
    [TASK_STATUS.WAITING]: 'info',
    [TASK_STATUS.PAUSED]: 'info',
    [TASK_STATUS.ERROR]: 'danger',
    [TASK_STATUS.COMPLETE]: 'success',
    [TASK_STATUS.REMOVED]: 'info',
    [TASK_STATUS.SEEDING]: 'success'
  }

  const props = withDefaults(defineProps<{
    theme?: string
    status?: string
  }>(), {
    theme: APP_THEME.DARK,
    status: TASK_STATUS.ACTIVE
  })

  const type = computed(() => statusTypeMap[props.status])

  const color = computed(() => colors[props.status])
</script>
