import logger from './Logger'
import {
  getEnginePath,
  getAria2BinPath,
  getAria2ConfPath,
  getSessionPath
} from '../utils'

const { platform, arch } = process

interface ContextData {
  platform: string
  arch: string
  'log-path': string
  'session-path': string
  'engine-path': string
  'aria2-bin-path': string
  'aria2-conf-path': string
  [key: string]: string
}

export default class Context {
  private context!: ContextData

  constructor () {
    this.init()
  }

  getLogPath (): string {
    const { path } = (logger.transports.file as any).getFile()
    return path
  }

  init (): void {
    // The key of Context cannot be the same as that of userConfig and systemConfig.
    this.context = {
      platform: platform,
      arch: arch,
      'log-path': this.getLogPath(),
      'session-path': getSessionPath(),
      'engine-path': getEnginePath(platform, arch),
      'aria2-bin-path': getAria2BinPath(platform, arch),
      'aria2-conf-path': getAria2ConfPath(platform, arch)
    }

    logger.info('[Motrix] Context.init===>', this.context)
  }

  get (key?: string): ContextData | string | undefined {
    if (typeof key === 'undefined') {
      return this.context
    }

    return this.context[key]
  }
}
