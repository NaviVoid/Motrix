'use strict'

import { Aria2 } from '@shared/aria2'

import logger from './Logger'
import {
  compactUndefined,
  formatOptionsForEngine
} from '@shared/utils'
import {
  ENGINE_RPC_HOST,
  ENGINE_RPC_PORT,
  EMPTY_STRING
} from '@shared/constants'

interface EngineClientOptions {
  host: string
  port: number
  secret: string
}

interface ShutdownOptions {
  force?: boolean
}

const defaults: EngineClientOptions = {
  host: ENGINE_RPC_HOST,
  port: ENGINE_RPC_PORT,
  secret: EMPTY_STRING
}

export default class EngineClient {
  static instance: EngineClient | null = null
  static client: Aria2 | null = null

  private options: EngineClientOptions
  private client!: Aria2

  constructor (options: Partial<EngineClientOptions> = {}) {
    this.options = {
      ...defaults,
      ...options
    } as EngineClientOptions

    this.init()
  }

  init (): void {
    this.connect()
  }

  connect (): void {
    logger.info('[Motrix] main engine client connect', this.options)
    const { host, port, secret } = this.options
    this.client = new Aria2({
      host,
      port,
      secret
    })
  }

  async call (method: string, ...args: any[]): Promise<any> {
    return this.client.call(method, ...args).catch((err: Error) => {
      logger.warn('[Motrix] call client fail:', err.message)
    })
  }

  async changeGlobalOption (options: Record<string, any>): Promise<any> {
    logger.info('[Motrix] change engine global option:', options)
    const args = formatOptionsForEngine(options)

    return this.call('changeGlobalOption', args)
  }

  async shutdown (options: ShutdownOptions = {}): Promise<any> {
    const { force = false } = options
    const { secret } = this.options

    const method = force ? 'forceShutdown' : 'shutdown'
    const args = compactUndefined([secret])
    return this.call(method, ...args)
  }
}
