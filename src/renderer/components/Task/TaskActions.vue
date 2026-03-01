<template>
  <div class="task-actions">
    <el-tooltip
      class="item hidden-md-and-up"
      effect="dark"
      placement="bottom"
      :content="$t('task.new-task')"
    >
      <i class="task-action" @click.stop="onAddClick">
        <mo-icon name="menu-add" width="14" height="14" />
      </i>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      placement="bottom"
      :content="$t('task.delete-selected-tasks')"
      v-if="currentList !== 'stopped'"
    >
      <i
        class="task-action"
        :class="{ disabled: selectedGidListCount === 0 }"
        @click="onBatchDeleteClick">
        <mo-icon name="delete" width="14" height="14" />
      </i>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      placement="bottom"
      :content="$t('task.refresh-list')"
    >
      <i class="task-action" @click="onRefreshClick">
        <mo-icon name="refresh" width="14" height="14" :spin="refreshing" />
      </i>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      placement="bottom"
      :content="$t('task.resume-all-task')"
    >
      <i class="task-action" @click="onResumeAllClick">
        <mo-icon name="task-start-line" width="14" height="14" />
      </i>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      placement="bottom"
      :content="$t('task.pause-all-task')"
    >
      <i class="task-action" @click="onPauseAllClick">
        <mo-icon name="task-pause-line" width="14" height="14" />
      </i>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      placement="bottom"
      :content="$t('task.purge-record')"
      v-if="currentList === 'stopped'"
    >
      <i class="task-action" @click="onPurgeRecordClick">
        <mo-icon name="purge" width="14" height="14" />
      </i>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, getCurrentInstance } from 'vue'
  import { useTaskStore } from '@/store/task'
  import { useAppStore } from '@/store/app'
  import { useI18n } from 'vue-i18n'

  import { commands } from '@/components/CommandManager/instance'
  import { ADD_TASK_TYPE } from '@shared/constants'
  import '@/components/Icons/menu-add'
  import '@/components/Icons/refresh'
  import '@/components/Icons/task-start-line'
  import '@/components/Icons/task-pause-line'
  import '@/components/Icons/delete'
  import '@/components/Icons/purge'
  import '@/components/Icons/more'

  defineOptions({ name: 'mo-task-actions' })

  defineProps<{
    task?: Record<string, any>
  }>()

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const taskStore = useTaskStore()
  const appStore = useAppStore()

  const refreshing = ref(false)
  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  const currentList = computed(() => taskStore.currentList)
  const selectedGidListCount = computed(() => taskStore.selectedGidList.length)

  function refreshSpin () {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    refreshing.value = true
    refreshTimer = setTimeout(() => {
      refreshing.value = false
    }, 500)
  }

  function onBatchDeleteClick (event: MouseEvent) {
    const deleteWithFiles = !!event.shiftKey
    commands.emit('batch-delete-task', { deleteWithFiles })
  }

  function onRefreshClick () {
    refreshSpin()
    taskStore.fetchList()
  }

  function onResumeAllClick () {
    taskStore.resumeAllTask()
      .then(() => {
        $msg.success(t('task.resume-all-task-success'))
      })
      .catch(({ code }: { code: number }) => {
        if (code === 1) {
          $msg.error(t('task.resume-all-task-fail'))
        }
      })
  }

  function onPauseAllClick () {
    taskStore.pauseAllTask()
      .then(() => {
        $msg.success(t('task.pause-all-task-success'))
      })
      .catch(({ code }: { code: number }) => {
        if (code === 1) {
          $msg.error(t('task.pause-all-task-fail'))
        }
      })
  }

  function onPurgeRecordClick () {
    taskStore.purgeTaskRecord()
      .then(() => {
        $msg.success(t('task.purge-record-success'))
      })
      .catch(({ code }: { code: number }) => {
        if (code === 1) {
          $msg.error(t('task.purge-record-fail'))
        }
      })
  }

  function onAddClick () {
    appStore.showAddTaskDialog(ADD_TASK_TYPE.URI)
  }
</script>

<style lang="scss">
.task-actions {
  position: absolute;
  top: 44px;
  right: 0;
  height: 24px;
  padding: 0;
  overflow: hidden;
  user-select: none;
  cursor: default;
  text-align: right;
  color: $--task-action-color;
  transition: all 0.25s;
  .task-action {
    display: inline-block;
    padding: 5px;
    margin: 0 4px;
    font-size: 0;
    cursor: pointer;
    outline: none;
    &:hover {
      color: $--task-action-hover-color;
    }
    &.disabled {
      color: $--task-action-disabled-color;
    }
  }
}
</style>
