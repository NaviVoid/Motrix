<template>
  <ul :key="task.gid" class="task-item-actions" v-on:dblclick.stop="() => null">
    <li v-for="action in taskActions" :key="action" class="task-item-action">
      <i v-if="action ==='PAUSE'" @click.stop="onPauseClick">
        <mo-icon name="task-pause-line" width="14" height="14" />
      </i>
      <i v-if="action ==='STOP'" @click.stop="onStopClick">
        <mo-icon name="task-stop-line" width="14" height="14" />
      </i>
      <i v-if="action === 'RESUME'" @click.stop="onResumeClick">
        <mo-icon name="task-start-line" width="14" height="14" />
      </i>
      <i v-if="action === 'RESTART'" @click.stop="onRestartClick">
        <mo-icon name="task-restart" width="14" height="14" />
      </i>
      <i v-if="action === 'DELETE'" @click.stop="onDeleteClick">
        <mo-icon name="delete" width="14" height="14" />
      </i>
      <i v-if="action === 'TRASH'" @click.stop="onTrashClick">
        <mo-icon name="trash" width="14" height="14" />
      </i>
      <i v-if="action ==='FOLDER'" @click.stop="onFolderClick">
        <mo-icon name="folder" width="14" height="14" />
      </i>
      <i v-if="action ==='LINK'" @click.stop="onLinkClick">
        <mo-icon name="link" width="14" height="14" />
      </i>
      <i v-if="action ==='INFO'" @click.stop="onInfoClick">
        <mo-icon name="info-circle" width="14" height="14" />
      </i>
    </li>
  </ul>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { usePreferenceStore } from '@/store/preference'
  import is from 'electron-is'

  import { commands } from '@/components/CommandManager/instance'
  import { TASK_STATUS } from '@shared/constants'
  import {
    checkTaskIsSeeder,
    getTaskName
  } from '@shared/utils'
  import { getTaskFullPath } from '@/utils/native'
  import '@/components/Icons/task-start-line'
  import '@/components/Icons/task-pause-line'
  import '@/components/Icons/task-stop-line'
  import '@/components/Icons/task-restart'
  import '@/components/Icons/delete'
  import '@/components/Icons/folder'
  import '@/components/Icons/link'
  import '@/components/Icons/info-circle'
  import '@/components/Icons/trash'

  defineOptions({ name: 'mo-task-item-actions' })

  const props = defineProps<{
    mode?: string
    task: Record<string, any>
  }>()

  const taskActionsMap: Record<string, string[]> = {
    [TASK_STATUS.ACTIVE]: ['PAUSE', 'DELETE'],
    [TASK_STATUS.PAUSED]: ['RESUME', 'DELETE'],
    [TASK_STATUS.WAITING]: ['RESUME', 'DELETE'],
    [TASK_STATUS.ERROR]: ['RESTART', 'TRASH'],
    [TASK_STATUS.COMPLETE]: ['RESTART', 'TRASH'],
    [TASK_STATUS.REMOVED]: ['RESTART', 'TRASH'],
    [TASK_STATUS.SEEDING]: ['STOP', 'DELETE']
  }

  const preferenceStore = usePreferenceStore()

  const noConfirmBeforeDelete = computed(() => preferenceStore.config.noConfirmBeforeDeleteTask)

  const taskName = computed(() => getTaskName(props.task))

  const path = computed(() => getTaskFullPath(props.task))

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const taskStatus = computed(() => {
    if (isSeeder.value) {
      return TASK_STATUS.SEEDING
    } else {
      return props.task.status
    }
  })

  const taskCommonActions = computed(() => {
    const mode = props.mode ?? 'LIST'
    const result = is.renderer() ? ['FOLDER'] : []

    switch (mode) {
    case 'LIST':
      result.push('LINK', 'INFO')
      break
    case 'DETAIL':
      result.push('LINK')
      break
    }

    return result
  })

  const taskActions = computed(() => {
    const actions = taskActionsMap[taskStatus.value] || []
    const result = [...actions, ...taskCommonActions.value].reverse()
    return result
  })

  function onResumeClick () {
    commands.emit('resume-task', {
      task: props.task,
      taskName: taskName.value
    })
  }

  function onRestartClick (event: MouseEvent) {
    const { status } = props.task
    const showDialog = status === TASK_STATUS.COMPLETE || !!event.altKey
    commands.emit('restart-task', {
      task: props.task,
      taskName: taskName.value,
      showDialog
    })
  }

  function onPauseClick () {
    commands.emit('pause-task', {
      task: props.task,
      taskName: taskName.value
    })
  }

  function onStopClick () {
    if (!isSeeder.value) {
      return
    }

    commands.emit('stop-task-seeding', { task: props.task })
  }

  function onDeleteClick (event: MouseEvent) {
    const deleteWithFiles = !!event.shiftKey
    commands.emit('delete-task', {
      task: props.task,
      taskName: taskName.value,
      deleteWithFiles
    })
  }

  function onTrashClick (event: MouseEvent) {
    const deleteWithFiles = !!event.shiftKey
    commands.emit('delete-task-record', {
      task: props.task,
      taskName: taskName.value,
      deleteWithFiles
    })
  }

  function onFolderClick () {
    commands.emit('reveal-in-folder', { path: path.value })
  }

  function onLinkClick () {
    commands.emit('copy-task-link', { task: props.task })
  }

  function onInfoClick () {
    commands.emit('show-task-info', { task: props.task })
  }
</script>

<style lang="scss">
.task-item-actions {
  // width: 28px;
  height: 24px;
  padding: 0 10px;
  margin: 0;
  overflow: hidden;
  user-select: none;
  cursor: default;
  text-align: right;
  direction: rtl;
  border: 1px solid $--task-item-action-border-color;
  color: $--task-item-action-color;
  background-color: $--task-item-action-background;
  border-radius: 14px;
  transition: $--all-transition;
  &:hover {
    border-color: $--task-item-action-hover-border-color;
    color: $--task-item-action-hover-color;
    background-color: $--task-item-action-hover-background;
    width: auto;
  }
  &> .task-item-action {
    display: inline-block;
    padding: 5px;
    margin: 0 4px;
    font-size: 0;
    cursor: pointer;
    i {
      display: inline-block;
    }
  }
}
</style>
