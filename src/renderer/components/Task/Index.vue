<template>
  <el-container
    class="main panel"
    direction="horizontal"
  >
    <el-aside
      width="200px"
      class="subnav hidden-xs-only"
    >
      <mo-task-subnav :current="status" />
    </el-aside>
    <el-container
      class="content panel"
      direction="vertical"
    >
      <el-header
        class="panel-header"
        height="84"
      >
        <h4 class="task-title hidden-xs-only">{{ title }}</h4>
        <mo-subnav-switcher
          :title="title"
          :subnavs="subnavs"
          class="hidden-sm-and-up"
        />
        <mo-task-actions />
      </el-header>
      <el-main class="panel-content">
        <mo-task-list />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
  import { computed, getCurrentInstance, onMounted, onUnmounted, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import { useTaskStore } from '@/store/task'
  import { usePreferenceStore } from '@/store/preference'
  import { useAppStore } from '@/store/app'

  import { commands } from '@/components/CommandManager/instance'
  import { ADD_TASK_TYPE } from '@shared/constants'
  import MoTaskSubnav from '@/components/Subnav/TaskSubnav.vue'
  import MoTaskActions from '@/components/Task/TaskActions.vue'
  import MoTaskList from '@/components/Task/TaskList.vue'
  import MoSubnavSwitcher from '@/components/Subnav/SubnavSwitcher.vue'
  import {
    getTaskUri,
    parseHeader
  } from '@shared/utils'
  import {
    delayDeleteTaskFiles,
    showItemInFolder,
    moveTaskFilesToTrash
  } from '@/utils/native'

  defineOptions({ name: 'mo-content-task' })

  const props = withDefaults(defineProps<{
    status?: string
  }>(), {
    status: 'active'
  })

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const taskStore = useTaskStore()
  const preferenceStore = usePreferenceStore()
  const appStore = useAppStore()

  const { taskList, selectedGidList } = storeToRefs(taskStore)
  const selectedGidListCount = computed(() => selectedGidList.value.length)

  const noConfirmBeforeDelete = computed(() => preferenceStore.config.noConfirmBeforeDeleteTask)

  const subnavs = computed(() => [
    {
      key: 'active',
      title: t('task.active'),
      route: '/task/active'
    },
    {
      key: 'waiting',
      title: t('task.waiting'),
      route: '/task/waiting'
    },
    {
      key: 'stopped',
      title: t('task.stopped'),
      route: '/task/stopped'
    }
  ])

  const title = computed(() => {
    const subnav = subnavs.value.find((item) => item.key === props.status)
    return subnav.title
  })

  watch(() => props.status, () => {
    changeCurrentList()
  })

  function changeCurrentList () {
    taskStore.changeCurrentList(props.status)
  }

  function directAddTask (uri: string, options: Record<string, any> = {}) {
    const uris = [uri]
    const payload = {
      uris,
      options: {
        ...options
      }
    }
    taskStore.addUri(payload)
      .catch((err: any) => {
        $msg.error(err.message)
      })
  }

  function showAddTaskDialog (uri: string, options: Record<string, any> = {}) {
    const {
      header,
      ...rest
    } = options
    console.log('[Motrix] show add task dialog options: ', options)

    const headers = parseHeader(header)
    const newOptions = {
      ...rest,
      ...headers
    }

    appStore.updateAddTaskUrl(uri)
    appStore.updateAddTaskOptions(newOptions)
    appStore.showAddTaskDialog(ADD_TASK_TYPE.URI)
  }

  async function deleteTaskFiles (task: any) {
    try {
      const result = await moveTaskFilesToTrash(task)

      if (!result) {
        throw new Error('task.remove-task-file-fail')
      }
    } catch (err: any) {
      $msg.error(t(err.message))
    }
  }

  function removeTask (task: any, taskName: string, isRemoveWithFiles = false) {
    taskStore.forcePauseTask(task)
      .finally(() => {
        if (isRemoveWithFiles) {
          deleteTaskFiles(task)
        }

        return removeTaskItem(task, taskName)
      })
  }

  function removeTaskRecord (task: any, taskName: string, isRemoveWithFiles = false) {
    taskStore.forcePauseTask(task)
      .finally(() => {
        if (isRemoveWithFiles) {
          deleteTaskFiles(task)
        }

        return removeTaskRecordItem(task, taskName)
      })
  }

  async function removeTaskItem (task: any, taskName: string) {
    try {
      await taskStore.removeTask(task)
      $msg.success(t('task.delete-task-success', {
        taskName
      }))
    } catch ({ code }: any) {
      if (code === 1) {
        $msg.error(t('task.delete-task-fail', {
          taskName
        }))
      }
    }
  }

  async function removeTaskRecordItem (task: any, taskName: string) {
    try {
      await taskStore.removeTaskRecord(task)
      $msg.success(t('task.remove-record-success', {
        taskName
      }))
    } catch ({ code }: any) {
      if (code === 1) {
        $msg.error(t('task.remove-record-fail', {
          taskName
        }))
      }
    }
  }

  function removeTasks (tasks: any[], isRemoveWithFiles = false) {
    const gids = tasks.map((task) => task.gid)
    taskStore.batchForcePauseTask(gids)
      .finally(() => {
        if (isRemoveWithFiles) {
          batchDeleteTaskFiles(tasks)
        }

        removeTaskItems(gids)
      })
  }

  function batchDeleteTaskFiles (tasks: any[]) {
    const promises = tasks.map((task, index) => delayDeleteTaskFiles(task, index * 200))
    Promise.allSettled(promises).then(results => {
      console.log('[Motrix] batch delete task files: ', results)
    })
  }

  function removeTaskItems (gids: string[]) {
    taskStore.batchRemoveTask(gids)
      .then(() => {
        $msg.success(t('task.batch-delete-task-success'))
      })
      .catch(({ code }: any) => {
        if (code === 1) {
          $msg.error(t('task.batch-delete-task-fail'))
        }
      })
  }

  function handlePauseTask (payload: any) {
    const { task, taskName } = payload
    $msg.info(t('task.download-pause-message', { taskName }))
    taskStore.pauseTask(task)
      .catch(({ code }: any) => {
        if (code === 1) {
          $msg.error(t('task.pause-task-fail', { taskName }))
        }
      })
  }

  function handleResumeTask (payload: any) {
    const { task, taskName } = payload
    taskStore.resumeTask(task)
      .catch(({ code }: any) => {
        if (code === 1) {
          $msg.error(t('task.resume-task-fail', {
            taskName
          }))
        }
      })
  }

  function handleStopTaskSeeding (payload: any) {
    const { task } = payload
    taskStore.stopSeeding(task)
    $msg.info({
      message: t('task.bt-stopping-seeding-tip'),
      duration: 8000
    })
  }

  function handleRestartTask (payload: any) {
    const { task, taskName, showDialog } = payload
    const { gid } = task
    const uri = getTaskUri(task)

    taskStore.getTaskOption(gid)
      .then((data: any) => {
        console.log('[Motrix] get task option:', data)
        const { dir, header, split } = data
        const options = {
          dir,
          header,
          split,
          out: taskName
        }

        if (showDialog) {
          showAddTaskDialog(uri, options)
        } else {
          directAddTask(uri, options)
          taskStore.removeTaskRecord(task)
        }
      })
  }

  function handleRevealInFolder (payload: any) {
    const { path } = payload
    showItemInFolder(path, {
      errorMsg: t('task.file-not-exist')
    })
  }

  function handleDeleteTask (payload: any) {
    const { task, taskName, deleteWithFiles } = payload

    if (noConfirmBeforeDelete.value) {
      removeTask(task, taskName, deleteWithFiles)
      return
    }

    window.electronAPI.showMessageBox({
      type: 'warning',
      title: t('task.delete-task'),
      message: t('task.delete-task-confirm', { taskName }),
      buttons: [t('app.yes'), t('app.no')],
      cancelId: 1,
      checkboxLabel: t('task.delete-task-label'),
      checkboxChecked: deleteWithFiles
    }).then(({ response, checkboxChecked }: any) => {
      if (response === 0) {
        removeTask(task, taskName, checkboxChecked)
      }
    })
  }

  function handleDeleteTaskRecord (payload: any) {
    const { task, taskName, deleteWithFiles } = payload

    if (noConfirmBeforeDelete.value) {
      removeTaskRecord(task, taskName, deleteWithFiles)
      return
    }

    window.electronAPI.showMessageBox({
      type: 'warning',
      title: t('task.remove-record'),
      message: t('task.remove-record-confirm', { taskName }),
      buttons: [t('app.yes'), t('app.no')],
      cancelId: 1,
      checkboxLabel: t('task.remove-record-label'),
      checkboxChecked: !!deleteWithFiles
    }).then(({ response, checkboxChecked }: any) => {
      if (response === 0) {
        removeTaskRecord(task, taskName, checkboxChecked)
      }
    })
  }

  function handleBatchDeleteTask (payload: any) {
    const { deleteWithFiles } = payload
    if (selectedGidListCount.value === 0) {
      return
    }

    const selectedTaskList = taskList.value.filter((task: any) => {
      return selectedGidList.value.includes(task.gid)
    })

    if (noConfirmBeforeDelete.value) {
      removeTasks(selectedTaskList, deleteWithFiles)
      return
    }

    const count = `${selectedGidListCount.value}`
    window.electronAPI.showMessageBox({
      type: 'warning',
      title: t('task.delete-selected-task'),
      message: t('task.batch-delete-task-confirm', { count }),
      buttons: [t('app.yes'), t('app.no')],
      cancelId: 1,
      checkboxLabel: t('task.delete-task-label'),
      checkboxChecked: deleteWithFiles
    }).then(({ response, checkboxChecked }: any) => {
      if (response === 0) {
        removeTasks(selectedTaskList, checkboxChecked)
      }
    })
  }

  function handleCopyTaskLink (payload: any) {
    const { task } = payload
    const uri = getTaskUri(task)
    navigator.clipboard.writeText(uri)
      .then(() => {
        $msg.success(t('task.copy-link-success'))
      })
  }

  function handleShowTaskInfo (payload: any) {
    const { task } = payload
    taskStore.showTaskDetail(task)
  }

  // created equivalent — runs immediately in setup scope
  changeCurrentList()

  onMounted(() => {
    commands.on('pause-task', handlePauseTask)
    commands.on('resume-task', handleResumeTask)
    commands.on('stop-task-seeding', handleStopTaskSeeding)
    commands.on('restart-task', handleRestartTask)
    commands.on('reveal-in-folder', handleRevealInFolder)
    commands.on('delete-task', handleDeleteTask)
    commands.on('delete-task-record', handleDeleteTaskRecord)
    commands.on('batch-delete-task', handleBatchDeleteTask)
    commands.on('copy-task-link', handleCopyTaskLink)
    commands.on('show-task-info', handleShowTaskInfo)
  })

  onUnmounted(() => {
    commands.off('pause-task', handlePauseTask)
    commands.off('resume-task', handleResumeTask)
    commands.off('stop-task-seeding', handleStopTaskSeeding)
    commands.off('restart-task', handleRestartTask)
    commands.off('reveal-in-folder', handleRevealInFolder)
    commands.off('delete-task', handleDeleteTask)
    commands.off('delete-task-record', handleDeleteTaskRecord)
    commands.off('batch-delete-task', handleBatchDeleteTask)
    commands.off('copy-task-link', handleCopyTaskLink)
    commands.off('show-task-info', handleShowTaskInfo)
  })
</script>
