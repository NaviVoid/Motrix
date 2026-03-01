<template>
  <div :key="task.gid" class="task-item" v-on:dblclick="onDbClick">
    <div class="task-name" :title="taskFullName">
      <span>{{ taskFullName }}</span>
    </div>
    <mo-task-item-actions mode="LIST" :task="task" />
    <div class="task-progress">
      <mo-task-progress
        :completed="Number(task.completedLength)"
        :total="Number(task.totalLength)"
        :status="taskStatus"
      />
      <mo-task-progress-info :task="task" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTaskStore } from '@/store/task'
  import { checkTaskIsSeeder, getTaskName } from '@shared/utils'
  import { TASK_STATUS } from '@shared/constants'
  import { openItem, getTaskFullPath } from '@/utils/native'
  import MoTaskItemActions from './TaskItemActions.vue'
  import MoTaskProgress from './TaskProgress.vue'
  import MoTaskProgressInfo from './TaskProgressInfo.vue'

  defineOptions({ name: 'mo-task-item' })

  const props = defineProps<{
    task: Record<string, any>
  }>()

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const taskStore = useTaskStore()

  const taskFullName = computed(() => {
    return getTaskName(props.task, {
      defaultName: t('task.get-task-name'),
      maxLen: -1
    })
  })

  const taskName = computed(() => {
    return getTaskName(props.task, {
      defaultName: t('task.get-task-name')
    })
  })

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const taskStatus = computed(() => {
    if (isSeeder.value) {
      return TASK_STATUS.SEEDING
    } else {
      return props.task.status
    }
  })

  function onDbClick () {
    const { status } = props.task
    const { COMPLETE, WAITING, PAUSED } = TASK_STATUS
    if (status === COMPLETE) {
      openTask()
    } else if ([WAITING, PAUSED].includes(status) !== -1) {
      toggleTask()
    }
  }

  async function openTask () {
    $msg.info(t('task.opening-task-message', { taskName: taskName.value }))
    const fullPath = getTaskFullPath(props.task)
    const result = await openItem(fullPath)
    if (result) {
      $msg.error(t('task.file-not-exist'))
    }
  }

  function toggleTask () {
    taskStore.toggleTask(props.task)
  }
</script>

<style lang="scss">
.task-item {
  position: relative;
  min-height: 78px;
  padding: 16px 12px;
  background-color: $--task-item-background;
  border: 1px solid $--task-item-border-color;
  border-radius: 6px;
  margin-bottom: 16px;
  transition: $--border-transition-base;
  &:hover {
    border-color: $--task-item-hover-border-color;
  }
  .task-item-actions {
    position: absolute;
    top: 16px;
    right: 12px;
  }
}
.selected .task-item {
  border-color: $--task-item-hover-border-color;
}
.task-name {
  color: #505753;
  margin-bottom: 1.5rem;
  margin-right: 200px;
  word-break: break-all;
  min-height: 26px;
  &> span {
    font-size: 14px;
    line-height: 26px;
    overflow : hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
