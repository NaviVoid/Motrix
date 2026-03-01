import { defineStore } from 'pinia'
import api from '@/api'
import { EMPTY_STRING, TASK_STATUS } from '@shared/constants'
import { checkTaskIsBT, intersection } from '@shared/utils'

interface TaskState {
  currentList: string
  taskDetailVisible: boolean
  currentTaskGid: string
  enabledFetchPeers: boolean
  currentTaskItem: any
  currentTaskFiles: any[]
  currentTaskPeers: any[]
  seedingList: string[]
  taskList: any[]
  selectedGidList: string[]
}

interface AddUriData {
  uris: string[]
  outs: string[]
  options: Record<string, any>
}

interface AddTorrentData {
  torrent: string
  options: Record<string, any>
}

interface AddMetalinkData {
  metalink: string
  options: Record<string, any>
}

interface ChangeOptionPayload {
  gid: string
  options: Record<string, any>
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    currentList: 'active',
    taskDetailVisible: false,
    currentTaskGid: EMPTY_STRING,
    enabledFetchPeers: false,
    currentTaskItem: null,
    currentTaskFiles: [],
    currentTaskPeers: [],
    seedingList: [],
    taskList: [],
    selectedGidList: []
  }),
  actions: {
    changeCurrentList (currentList: string): void {
      this.currentList = currentList
      this.selectedGidList = []
      this.fetchList()
    },
    fetchList (): Promise<void> {
      return api.fetchTaskList({ type: this.currentList })
        .then((data: any[]) => {
          this.taskList = data

          const { selectedGidList } = this
          const gids = data.map((task: any) => task.gid)
          const list = intersection(selectedGidList, gids)
          this.selectedGidList = list
        })
    },
    selectTasks (list: string[]): void {
      this.selectedGidList = list
    },
    selectAllTask (): void {
      const gids = this.taskList.map((task: any) => task.gid)
      this.selectedGidList = gids
    },
    fetchItem (gid: string): Promise<void> {
      return api.fetchTaskItem({ gid })
        .then((data: any) => {
          this.updateCurrentTaskItem(data)
        })
    },
    fetchItemWithPeers (gid: string): Promise<void> {
      return api.fetchTaskItemWithPeers({ gid })
        .then((data: any) => {
          console.log('fetchItemWithPeers===>', data)
          this.updateCurrentTaskItem(data)
        })
    },
    showTaskDetailByGid (gid: string): void {
      api.fetchTaskItem({ gid })
        .then((task: any) => {
          this.updateCurrentTaskItem(task)
          this.currentTaskGid = task.gid
          this.taskDetailVisible = true
        })
    },
    showTaskDetail (task: any): void {
      this.updateCurrentTaskItem(task)
      this.currentTaskGid = task.gid
      this.taskDetailVisible = true
    },
    hideTaskDetail (): void {
      this.taskDetailVisible = false
    },
    toggleEnabledFetchPeers (enabled: boolean): void {
      this.enabledFetchPeers = enabled
    },
    updateCurrentTaskItem (task: any): void {
      this.currentTaskItem = task
      if (task) {
        this.currentTaskFiles = task.files
        this.currentTaskPeers = task.peers
      } else {
        this.currentTaskFiles = []
        this.currentTaskPeers = []
      }
    },
    updateCurrentTaskGid (gid: string): void {
      this.currentTaskGid = gid
    },
    addUri (data: AddUriData): Promise<void> {
      const { uris, outs, options } = data
      return api.addUri({ uris, outs, options })
        .then(() => {
          this.fetchList()
          // Cross-store call: clear add task options in app store
          import('@/store/app').then(({ useAppStore }) => {
            const appStore = useAppStore()
            appStore.updateAddTaskOptions({})
          })
        })
    },
    addTorrent (data: AddTorrentData): Promise<void> {
      const { torrent, options } = data
      return api.addTorrent({ torrent, options })
        .then(() => {
          this.fetchList()
          // Cross-store call: clear add task options in app store
          import('@/store/app').then(({ useAppStore }) => {
            const appStore = useAppStore()
            appStore.updateAddTaskOptions({})
          })
        })
    },
    addMetalink (data: AddMetalinkData): Promise<void> {
      const { metalink, options } = data
      return api.addMetalink({ metalink, options })
        .then(() => {
          this.fetchList()
          // Cross-store call: clear add task options in app store
          import('@/store/app').then(({ useAppStore }) => {
            const appStore = useAppStore()
            appStore.updateAddTaskOptions({})
          })
        })
    },
    getTaskOption (gid: string): Promise<any> {
      return new Promise((resolve) => {
        api.getOption({ gid })
          .then((data: any) => {
            resolve(data)
          })
      })
    },
    changeTaskOption (payload: ChangeOptionPayload): Promise<any> {
      const { gid, options } = payload
      return api.changeOption({ gid, options })
    },
    removeTask (task: any): Promise<any> {
      const { gid } = task
      if (gid === this.currentTaskGid) {
        this.hideTaskDetail()
      }

      return api.removeTask({ gid })
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    },
    forcePauseTask (task: any): Promise<any> {
      const { gid, status } = task
      if (status !== TASK_STATUS.ACTIVE) {
        return Promise.resolve(true)
      }

      return api.forcePauseTask({ gid })
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    },
    pauseTask (task: any): Promise<any> {
      const { gid } = task
      const isBT = checkTaskIsBT(task)
      const promise = isBT ? api.forcePauseTask({ gid }) : api.pauseTask({ gid })
      promise.finally(() => {
        this.fetchList()
        this.saveSession()
      })
      return promise
    },
    resumeTask (task: any): Promise<any> {
      const { gid } = task
      return api.resumeTask({ gid })
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    },
    pauseAllTask (): Promise<any> {
      return api.pauseAllTask()
        .catch(() => {
          return api.forcePauseAllTask()
        })
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    },
    resumeAllTask (): Promise<any> {
      return api.resumeAllTask()
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    },
    addToSeedingList (gid: string): void {
      const { seedingList } = this
      if (seedingList.includes(gid)) {
        return
      }

      const list = [
        ...seedingList,
        gid
      ]
      this.seedingList = list
    },
    removeFromSeedingList (gid: string): void {
      const { seedingList } = this
      const idx = seedingList.indexOf(gid)
      if (idx === -1) {
        return
      }

      const list = [...seedingList.slice(0, idx), ...seedingList.slice(idx + 1)]
      this.seedingList = list
    },
    stopSeeding ({ gid }: { gid: string }): Promise<any> {
      const options = {
        seedTime: 0
      }
      return this.changeTaskOption({ gid, options })
    },
    removeTaskRecord (task: any): Promise<any> | undefined {
      const { gid, status } = task
      if (gid === this.currentTaskGid) {
        this.hideTaskDetail()
      }

      const { ERROR, COMPLETE, REMOVED } = TASK_STATUS
      if ([ERROR, COMPLETE, REMOVED].indexOf(status) === -1) {
        return
      }
      return api.removeTaskRecord({ gid })
        .finally(() => this.fetchList())
    },
    saveSession (): void {
      api.saveSession()
    },
    purgeTaskRecord (): Promise<any> {
      return api.purgeTaskRecord()
        .finally(() => this.fetchList())
    },
    toggleTask (task: any): Promise<any> | undefined {
      const { status } = task
      const { ACTIVE, WAITING, PAUSED } = TASK_STATUS
      if (status === ACTIVE) {
        return this.pauseTask(task)
      } else if (status === WAITING || status === PAUSED) {
        return this.resumeTask(task)
      }
    },
    batchResumeSelectedTasks (): Promise<any> | undefined {
      const gids = this.selectedGidList
      if (gids.length === 0) {
        return
      }

      return api.batchResumeTask({ gids })
    },
    batchPauseSelectedTasks (): Promise<any> | undefined {
      const gids = this.selectedGidList
      if (gids.length === 0) {
        return
      }

      return api.batchPauseTask({ gids })
    },
    batchForcePauseTask (gids: string[]): Promise<any> {
      return api.batchForcePauseTask({ gids })
    },
    batchResumeTask (gids: string[]): Promise<any> {
      return api.batchResumeTask({ gids })
    },
    batchRemoveTask (gids: string[]): Promise<any> {
      return api.batchRemoveTask({ gids })
        .finally(() => {
          this.fetchList()
          this.saveSession()
        })
    }
  }
})
