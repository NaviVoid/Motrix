import { defineStore } from 'pinia'
import { ADD_TASK_TYPE } from '@shared/constants'
import api from '@/api'
import { getSystemTheme } from '@/utils/native'

const BASE_INTERVAL: number = 1000
const PER_INTERVAL: number = 100
const MIN_INTERVAL: number = 500
const MAX_INTERVAL: number = 6000

interface EngineInfo {
  version: string
  enabledFeatures: string[]
}

interface GlobalStat {
  downloadSpeed: number
  uploadSpeed: number
  numActive: number
  numWaiting: number
  numStopped: number
  [key: string]: number
}

interface AppState {
  systemTheme: string
  trayFocused: boolean
  aboutPanelVisible: boolean
  engineInfo: EngineInfo
  engineOptions: Record<string, any>
  interval: number
  stat: GlobalStat
  addTaskVisible: boolean
  addTaskType: string
  addTaskUrl: string
  addTaskTorrents: File[]
  addTaskOptions: Record<string, any>
  progress: number
}

interface ActiveTask {
  totalLength: number
  completedLength: number
  [key: string]: any
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    systemTheme: getSystemTheme(),
    trayFocused: false,
    aboutPanelVisible: false,
    engineInfo: {
      version: '',
      enabledFeatures: []
    },
    engineOptions: {},
    interval: BASE_INTERVAL,
    stat: {
      downloadSpeed: 0,
      uploadSpeed: 0,
      numActive: 0,
      numWaiting: 0,
      numStopped: 0
    },
    addTaskVisible: false,
    addTaskType: ADD_TASK_TYPE.URI,
    addTaskUrl: '',
    addTaskTorrents: [],
    addTaskOptions: {},
    progress: 0
  }),
  actions: {
    updateSystemTheme (theme: string): void {
      this.systemTheme = theme
    },
    updateTrayFocused (focused: boolean): void {
      this.trayFocused = focused
    },
    showAboutPanel (): void {
      this.aboutPanelVisible = true
    },
    hideAboutPanel (): void {
      this.aboutPanelVisible = false
    },
    fetchEngineInfo (): void {
      api.getVersion()
        .then((data: Record<string, any>) => {
          this.engineInfo = { ...this.engineInfo, ...data } as EngineInfo
        })
    },
    fetchEngineOptions (): Promise<Record<string, any>> {
      return api.getGlobalOption()
        .then((data: Record<string, any>) => {
          this.engineOptions = { ...this.engineOptions, ...data }
          return data
        })
    },
    fetchGlobalStat (): void {
      api.getGlobalStat()
        .then((data: Record<string, any>) => {
          const stat: Record<string, number> = {}
          Object.keys(data).forEach((key: string) => {
            stat[key] = Number(data[key])
          })

          const { numActive } = stat
          if (numActive > 0) {
            const interval = BASE_INTERVAL - PER_INTERVAL * numActive
            this.updateInterval(interval)
          } else {
            // fix downloadSpeed when numActive = 0
            stat.downloadSpeed = 0
            this.increaseInterval()
          }
          this.stat = stat as GlobalStat
        })
    },
    increaseInterval (millisecond: number = 100): void {
      if (this.interval < MAX_INTERVAL) {
        this.interval += millisecond
      }
    },
    showAddTaskDialog (taskType: string): void {
      this.addTaskType = taskType
      this.addTaskVisible = true
    },
    hideAddTaskDialog (): void {
      this.addTaskVisible = false
      this.addTaskUrl = ''
      this.addTaskTorrents = []
    },
    changeAddTaskType (taskType: string): void {
      this.addTaskType = taskType
    },
    updateAddTaskUrl (uri: string = ''): void {
      this.addTaskUrl = uri
    },
    addTaskAddTorrents ({ fileList }: { fileList: FileList | File[] }): void {
      this.addTaskTorrents = [...fileList]
    },
    updateAddTaskOptions (options: Record<string, any> = {}): void {
      this.addTaskOptions = { ...options }
    },
    updateInterval (millisecond: number): void {
      let interval = millisecond
      if (millisecond > MAX_INTERVAL) {
        interval = MAX_INTERVAL
      }
      if (millisecond < MIN_INTERVAL) {
        interval = MIN_INTERVAL
      }
      if (this.interval === interval) {
        return
      }
      this.interval = interval
    },
    resetInterval (): void {
      this.updateInterval(BASE_INTERVAL)
    },
    fetchProgress (): void {
      api.fetchActiveTaskList()
        .then((data: ActiveTask[]) => {
          let progress = -1
          if (data.length !== 0) {
            data.forEach((task: ActiveTask) => {
              task.totalLength = Number(task.totalLength)
              task.completedLength = Number(task.completedLength)
            })
            const realTotal = data.reduce((total: number, task: ActiveTask) => total + task.totalLength, 0)
            if (realTotal === 0) {
              progress = 2
            } else {
              const tasks = data.filter((task: ActiveTask) => task.totalLength !== 0)
              const completed = tasks.reduce((total: number, task: ActiveTask) => total + task.completedLength, 0)
              const total = tasks.reduce((total: number, task: ActiveTask) => total + task.totalLength, 0)
              progress = completed / total
            }
          }
          this.progress = progress
        })
    }
  }
})
