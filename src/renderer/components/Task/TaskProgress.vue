<template>
  <el-progress
    v-if="isActive"
    :percentage="percent"
    :show-text="false"
    status="success"
    :color="color">
  </el-progress>
  <el-progress
    v-else
    :percentage="percent"
    :show-text="false"
    :color="color">
  </el-progress>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { TASK_STATUS } from '@shared/constants'
  import { calcProgress } from '@shared/utils'
  import colors from '@shared/colors'

  defineOptions({ name: 'mo-task-progress' })

  const props = withDefaults(defineProps<{
    total?: number
    completed?: number
    status?: string
  }>(), {
    status: TASK_STATUS.ACTIVE
  })

  const isActive = computed(() => props.status === TASK_STATUS.ACTIVE)

  const percent = computed(() => calcProgress(props.total, props.completed))

  const color = computed(() => colors[props.status])
</script>
