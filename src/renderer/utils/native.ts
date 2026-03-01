import { ElMessage } from 'element-plus'

import {
  getFileNameFromFile,
  isMagnetTask
} from '@shared/utils'
import { APP_THEME, TASK_STATUS } from '@shared/constants'

interface ShowItemOptions {
  errorMsg?: string
}

interface TaskFile {
  path: string
  [key: string]: any
}

interface Task {
  dir: string
  files: TaskFile[]
  status?: string
  bittorrent?: {
    info?: {
      name?: string
    }
  }
  [key: string]: any
}

export const showItemInFolder = async (fullPath: string, { errorMsg }: ShowItemOptions): Promise<void> => {
  if (!fullPath) {
    return
  }

  fullPath = await window.electronAPI.resolvePath(fullPath)
  const exists: boolean = await window.electronAPI.fileExists(fullPath)

  if (!exists && errorMsg) {
    ElMessage.error(errorMsg)
    return
  }

  window.electronAPI.showItemInFolder(fullPath)
}

export const openItem = async (fullPath: string): Promise<string | undefined> => {
  if (!fullPath) {
    return
  }

  const result = await window.electronAPI.openPath(fullPath)
  return result
}

export const getTaskFullPath = async (task: Task): Promise<string> => {
  const { dir, files, bittorrent } = task
  let result: string = await window.electronAPI.resolvePath(dir)

  // Magnet link task
  if (isMagnetTask(task)) {
    return result
  }

  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    result = await window.electronAPI.resolvePath(result, bittorrent.info.name)
    return result
  }

  const [file] = files
  const path: string = file.path ? await window.electronAPI.resolvePath(file.path) : ''
  let fileName: string = ''

  if (path) {
    result = path
  } else {
    if (files && files.length === 1) {
      fileName = getFileNameFromFile(file)
      if (fileName) {
        result = await window.electronAPI.resolvePath(result, fileName)
      }
    }
  }

  return result
}

export const moveTaskFilesToTrash = async (task: Task): Promise<boolean> => {
  /**
   * For magnet link tasks, there is bittorrent, but there is no bittorrent.info.
   * The path is not a complete path before it becomes a BT task.
   * In order to avoid accidentally deleting the directory
   * where the task is located, it directly returns true when deleting.
   */
  if (isMagnetTask(task)) {
    return true
  }

  const { dir, status } = task
  const path: string = await getTaskFullPath(task)
  if (!path || dir === path) {
    throw new Error('task.file-path-error')
  }

  let deleteResult1: boolean = true
  const exists1: boolean = await window.electronAPI.fileExists(path)
  if (exists1) {
    try {
      await window.electronAPI.trashItem(path)
    } catch (e) {
      deleteResult1 = false
    }
  }

  // There is no configuration file for the completed task.
  if (status === TASK_STATUS.COMPLETE) {
    return deleteResult1
  }

  let deleteResult2: boolean = true
  const extraFilePath: string = `${path}.aria2`
  const exists2: boolean = await window.electronAPI.fileExists(extraFilePath)
  if (exists2) {
    try {
      await window.electronAPI.trashItem(extraFilePath)
    } catch (e) {
      deleteResult2 = false
    }
  }

  return deleteResult1 && deleteResult2
}

export const getSystemTheme = (): string => {
  // Synchronous fallback for initial state, updated async later
  return APP_THEME.LIGHT
}

export const getSystemThemeAsync = async (): Promise<string> => {
  return window.electronAPI.getSystemTheme()
}

export const delayDeleteTaskFiles = (task: Task, delay: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await moveTaskFilesToTrash(task)
        resolve(result)
      } catch (err: any) {
        reject(err.message)
      }
    }, delay)
  })
}
