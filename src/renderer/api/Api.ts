import is from 'electron-is'
import { isEmpty, clone } from 'lodash'
import { Aria2 } from '@shared/aria2'
import {
  separateConfig,
  compactUndefined,
  formatOptionsForEngine,
  mergeTaskResult,
  changeKeysToCamelCase,
  changeKeysToKebabCase
} from '@shared/utils'
import { ENGINE_RPC_HOST } from '@shared/constants'

interface ApiOptions {
  [key: string]: any
}

interface FetchTaskListParams {
  type?: string
  offset?: number
  num?: number
  keys?: string[]
}

interface TaskItemParams {
  gid?: string
  keys?: string[]
}

interface AddUriParams {
  uris: string[]
  outs?: string[]
  options?: Record<string, any>
}

interface AddTorrentParams {
  torrent: string
  options?: Record<string, any>
}

interface AddMetalinkParams {
  metalink: string
  options?: Record<string, any>
}

interface ChangeOptionParams {
  gid?: string
  options?: Record<string, any>
}

interface GidParams {
  gid?: string
}

interface MulticallParams {
  gids: string[]
  options?: Record<string, any>
}

interface SeparatedConfig {
  user: Record<string, any>
  system: Record<string, any>
  others: Record<string, any>
}

export default class Api {
  options: ApiOptions
  config: Record<string, any>
  client: any

  constructor (options: ApiOptions = {}) {
    this.options = options
    this.config = {}
    this.client = null

    this.init()
  }

  async init (): Promise<void> {
    this.config = await this.loadConfig()

    this.client = this.initClient()
    this.client.open()
  }

  loadConfigFromLocalStorage (): Record<string, any> {
    // TODO
    const result: Record<string, any> = {}
    return result
  }

  async loadConfigFromNativeStore (): Promise<Record<string, any>> {
    const result = await window.electronAPI.invoke('get-app-config')
    return result
  }

  async loadConfig (): Promise<Record<string, any>> {
    let result = is.renderer()
      ? await this.loadConfigFromNativeStore()
      : this.loadConfigFromLocalStorage()

    result = changeKeysToCamelCase(result)
    return result
  }

  initClient (): any {
    const {
      rpcListenPort: port,
      rpcSecret: secret
    } = this.config
    const host = ENGINE_RPC_HOST
    return new Aria2({
      host,
      port,
      secret
    })
  }

  closeClient (): void {
    this.client.close()
      .then(() => {
        this.client = null
      })
      .catch((err: Error) => {
        console.log('engine client close fail', err)
      })
  }

  async fetchPreference (): Promise<Record<string, any>> {
    this.config = await this.loadConfig()
    return this.config
  }

  savePreference (params: Record<string, any> = {}): Promise<void> | undefined {
    const kebabParams = changeKeysToKebabCase(params)
    if (is.renderer()) {
      return this.savePreferenceToNativeStore(kebabParams)
    } else {
      return this.savePreferenceToLocalStorage(kebabParams)
    }
  }

  savePreferenceToLocalStorage (_params?: Record<string, any>): undefined {
    // TODO
  }

  savePreferenceToNativeStore (params: Record<string, any> = {}): void {
    const { user, system, others } = separateConfig(params) as SeparatedConfig
    const config: Record<string, any> = {}

    if (!isEmpty(user)) {
      console.info('[Motrix] save user config: ', user)
      config.user = user
    }

    if (!isEmpty(system)) {
      console.info('[Motrix] save system config: ', system)
      config.system = system
      this.updateActiveTaskOption(system)
    }

    if (!isEmpty(others)) {
      console.info('[Motrix] save config found illegal key: ', others)
    }

    window.electronAPI.sendCommand('application:save-preference', config)
  }

  getVersion (): Promise<any> {
    return this.client.call('getVersion')
  }

  changeGlobalOption (options: Record<string, any>): Promise<any> {
    const args = formatOptionsForEngine(options)

    return this.client.call('changeGlobalOption', args)
  }

