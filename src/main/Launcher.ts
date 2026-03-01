import { EventEmitter } from 'node:events'
import { app } from 'electron'
import is from 'electron-is'

import ExceptionHandler from './core/ExceptionHandler'
import logger from './core/Logger'
import Application from './Application'
import {
  splitArgv,
  parseArgvAsUrl,
  parseArgvAsFile
} from './utils'
import { EMPTY_STRING } from '@shared/constants'

export default class Launcher extends EventEmitter {
  private url: string
  private file: string
  private exceptionHandler!: ExceptionHandler
  private openedAtLogin: boolean

  constructor () {
    super()
    this.url = EMPTY_STRING
    this.file = EMPTY_STRING
    this.openedAtLogin = false

    this.makeSingleInstance(() => {
      this.init()
    })
  }

  makeSingleInstance (callback: (() => void) | null): void {
    // Mac App Store Sandboxed App not support requestSingleInstanceLock
    if (is.mas()) {
      callback && callback()
      return
    }

    const gotSingleLock = app.requestSingleInstanceLock()

    if (!gotSingleLock) {
      app.quit()
    } else {
      app.on('second-instance', (_event: Event, argv: string[], _workingDirectory: string) => {
        ;(global as any).application.showPage('index')
        if (!is.macOS() && argv.length > 1) {
          this.handleAppLaunchArgv(argv)
        }
      })

      callback && callback()
    }
  }

  init (): void {
    this.exceptionHandler = new ExceptionHandler()

    this.openedAtLogin = is.macOS()
      ? app.getLoginItemSettings().wasOpenedAtLogin
      : false

    if (process.argv.length > 1) {
      this.handleAppLaunchArgv(process.argv)
    }

    logger.info('[Motrix] openedAtLogin:', this.openedAtLogin)

    this.handleAppEvents()
  }

  handleAppEvents (): void {
    this.handleOpenUrl()
    this.handleOpenFile()

    this.handelAppReady()
    this.handleAppWillQuit()
  }

  /**
   * handleOpenUrl
   * Event 'open-url' macOS only
   * "name": "Motrix Protocol",
   * "schemes": ["mo", "motrix"]
   */
  handleOpenUrl (): void {
    if (is.mas() || !is.macOS()) {
      return
    }
    app.on('open-url', (event: Event, url: string) => {
      logger.info(`[Motrix] open-url: ${url}`)
      event.preventDefault()
      this.url = url
      this.sendUrlToApplication()
    })
  }

  /**
   * handleOpenFile
   * Event 'open-file' macOS only
   * handle open torrent file
   */
  handleOpenFile (): void {
    if (!is.macOS()) {
      return
    }
    app.on('open-file', (event: Event, path: string) => {
      logger.info(`[Motrix] open-file: ${path}`)
      event.preventDefault()
      this.file = path
      this.sendFileToApplication()
    })
  }

  /**
   * handleAppLaunchArgv
   * For Windows, Linux
   */
  handleAppLaunchArgv (argv: string[]): void {
    logger.info('[Motrix] handleAppLaunchArgv:', argv)

    // args: array, extra: map
    const { args, extra } = splitArgv(argv)
    logger.info('[Motrix] split argv args:', args)
    logger.info('[Motrix] split argv extra:', extra)
    if (extra['--opened-at-login'] === '1') {
      this.openedAtLogin = true
    }

    const file = parseArgvAsFile(args)
    if (file) {
      this.file = file
      this.sendFileToApplication()
    }

    const url = parseArgvAsUrl(args)
    if (url) {
      this.url = url
      this.sendUrlToApplication()
    }
  }

  sendUrlToApplication (): void {
    if (this.url && (global as any).application && (global as any).application.isReady) {
      ;(global as any).application.handleProtocol(this.url)
      this.url = EMPTY_STRING
    }
  }

  sendFileToApplication (): void {
    if (this.file && (global as any).application && (global as any).application.isReady) {
      ;(global as any).application.handleFile(this.file)
      this.file = EMPTY_STRING
    }
  }

  handelAppReady (): void {
    app.on('ready', () => {
      ;(global as any).application = new Application()

      const { openedAtLogin } = this
      ;(global as any).application.start('index', {
        openedAtLogin
      })

      ;(global as any).application.on('ready', () => {
        this.sendUrlToApplication()

        this.sendFileToApplication()
      })
    })

    app.on('activate', () => {
      if ((global as any).application) {
        logger.info('[Motrix] activate')
        ;(global as any).application.showPage('index')
      }
    })
  }

  handleAppWillQuit (): void {
    app.on('will-quit', () => {
      logger.info('[Motrix] will-quit')
      if ((global as any).application) {
        logger.info('[Motrix] will-quit.application.stop')
        ;(global as any).application.stop()
      }
    })
  }
}
