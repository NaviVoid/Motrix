import NatAPI from '@motrix/nat-api'

import logger from './Logger'

let client: any = null
const mappingStatus: Record<number, boolean> = {}

interface UPnPManagerOptions {
  [key: string]: any
}

export default class UPnPManager {
  private options: UPnPManagerOptions

  constructor (options: UPnPManagerOptions = {}) {
    this.options = {
      ...options
    }
  }

  init (): void {
    if (client) {
      return
    }

    client = new NatAPI({
      autoUpdate: true
    })
  }

  map (port: number): Promise<void> {
    this.init()

    return new Promise((resolve, reject) => {
      logger.info('[Motrix] UPnPManager port mapping: ', port)
      if (!port) {
        reject(new Error('[Motrix] port was not specified'))
        return
      }

      try {
        client.map(port, (err: Error | null) => {
          if (err) {
            logger.warn(`[Motrix] UPnPManager map ${port} failed, error: `, err.message)
            reject(err.message)
            return
          }

          mappingStatus[port] = true
          logger.info(`[Motrix] UPnPManager port ${port} mapping succeeded`)
          resolve()
        })
      } catch (err: any) {
        reject(err.message)
      }
    })
  }

  unmap (port: number): Promise<void> {
    this.init()

    return new Promise((resolve, reject) => {
      logger.info('[Motrix] UPnPManager port unmapping: ', port)
      if (!port) {
        reject(new Error('[Motrix] port was not specified'))
        return
      }

      if (!mappingStatus[port]) {
        resolve()
        return
      }

      try {
        client.unmap(port, (err: Error | null) => {
          if (err) {
            logger.warn(`[Motrix] UPnPManager unmap ${port} failed, error: `, err)
            reject(err.message)
            return
          }

          logger.info(`[Motrix] UPnPManager port ${port} unmapping succeeded`)
          mappingStatus[port] = false
          resolve()
        })
      } catch (err: any) {
        reject(err.message)
      }
    })
  }

  closeClient (): void {
    if (!client) {
      return
    }

    try {
      client.destroy(() => {
        client = null
      })
    } catch (err) {
      logger.warn('[Motrix] close UPnP client fail', err)
    }
  }
}