  getGlobalOption (): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      this.client.call('getGlobalOption')
        .then((data: Record<string, any>) => {
          resolve(changeKeysToCamelCase(data))
        })
    })
  }

  getOption (params: GidParams = {}): Promise<Record<string, any>> {
    const { gid } = params
    const args = compactUndefined([gid])

    return new Promise((resolve) => {
      this.client.call('getOption', ...args)
        .then((data: Record<string, any>) => {
          resolve(changeKeysToCamelCase(data))
        })
    })
  }

  updateActiveTaskOption (options: Record<string, any>): void {
    this.fetchTaskList({ type: 'active' })
      .then((data: any[]) => {
        if (isEmpty(data)) {
          return
        }

        const gids = data.map((task: any) => task.gid)
        this.batchChangeOption({ gids, options })
      })
  }

  changeOption (params: ChangeOptionParams = {}): Promise<any> {
    const { gid, options = {} } = params

    const engineOptions = formatOptionsForEngine(options)
    const args = compactUndefined([gid, engineOptions])

    return this.client.call('changeOption', ...args)
  }

  getGlobalStat (): Promise<any> {
    return this.client.call('getGlobalStat')
  }

  addUri (params: AddUriParams): Promise<any> {
    const {
      uris,
      outs,
      options
    } = params
    const tasks = uris.map((uri: string, index: number) => {
      const engineOptions = formatOptionsForEngine(options)
      if (outs && outs[index]) {
        engineOptions.out = outs[index]
      }
      const args = compactUndefined([[uri], engineOptions])
      return ['aria2.addUri', ...args]
    })
    return this.client.multicall(tasks)
  }

  addTorrent (params: AddTorrentParams): Promise<any> {
    const {
      torrent,
      options
    } = params
    const engineOptions = formatOptionsForEngine(options)
    const args = compactUndefined([torrent, [], engineOptions])
    return this.client.call('addTorrent', ...args)
  }

  addMetalink (params: AddMetalinkParams): Promise<any> {
    const {
      metalink,
      options
    } = params
    const engineOptions = formatOptionsForEngine(options)
    const args = compactUndefined([metalink, engineOptions])
    return this.client.call('addMetalink', ...args)
  }

  fetchDownloadingTaskList (params: FetchTaskListParams = {}): Promise<any[]> {
    const { offset = 0, num = 20, keys } = params
    const activeArgs = compactUndefined([keys])
    const waitingArgs = compactUndefined([offset, num, keys])
    return new Promise((resolve, reject) => {
      this.client.multicall([
        ['aria2.tellActive', ...activeArgs],
        ['aria2.tellWaiting', ...waitingArgs]
      ]).then((data: any[][]) => {
        console.log('[Motrix] fetch downloading task list data:', data)
        const result = mergeTaskResult(data)
        resolve(result)
      }).catch((err: Error) => {
        console.log('[Motrix] fetch downloading task list fail:', err)
        reject(err)
      })
    })
  }

  fetchWaitingTaskList (params: FetchTaskListParams = {}): Promise<any[]> {
    const { offset = 0, num = 20, keys } = params
    const args = compactUndefined([offset, num, keys])
    return this.client.call('tellWaiting', ...args)
  }

  fetchStoppedTaskList (params: FetchTaskListParams = {}): Promise<any[]> {
    const { offset = 0, num = 20, keys } = params
    const args = compactUndefined([offset, num, keys])
    return this.client.call('tellStopped', ...args)
  }

  fetchActiveTaskList (params: FetchTaskListParams = {}): Promise<any[]> {
    const { keys } = params
    const args = compactUndefined([keys])
    return this.client.call('tellActive', ...args)
  }

  fetchTaskList (params: FetchTaskListParams = {}): Promise<any[]> {
    const { type } = params
    switch (type) {
    case 'active':
      return this.fetchDownloadingTaskList(params)
    case 'waiting':
      return this.fetchWaitingTaskList(params)
    case 'stopped':
      return this.fetchStoppedTaskList(params)
    default:
      return this.fetchDownloadingTaskList(params)
    }
  }

  fetchTaskItem (params: TaskItemParams = {}): Promise<any> {
    const { gid, keys } = params
    const args = compactUndefined([gid, keys])
    return this.client.call('tellStatus', ...args)
  }

  fetchTaskItemWithPeers (params: TaskItemParams = {}): Promise<any> {
    const { gid, keys } = params
    const statusArgs = compactUndefined([gid, keys])
    const peersArgs = compactUndefined([gid])
    return new Promise((resolve, reject) => {
      this.client.multicall([
        ['aria2.tellStatus', ...statusArgs],
        ['aria2.getPeers', ...peersArgs]
      ]).then((data: any[][]) => {
        console.log('[Motrix] fetchTaskItemWithPeers:', data)
        const result = data[0] && data[0][0]
        const peers = data[1] && data[1][0]
        result.peers = peers || []
        console.log('[Motrix] fetchTaskItemWithPeers.result:', result)
        console.log('[Motrix] fetchTaskItemWithPeers.peers:', peers)

        resolve(result)
      }).catch((err: Error) => {
        console.log('[Motrix] fetch downloading task list fail:', err)
        reject(err)
      })
    })
  }

  fetchTaskItemPeers (params: TaskItemParams = {}): Promise<any> {
    const { gid, keys } = params
    const args = compactUndefined([gid, keys])
    return this.client.call('getPeers', ...args)
  }

  pauseTask (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('pause', ...args)
  }

  pauseAllTask (_params: Record<string, any> = {}): Promise<any> {
    return this.client.call('pauseAll')
  }

  forcePauseTask (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('forcePause', ...args)
  }

  forcePauseAllTask (_params: Record<string, any> = {}): Promise<any> {
    return this.client.call('forcePauseAll')
  }

  resumeTask (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('unpause', ...args)
  }

  resumeAllTask (_params: Record<string, any> = {}): Promise<any> {
    return this.client.call('unpauseAll')
  }

  removeTask (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('remove', ...args)
  }

  forceRemoveTask (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('forceRemove', ...args)
  }

  saveSession (_params: Record<string, any> = {}): Promise<any> {
    return this.client.call('saveSession')
  }

  purgeTaskRecord (_params: Record<string, any> = {}): Promise<any> {
    return this.client.call('purgeDownloadResult')
  }

  removeTaskRecord (params: GidParams = {}): Promise<any> {
    const { gid } = params
    const args = compactUndefined([gid])
    return this.client.call('removeDownloadResult', ...args)
  }

  multicall (method: string, params: MulticallParams = { gids: [] }): Promise<any> {
    let { gids, options = {} } = params
    options = formatOptionsForEngine(options)

    const data = gids.map((gid: string, _index: number) => {
      const _options = clone(options)
      const args = compactUndefined([gid, _options])
      return [method, ...args]
    })
    return this.client.multicall(data)
  }

  batchChangeOption (params: MulticallParams = { gids: [] }): Promise<any> {
    return this.multicall('aria2.changeOption', params)
  }

  batchRemoveTask (params: MulticallParams = { gids: [] }): Promise<any> {
    return this.multicall('aria2.remove', params)
  }

  batchResumeTask (params: MulticallParams = { gids: [] }): Promise<any> {
    return this.multicall('aria2.unpause', params)
  }

  batchPauseTask (params: MulticallParams = { gids: [] }): Promise<any> {
    return this.multicall('aria2.pause', params)
  }

  batchForcePauseTask (params: MulticallParams = { gids: [] }): Promise<any> {
    return this.multicall('aria2.forcePause', params)
  }
}
