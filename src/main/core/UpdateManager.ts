import { EventEmitter } from 'node:events'
import { resolve } from 'node:path'
import { dialog } from 'electron'
import is from 'electron-is'
import { autoUpdater } from 'electron-updater'
import type { AppUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'

import { PROXY_SCOPES } from '@shared/constants'
import logger from './Logger'
import { getI18n } from '../ui/Locale'

import type { i18n } from 'i18next'

if (is.dev()) {
  autoUpdater.updateConfigPath = resolve(__dirname, '../../../app-update.yml')
}

interface UpdateManagerOptions {
  autoCheck?: boolean
  proxy?: any
}

interface AutoCheckData {
  checkEnable: boolean
  userCheck: boolean
}

export default class UpdateManager extends EventEmitter {
  private options: UpdateManagerOptions
  private i18n: i18n
  isChecking: boolean
  private updater: AppUpdater
  private autoCheckData: AutoCheckData

  constructor (options: UpdateManagerOptions = {}) {
    super()
    this.options = options
    this.i18n = getI18n()

    this.isChecking = false
    this.updater = autoUpdater
    this.updater.autoDownload = false
    this.updater.autoInstallOnAppQuit = false
    this.updater.logger = logger as any
    logger.info('[Motrix] setup proxy:', this.options.proxy)
    this.setupProxy(this.options.proxy)

    this.autoCheckData = {
      checkEnable: !!this.options.autoCheck,
      userCheck: false
    }
    this.init()
  }

  setupProxy (proxy: any): void {
    const { enable, server, scope = [] } = proxy || {}
    if (!enable || !server || !scope.includes(PROXY_SCOPES.UPDATE_APP)) {
      (this.updater as any).netSession.setProxy({
        proxyRules: undefined
      })
      return
    }

    const url = new URL(server)
    const { username, password, protocol = 'http:', host, port } = url
    const proxyRules = `${protocol}//${host}`

    logger.info(`[Motrix] setup proxy: ${proxyRules}`, username, password, protocol, host, port)
    ;(this.updater as any).netSession.setProxy({
      proxyRules
    })

    if (server.includes('@')) {
      (this.updater as any).signals.login((_authInfo: any, callback: (username: string, password: string) => void) => {
        callback(username, password)
      })
    }
  }

  init (): void {
    // Event: error
    // Event: checking-for-update
    // Event: update-available
    // Event: update-not-available
    // Event: download-progress
    // Event: update-downloaded

    this.updater.on('checking-for-update', this.checkingForUpdate.bind(this))
    this.updater.on('update-available', this.updateAvailable.bind(this))
    this.updater.on('update-not-available', this.updateNotAvailable.bind(this))
    this.updater.on('download-progress', this.updateDownloadProgress.bind(this))
    this.updater.on('update-downloaded', this.updateDownloaded.bind(this))
    this.updater.on('update-cancelled', this.updateCancelled.bind(this))
    this.updater.on('error', this.updateError.bind(this))

    if (this.autoCheckData.checkEnable && !this.isChecking) {
      this.autoCheckData.userCheck = false
      this.updater.checkForUpdates()
    }
  }

  check (): void {
    this.autoCheckData.userCheck = true
    this.updater.checkForUpdates()
  }

  checkingForUpdate (): void {
    this.isChecking = true
    this.emit('checking')
  }

  updateAvailable (event: any, info?: UpdateInfo): void {
    this.emit('update-available', info)
    dialog.showMessageBox({
      type: 'info',
      title: this.i18n.t('app.check-for-updates-title'),
      message: this.i18n.t('app.update-available-message'),
      buttons: [this.i18n.t('app.yes'), this.i18n.t('app.no')],
      cancelId: 1
    }).then(({ response }: { response: number }) => {
      if (response === 0) {
        this.updater.downloadUpdate()
      } else {
        this.emit('update-cancelled', info)
      }
    })
  }

  updateNotAvailable (event: any, info?: UpdateInfo): void {
    this.isChecking = false
    this.emit('update-not-available', info)
    if (this.autoCheckData.userCheck) {
      dialog.showMessageBox({
        title: this.i18n.t('app.check-for-updates-title'),
        message: this.i18n.t('app.update-not-available-message')
      })
    }
  }

  /**
   * autoUpdater:download-progress
   * @param {Object} event
   * progress,
   * bytesPerSecond,
   * percent,
   * total,
   * transferred
   */
  updateDownloadProgress (event: ProgressInfo): void {
    this.emit('download-progress', event)
  }

  updateDownloaded (event: any, info?: UpdateInfo): void {
    this.emit('update-downloaded', info)
    this.updater.logger!.log!(`Update Downloaded: ${info}`)
    dialog.showMessageBox({
      title: this.i18n.t('app.check-for-updates-title'),
      message: this.i18n.t('app.update-downloaded-message')
    }).then((_: any) => {
      this.isChecking = false
      this.emit('will-updated')
      setTimeout(() => {
        this.updater.quitAndInstall()
      }, 200)
    })
  }

  updateCancelled (): void {
    this.isChecking = false
  }

  updateError (event: any, error?: Error): void {
    this.isChecking = false
    this.emit('update-error', error)
    const msg = (error == null)
      ? this.i18n.t('app.update-error-message')
      : (error.stack || error).toString()

    this.updater.logger!.warn!(`[Motrix] update-error: ${msg}`)
    dialog.showErrorBox('Error', msg)
  }
}
