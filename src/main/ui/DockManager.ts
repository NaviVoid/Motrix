import is from 'electron-is'
import { EventEmitter } from 'node:events'
import { app } from 'electron'

import { bytesToSize } from '@shared/utils'

import {
  APP_RUN_MODE
} from '@shared/constants'

const enabled: boolean = is.macOS()

interface DockManagerOptions {
  runMode?: string
}

interface SpeedData {
  downloadSpeed: number
}

export default class DockManager extends EventEmitter {
  private options: DockManagerOptions

  constructor (options: DockManagerOptions) {
    super()
    this.options = options
    const { runMode } = this.options
    if (runMode === APP_RUN_MODE.TRAY) {
      this.hide()
    }
  }

  show = enabled
    ? (): Promise<void> | void => {
      if (app.dock.isVisible()) {
        return
      }

      return app.dock.show()
    }
    : (): void => {}

  hide = enabled
    ? (): void => {
      if (!app.dock.isVisible()) {
        return
      }

      app.dock.hide()
    }
    : (): void => {}

  // macOS setBadge not working
  // @see https://github.com/electron/electron/issues/25745#issuecomment-702826143
  setBadge = enabled
    ? (text: string): void => {
      app.dock.setBadge(text)
    }
    : (_text: string): void => {}

  handleSpeedChange = enabled
    ? (speed: SpeedData): void => {
      const { downloadSpeed } = speed
      const text = downloadSpeed > 0 ? `${bytesToSize(downloadSpeed)}/s` : ''
      this.setBadge(text)
    }
    : (_speed: SpeedData): void => {}

  openDock = enabled
    ? (path: string): void => {
      app.dock.downloadFinished(path)
    }
    : (_path: string): void => {}
}
