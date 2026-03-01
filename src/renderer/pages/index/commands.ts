import { ElMessage } from 'element-plus'
import { base64StringToBlob } from 'blob-util'

import router from '@/router'
import { useAppStore } from '@/store/app'
import { usePreferenceStore } from '@/store/preference'
import { useTaskStore } from '@/store/task'
import { buildFileList } from '@shared/utils'
import { ADD_TASK_TYPE } from '@shared/constants'
import { getLocaleManager } from '@/components/Locale'
import { commands } from '@/components/CommandManager/instance'
import {
  initTaskForm,
  buildUriPayload,
  buildTorrentPayload
} from '@/utils/task'

const i18n = getLocaleManager().getI18n()

interface CommandPayload {
  [key: string]: any
}

const updateSystemTheme = (payload: CommandPayload = {}) => {
  const { theme } = payload
  useAppStore().updateSystemTheme(theme)
}

const updateTheme = (payload: CommandPayload = {}) => {
  const { theme } = payload
  usePreferenceStore().updateAppTheme(theme)
}

const updateLocale = (payload: CommandPayload = {}) => {
  const { locale } = payload
  usePreferenceStore().updateAppLocale(locale)
}

const updateTrayFocused = (payload: CommandPayload = {}) => {
  const { focused } = payload
  useAppStore().updateTrayFocused(focused)
}

const showAboutPanel = () => {
  useAppStore().showAboutPanel()
}

const addTask = (payload: CommandPayload = {}) => {
  const {
    type = ADD_TASK_TYPE.URI,
    uri,
    silent,
    ...rest
  } = payload

  const options = {
    ...rest
  }

  if (type === ADD_TASK_TYPE.URI && uri) {
    useAppStore().updateAddTaskUrl(uri)
  }
  useAppStore().updateAddTaskOptions(options)

  if (silent) {
    addTaskSilent(type)
    return
  }

  useAppStore().showAddTaskDialog(type)
}

const addTaskSilent = (type: string) => {
  try {
    addTaskByType(type)
  } catch (err: any) {
    ElMessage.error(i18n.t(err.message))
  }
}

const addTaskByType = (type: string) => {
  const form = initTaskForm({ appStore: useAppStore(), preferenceStore: usePreferenceStore() })

  let payload = null
  if (type === ADD_TASK_TYPE.URI) {
    payload = buildUriPayload(form)
    useTaskStore().addUri(payload).catch((err: Error) => {
      ElMessage.error(err.message)
    })
  } else if (type === ADD_TASK_TYPE.TORRENT) {
    payload = buildTorrentPayload(form)
    useTaskStore().addTorrent(payload).catch((err: Error) => {
      ElMessage.error(err.message)
    })
  } else if (type === 'metalink') {
  // @TODO addMetalink
  } else {
    console.error('addTask fail', form)
  }
}

const showAddBtTask = () => {
  useAppStore().showAddTaskDialog(ADD_TASK_TYPE.TORRENT)
}

const showAddBtTaskWithFile = (payload: CommandPayload = {}) => {
  const { name, dataURL = '' } = payload
  if (!dataURL) {
    return
  }

  const blob = base64StringToBlob(dataURL, 'application/x-bittorrent')
  const file = new File([blob], name, { type: 'application/x-bittorrent' })
  const fileList = buildFileList(file)

  useAppStore().showAddTaskDialog(ADD_TASK_TYPE.TORRENT)
  setTimeout(() => {
    useAppStore().addTaskAddTorrents({ fileList })
  }, 200)
}

const navigateTaskList = (payload: CommandPayload = {}) => {
  const { status = 'active' } = payload

  router.push({ path: `/task/${status}` }).catch((err: unknown) => {
    console.log(err)
  })
}

const navigatePreferences = () => {
  router.push({ path: '/preference' }).catch((err: unknown) => {
    console.log(err)
  })
}

const showUnderDevelopmentMessage = () => {
  ElMessage.info(i18n.t('app.under-development-message'))
}

const pauseTask = () => {
  useTaskStore().batchPauseSelectedTasks()
}

const resumeTask = () => {
  useTaskStore().batchResumeSelectedTasks()
}

const deleteTask = () => {
  commands.emit('batch-delete-task', {
    deleteWithFiles: false
  })
}

const moveTaskUp = () => {
  showUnderDevelopmentMessage()
}

const moveTaskDown = () => {
  showUnderDevelopmentMessage()
}

const pauseAllTask = () => {
  useTaskStore().pauseAllTask()
}

const resumeAllTask = () => {
  useTaskStore().resumeAllTask()
}

const selectAllTask = () => {
  useTaskStore().selectAllTask()
}

const showTaskDetail = (payload: CommandPayload = {}) => {
  const { gid } = payload
  navigateTaskList()
  if (gid) {
    useTaskStore().showTaskDetailByGid(gid)
  }
}

const fetchPreference = () => {
  usePreferenceStore().fetchPreference()
}

commands.register('application:task-list', navigateTaskList)
commands.register('application:preferences', navigatePreferences)
commands.register('application:about', showAboutPanel)

commands.register('application:new-task', addTask)
commands.register('application:new-bt-task', showAddBtTask)
commands.register('application:new-bt-task-with-file', showAddBtTaskWithFile)
commands.register('application:pause-task', pauseTask)
commands.register('application:resume-task', resumeTask)
commands.register('application:delete-task', deleteTask)
commands.register('application:move-task-up', moveTaskUp)
commands.register('application:move-task-down', moveTaskDown)
commands.register('application:pause-all-task', pauseAllTask)
commands.register('application:resume-all-task', resumeAllTask)
commands.register('application:select-all-task', selectAllTask)
commands.register('application:show-task-detail', showTaskDetail)

commands.register('application:update-preference-config', fetchPreference)
commands.register('application:update-system-theme', updateSystemTheme)
commands.register('application:update-theme', updateTheme)
commands.register('application:update-locale', updateLocale)
commands.register('application:update-tray-focused', updateTrayFocused)
