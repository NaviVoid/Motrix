<template>
  <div v-if="false"></div>
</template>

<script setup lang="ts">
  import { computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import is from 'electron-is'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { useTaskStore } from '@/store/task'
  import api from '@/api'
  import {
    getTaskFullPath,
    showItemInFolder
  } from '@/utils/native'
  import { checkTaskIsBT, getTaskName } from '@shared/utils'

  defineOptions({ name: 'mo-engine-client' })

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()
  const taskStore = useTaskStore()

  let timer: ReturnType<typeof setTimeout> | null = null

  const isRenderer = computed(() => is.renderer())
  const uploadSpeed = computed(() => appStore.stat.uploadSpeed)
  const downloadSpeed = computed(() => appStore.stat.downloadSpeed)
  const speed = computed(() => appStore.stat.uploadSpeed + appStore.stat.downloadSpeed)
  const interval = computed(() => appStore.interval)
  const downloading = computed(() => appStore.stat.numActive > 0)
  const progress = computed(() => appStore.progress)

  const messages = computed(() => taskStore.messages)
  const seedingList = computed(() => taskStore.seedingList)
  const taskDetailVisible = computed(() => taskStore.taskDetailVisible)
  const enabledFetchPeers = computed(() => taskStore.enabledFetchPeers)
  const currentTaskGid = computed(() => taskStore.currentTaskGid)
  const currentTaskItem = computed(() => taskStore.currentTaskItem)

  const taskNotification = computed(() => preferenceStore.config.taskNotification)

  const currentTaskIsBT = computed(() => {
    return checkTaskIsBT(currentTaskItem.value)
  })

  watch(speed, (val) => {
    window.electronAPI.sendEvent('speed-change', {
      uploadSpeed: uploadSpeed.value,
      downloadSpeed: downloadSpeed.value
    })
  })

  watch(downloading, (val, oldVal) => {
    if (val !== oldVal && isRenderer.value) {
      window.electronAPI.sendEvent('download-status-change', val)
    }
  })

  watch(progress, (val) => {
    window.electronAPI.sendEvent('progress-change', val)
  })

  async function fetchTaskItem ({ gid }: { gid: string }) {
    return api.fetchTaskItem({ gid })
      .catch((e: Error) => {
        console.warn(`fetchTaskItem fail: ${e.message}`)
      })
  }

  function onDownloadStart (event: any) {
    taskStore.fetchList()
    appStore.resetInterval()
    taskStore.saveSession()
    const [{ gid }] = event
    if (seedingList.value.includes(gid)) {
      return
    }

    fetchTaskItem({ gid })
      .then((task: any) => {
        const { dir } = task
        preferenceStore.recordHistoryDirectory(dir)
        const taskName = getTaskName(task)
        const message = t('task.download-start-message', { taskName })
        $msg.info(message)
      })
  }

  function onDownloadPause (event: any) {
    const [{ gid }] = event
    if (seedingList.value.includes(gid)) {
      return
    }

    fetchTaskItem({ gid })
      .then((task: any) => {
        const taskName = getTaskName(task)
        const message = t('task.download-pause-message', { taskName })
        $msg.info(message)
      })
  }

  function onDownloadStop (event: any) {
    const [{ gid }] = event
    fetchTaskItem({ gid })
      .then((task: any) => {
        const taskName = getTaskName(task)
        const message = t('task.download-stop-message', { taskName })
        $msg.info(message)
      })
  }

  function onDownloadError (event: any) {
    const [{ gid }] = event
    fetchTaskItem({ gid })
      .then((task: any) => {
        const taskName = getTaskName(task)
        const { errorCode, errorMessage } = task
        console.error(`[Motrix] download error gid: ${gid}, #${errorCode}, ${errorMessage}`)
        const message = t('task.download-error-message', { taskName })
        const link = `<a target="_blank" href="https://github.com/agalwood/Motrix/wiki/Error#${errorCode}" rel="noopener noreferrer">${errorCode}</a>`
        $msg({
          type: 'error',
          showClose: true,
          duration: 5000,
          dangerouslyUseHTMLString: true,
          message: `${message} ${link}`
        })
      })
  }

  function onDownloadComplete (event: any) {
    taskStore.fetchList()
    const [{ gid }] = event
    taskStore.removeFromSeedingList(gid)

    fetchTaskItem({ gid })
      .then((task: any) => {
        handleDownloadComplete(task, false)
      })
  }

  function onBtDownloadComplete (event: any) {
    taskStore.fetchList()
    const [{ gid }] = event
    if (seedingList.value.includes(gid)) {
      return
    }

    taskStore.addToSeedingList(gid)

    fetchTaskItem({ gid })
      .then((task: any) => {
        handleDownloadComplete(task, true)
      })
  }

  async function handleDownloadComplete (task: any, isBT: boolean) {
    taskStore.saveSession()

    const path = await getTaskFullPath(task)
    showTaskCompleteNotify(task, isBT, path)
    window.electronAPI.sendEvent('task-download-complete', task, path)
  }

  function showTaskCompleteNotify (task: any, isBT: boolean, path: string) {
    const taskName = getTaskName(task)
    const message = isBT
      ? t('task.bt-download-complete-message', { taskName })
      : t('task.download-complete-message', { taskName })
    const tips = isBT
      ? '\n' + t('task.bt-download-complete-tips')
      : ''

    $msg.success(`${message}${tips}`)

    if (!taskNotification.value) {
      return
    }

    const notifyMessage = isBT
      ? t('task.bt-download-complete-notify')
      : t('task.download-complete-notify')

    /* eslint-disable no-new */
    const notify = new Notification(notifyMessage, {
      body: `${taskName}${tips}`
    })
    notify.onclick = () => {
      showItemInFolder(path, {
        errorMsg: t('task.file-not-exist')
      })
    }
  }

  function showTaskErrorNotify (task: any) {
    const taskName = getTaskName(task)

    const message = t('task.download-fail-message', { taskName })
    $msg.success(message)

    if (!taskNotification.value) {
      return
    }

    /* eslint-disable no-new */
    new Notification(t('task.download-fail-notify'), {
      body: taskName
    })
  }

  function bindEngineEvents () {
    api.client.on('onDownloadStart', onDownloadStart)
    // api.client.on('onDownloadPause', onDownloadPause)
    api.client.on('onDownloadStop', onDownloadStop)
    api.client.on('onDownloadComplete', onDownloadComplete)
    api.client.on('onDownloadError', onDownloadError)
    api.client.on('onBtDownloadComplete', onBtDownloadComplete)
  }

  function unbindEngineEvents () {
    api.client.removeListener('onDownloadStart', onDownloadStart)
    // api.client.removeListener('onDownloadPause', onDownloadPause)
    api.client.removeListener('onDownloadStop', onDownloadStop)
    api.client.removeListener('onDownloadComplete', onDownloadComplete)
    api.client.removeListener('onDownloadError', onDownloadError)
    api.client.removeListener('onBtDownloadComplete', onBtDownloadComplete)
  }

  function startPolling () {
    timer = setTimeout(() => {
      polling()
      startPolling()
    }, interval.value)
  }

  function polling () {
    appStore.fetchGlobalStat()
    appStore.fetchProgress()
    taskStore.fetchList()

    if (taskDetailVisible.value && currentTaskGid.value) {
      if (currentTaskIsBT.value && enabledFetchPeers.value) {
        taskStore.fetchItemWithPeers(currentTaskGid.value)
      } else {
        taskStore.fetchItem(currentTaskGid.value)
      }
    }
  }

  function stopPolling () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  // created equivalent - runs at setup time
  bindEngineEvents()

  onMounted(() => {
    setTimeout(() => {
      appStore.fetchEngineInfo()
      appStore.fetchEngineOptions()

      startPolling()
    }, 100)
  })

  onUnmounted(() => {
    taskStore.saveSession()

    unbindEngineEvents()

    stopPolling()
  })
</script>
