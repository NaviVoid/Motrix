import { EventEmitter } from 'node:events'
import { app } from 'electron'
import is from 'electron-is'
import { parse } from 'querystring'

import logger from './Logger'
import protocolMap from '../configs/protocol'
import { ADD_TASK_TYPE } from '@shared/constants'

interface ProtocolManagerOptions {
  protocols?: Record<string, boolean>
}

export default class ProtocolManager extends EventEmitter {
  private options: ProtocolManagerOptions
  private protocols: Record<string, boolean>

  constructor (options: ProtocolManagerOptions = {}) {
    super()
    this.options = options

    // package.json:build.protocols[].schemes[]
    // options.protocols: { 'magnet': true, 'thunder': false }
    this.protocols = {
      mo: true,
      motrix: true,
      ...options.protocols
    }

    this.init()
  }

  init (): void {
    const { protocols } = this
    this.setup(protocols)
  }

  setup (protocols: Record<string, boolean> = {}): void {
    if (is.dev() || is.mas()) {
      return
    }

    Object.keys(protocols).forEach((protocol: string) => {
      const enabled = protocols[protocol]
      if (enabled) {
        if (!app.isDefaultProtocolClient(protocol)) {
          app.setAsDefaultProtocolClient(protocol)
        }
      } else {
        app.removeAsDefaultProtocolClient(protocol)
      }
    })
  }

  handle (url: string): void {
    logger.info(`[Motrix] protocol url: ${url}`)

    if (
      url.toLowerCase().startsWith('ftp:') ||
      url.toLowerCase().startsWith('http:') ||
      url.toLowerCase().startsWith('https:') ||
      url.toLowerCase().startsWith('magnet:') ||
      url.toLowerCase().startsWith('thunder:')
    ) {
      return this.handleResourceProtocol(url)
    }

    if (
      url.toLowerCase().startsWith('mo:') ||
      url.toLowerCase().startsWith('motrix:')
    ) {
      return this.handleMoProtocol(url)
    }
  }

  handleResourceProtocol (url: string): void {
    if (!url) {
      return
    }

    (global as any).application.sendCommandToAll('application:new-task', {
      type: ADD_TASK_TYPE.URI,
      uri: url
    })
  }

  handleMoProtocol (url: string): void {
    const parsed = new URL(url)
    const { host, search } = parsed
    logger.info('[Motrix] protocol parsed:', parsed, host)

    const command = (protocolMap as Record<string, string>)[host]
    if (!command) {
      return
    }

    const query = search.startsWith('?') ? search.replace('?', '') : search
    const args = parse(query)
    ;(global as any).application.sendCommandToAll(command, args)
  }
}
