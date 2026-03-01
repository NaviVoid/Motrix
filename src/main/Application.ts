import { EventEmitter } from 'node:events'
import { readFile, unlink } from 'node:fs'
import { extname, basename } from 'node:path'
import { app, shell, dialog, ipcMain } from 'electron'
import type { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import is from 'electron-is'
import { isEmpty, isEqual } from 'lodash'

import type { i18n } from 'i18next'

import {
  APP_RUN_MODE,
  AUTO_SYNC_TRACKER_INTERVAL,
  AUTO_CHECK_UPDATE_INTERVAL,
  PROXY_SCOPES
} from '@shared/constants'
import { checkIsNeedRun } from '@shared/utils'
import {
  convertTrackerDataToComma,
  fetchBtTrackerFromSource,
  reduceTrackerString
} from '@shared/utils/tracker'
import { showItemInFolder } from './utils'
import logger from './core/Logger'
import Context from './core/Context'
import ConfigManager from './core/ConfigManager'
import { setupLocaleManager } from './ui/Locale'
import Engine from './core/Engine'
import EngineClient from './core/EngineClient'
import UPnPManager from './core/UPnPManager'
import AutoLaunchManager from './core/AutoLaunchManager'
import UpdateManager from './core/UpdateManager'
import EnergyManager from './core/EnergyManager'
import ProtocolManager from './core/ProtocolManager'
import { registerIpcHandlers } from './core/IpcHandlers'
import WindowManager from './ui/WindowManager'
import MenuManager from './ui/MenuManager'
import TouchBarManager from './ui/TouchBarManager'
import TrayManager from './ui/TrayManager'
import DockManager from './ui/DockManager'
import ThemeManager from './ui/ThemeManager'

import type LocaleManager from '@shared/locales/LocaleManager'

interface PreferenceConfig {
  system?: Record<string, any>
  user?: Record<string, any>
}

interface WindowStateData {
  page: string
  bounds: Electron.Rectangle
}

interface SpeedData {
  uploadSpeed: number
  downloadSpeed: number
}

export default class Application extends EventEmitter {
  isReady: boolean
  private context!: Context
  private configManager!: ConfigManager
  private configListeners!: Record<string, () => void>
  private locale!: string
  private localeManager!: LocaleManager
  private i18n!: i18n
  private menuManager!: MenuManager
  private windowManager!: WindowManager
  private upnp!: UPnPManager
  private engine!: Engine
  private engineClient!: EngineClient
  private themeManager!: ThemeManager
  private trayManager!: TrayManager
  private touchBarManager!: TouchBarManager
  private dockManager!: DockManager
  private autoLaunchManager!: AutoLaunchManager
  private energyManager!: EnergyManager
  private protocolManager!: ProtocolManager
  private updateManager!: UpdateManager

  constructor () {
    super()
    this.isReady = false
    this.init()
  }

  init (): void {
    this.initContext()

    this.initConfigManager()

    this.setupLogger()

    this.initLocaleManager()

    registerIpcHandlers()

    this.setupApplicationMenu()

    this.initWindowManager()

    this.initUPnPManager()

    this.startEngine()

    this.initEngineClient()

    this.initThemeManager()

    this.initTrayManager()

    this.initTouchBarManager()

    this.initDockManager()

    this.initAutoLaunchManager()

    this.initEnergyManager()

    this.initProtocolManager()

    this.initUpdaterManager()

    this.handleCommands()

    this.handleEvents()

    this.handleIpcMessages()

    this.handleIpcInvokes()

    this.emit('application:initialized')
  }

  initContext (): void {
    this.context = new Context()
  }

  initConfigManager (): void {
    this.configListeners = {}
    this.configManager = new ConfigManager()
  }

  offConfigListeners (): void {
    try {
      Object.keys(this.configListeners).forEach((key: string) => {
        this.configListeners[key]()
      })
    } catch (e) {
      logger.warn('[Motrix] offConfigListeners===>', e)
    }
    this.configListeners = {}
  }

  setupLogger (): void {
    const { userConfig } = this.configManager
    const key = 'log-level'
    const logLevel = userConfig.get(key)
    ;(logger.transports.file as any).level = logLevel

    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: any, oldValue: any) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      ;(logger.transports.file as any).level = newValue
    })
  }

  initLocaleManager (): void {
    this.locale = this.configManager.getLocale()
    this.localeManager = setupLocaleManager(this.locale)
    this.i18n = this.localeManager.getI18n()
  }

  setupApplicationMenu (): void {
    this.menuManager = new MenuManager()
    this.menuManager.setup(this.locale)
  }

  adjustMenu (): void {
    if (is.mas()) {
      const visibleStates: Record<string, boolean> = {
        'app.check-for-updates': false,
        'task.new-bt-task': false
      }
      this.menuManager.updateMenuStates(visibleStates, null, null)
      this.trayManager.updateMenuStates(visibleStates, null, null)
    }
  }

  startEngine (): void {
    const self = this

    try {
      this.engine = new Engine({
        systemConfig: this.configManager.getSystemConfig(),
        userConfig: this.configManager.getUserConfig()
      })
      this.engine.start()
    } catch (err: any) {
      const { message } = err
      dialog.showMessageBox({
        type: 'error',
        title: this.i18n.t('app.system-error-title'),
        message: this.i18n.t('app.system-error-message', { message })
      }).then((_: any) => {
        setTimeout(() => {
          self.quit()
        }, 100)
      })
    }
  }

  async stopEngine (): Promise<void> {
    logger.info('[Motrix] stopEngine===>')
    try {
      await this.engineClient.shutdown({ force: true })
      logger.info('[Motrix] stopEngine.setImmediate===>')
      setImmediate(() => {
        this.engine.stop()
      })
    } catch (err: any) {
      logger.warn('[Motrix] shutdown engine fail: ', err.message)
    } finally {
      // no finally
    }
  }

  initEngineClient (): void {
    const port = this.configManager.getSystemConfig('rpc-listen-port')
    const secret = this.configManager.getSystemConfig('rpc-secret')
    this.engineClient = new EngineClient({
      port,
      secret
    })
  }

  initAutoLaunchManager (): void {
    this.autoLaunchManager = new AutoLaunchManager()
  }

  initEnergyManager (): void {
    this.energyManager = new EnergyManager()
  }

  initTrayManager (): void {
    this.trayManager = new TrayManager({
      theme: this.configManager.getUserConfig('tray-theme'),
      systemTheme: this.themeManager.getSystemTheme(),
      speedometer: this.configManager.getUserConfig('tray-speedometer'),
      runMode: this.configManager.getUserConfig('run-mode')
    })

    this.watchTraySpeedometerEnabledChange()

    this.trayManager.on('mouse-down', ({ focused }: { focused: boolean }) => {
      this.sendCommandToAll('application:update-tray-focused', { focused })
    })

    this.trayManager.on('mouse-up', ({ focused }: { focused: boolean }) => {
      this.sendCommandToAll('application:update-tray-focused', { focused })
    })

    this.trayManager.on('drop-files', (files: string[] = []) => {
      this.handleFile(files[0])
    })

    this.trayManager.on('drop-text', (text: string) => {
      this.handleProtocol(text)
    })
  }

  watchTraySpeedometerEnabledChange (): void {
    const { userConfig } = this.configManager
    const key = 'tray-speedometer'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: boolean, oldValue: boolean) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      this.trayManager.handleSpeedometerEnableChange(newValue)
    })
  }

  initDockManager (): void {
    this.dockManager = new DockManager({
      runMode: this.configManager.getUserConfig('run-mode')
    })
  }

  watchOpenAtLoginChange (): void {
    const { userConfig } = this.configManager
    const key = 'open-at-login'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: boolean, oldValue: boolean) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      if (is.linux()) {
        return
      }

      if (newValue) {
        this.autoLaunchManager.enable()
      } else {
        this.autoLaunchManager.disable()
      }
    })
  }

  watchProtocolsChange (): void {
    const { userConfig } = this.configManager
    const key = 'protocols'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: Record<string, boolean>, oldValue: Record<string, boolean>) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)

      if (!newValue || isEqual(newValue, oldValue)) {
        return
      }

      logger.info('[Motrix] setup protocols client:', newValue)
      this.protocolManager.setup(newValue)
    })
  }

  watchRunModeChange (): void {
    const { userConfig } = this.configManager
    const key = 'run-mode'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: string, oldValue: string) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      this.trayManager.handleRunModeChange(newValue)

      if (newValue !== APP_RUN_MODE.TRAY) {
        this.dockManager.show()
      } else {
        this.dockManager.hide()
        // Hiding the dock icon will trigger the entire app to hide.
        this.show()
      }
    })
  }

  watchProxyChange (): void {
    const { userConfig } = this.configManager
    const key = 'proxy'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: any, oldValue: any) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      this.updateManager.setupProxy(newValue)

      const { enable, server, bypass, scope = [] } = newValue
      const system = enable && server && scope.includes(PROXY_SCOPES.DOWNLOAD)
        ? {
          'all-proxy': server,
          'no-proxy': bypass
        }
        : {}
      this.configManager.setSystemConfig(system)
      this.engineClient.call('changeGlobalOption', system)
    })
  }

  watchLocaleChange (): void {
    const { userConfig } = this.configManager
    const key = 'locale'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: string, oldValue: string) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      this.localeManager.changeLanguageByLocale(newValue)
        .then(() => {
          this.menuManager.handleLocaleChange(newValue)
          this.trayManager.handleLocaleChange(newValue)
        })
      this.sendCommandToAll('application:update-locale', { locale: newValue })
    })
  }

  watchThemeChange (): void {
    const { userConfig } = this.configManager
    const key = 'theme'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: string, oldValue: string) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)
      this.themeManager.updateSystemTheme(newValue)
      this.sendCommandToAll('application:update-theme', { theme: newValue })
    })
  }

  watchShowProgressBarChange (): void {
    const { userConfig } = this.configManager
    const key = 'show-progress-bar'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: boolean, oldValue: boolean) => {
      logger.info(`[Motrix] detected ${key} value change event:`, newValue, oldValue)

      if (newValue) {
        this.bindProgressChange()
      } else {
        this.unbindProgressChange()
      }
    })
  }

  initUPnPManager (): void {
    this.upnp = new UPnPManager()

    this.watchUPnPEnabledChange()

    this.watchUPnPPortsChange()

    const enabled = this.configManager.getUserConfig('enable-upnp')
    if (!enabled) {
      return
    }

    this.startUPnPMapping()
  }

  async startUPnPMapping (): Promise<void> {
    const btPort = this.configManager.getSystemConfig('listen-port')
    const dhtPort = this.configManager.getSystemConfig('dht-listen-port')

    const promises = [
      this.upnp.map(btPort),
      this.upnp.map(dhtPort)
    ]
    try {
      await Promise.allSettled(promises)
    } catch (e: any) {
      logger.warn('[Motrix] start UPnP mapping fail', e.message)
    }
  }

  async stopUPnPMapping (): Promise<void> {
    const btPort = this.configManager.getSystemConfig('listen-port')
    const dhtPort = this.configManager.getSystemConfig('dht-listen-port')

    const promises = [
      this.upnp.unmap(btPort),
      this.upnp.unmap(dhtPort)
    ]
    try {
      await Promise.allSettled(promises)
    } catch (e) {
      logger.warn('[Motrix] stop UPnP mapping fail', e)
    }
  }

  watchUPnPPortsChange (): void {
    const { systemConfig } = this.configManager
    const watchKeys = ['listen-port', 'dht-listen-port']

    watchKeys.forEach((key: string) => {
      this.configListeners[key] = (systemConfig as any).onDidChange(key, async (newValue: number, oldValue: number) => {
        logger.info('[Motrix] detected port change event:', key, newValue, oldValue)
        const enable = this.configManager.getUserConfig('enable-upnp')
        if (!enable) {
          return
        }

        const promises = [
          this.upnp.unmap(oldValue),
          this.upnp.map(newValue)
        ]
        try {
          await Promise.allSettled(promises)
        } catch (e) {
          logger.info('[Motrix] change UPnP port mapping failed:', e)
        }
      })
    })
  }

  watchUPnPEnabledChange (): void {
    const { userConfig } = this.configManager
    const key = 'enable-upnp'
    this.configListeners[key] = (userConfig as any).onDidChange(key, async (newValue: boolean, oldValue: boolean) => {
      logger.info('[Motrix] detected enable-upnp value change event:', newValue, oldValue)
      if (newValue) {
        this.startUPnPMapping()
      } else {
        await this.stopUPnPMapping()
        this.upnp.closeClient()
      }
    })
  }

  async shutdownUPnPManager (): Promise<void> {
    const enable = this.configManager.getUserConfig('enable-upnp')
    if (enable) {
      await this.stopUPnPMapping()
    }

    this.upnp.closeClient()
  }

  syncTrackers (source: string[], proxy: any): void {
    if (isEmpty(source)) {
      return
    }

    setTimeout(() => {
      fetchBtTrackerFromSource(source, proxy).then((data: string[]) => {
        logger.warn('[Motrix] auto sync tracker data:', data)
        if (!data || data.length === 0) {
          return
        }

        let tracker = convertTrackerDataToComma(data)
        tracker = reduceTrackerString(tracker)
        this.savePreference({
          system: {
            'bt-tracker': tracker
          },
          user: {
            'last-sync-tracker-time': Date.now()
          }
        })
      }).catch((err: Error) => {
        logger.warn('[Motrix] auto sync tracker failed:', err.message)
      })
    }, 500)
  }

  autoSyncTrackers (): void {
    const enable = this.configManager.getUserConfig('auto-sync-tracker')
    const lastTime = this.configManager.getUserConfig('last-sync-tracker-time')
    const result = checkIsNeedRun(enable, lastTime, AUTO_SYNC_TRACKER_INTERVAL)
    logger.info('[Motrix] auto sync tracker checkIsNeedRun:', result)
    if (!result) {
      return
    }

    const source = this.configManager.getUserConfig('tracker-source')
    const proxy = this.configManager.getUserConfig('proxy', { enable: false })

    this.syncTrackers(source, proxy)
  }

  autoResumeTask (): void {
    const enabled = this.configManager.getUserConfig('resume-all-when-app-launched')
    if (!enabled) {
      return
    }

    this.engineClient.call('unpauseAll')
  }

  initWindowManager (): void {
    this.windowManager = new WindowManager({
      userConfig: this.configManager.getUserConfig()
    })

    this.windowManager.on('window-resized', (data: WindowStateData) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('window-moved', (data: WindowStateData) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('window-closed', (data: WindowStateData) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('enter-full-screen', (_window: BrowserWindow) => {
      this.dockManager.show()
    })

    this.windowManager.on('leave-full-screen', (_window: BrowserWindow) => {
      const mode = this.configManager.getUserConfig('run-mode')
      if (mode === APP_RUN_MODE.TRAY) {
        this.dockManager.hide()
      }
    })
  }

  storeWindowState (data: WindowStateData = { page: '', bounds: { x: 0, y: 0, width: 0, height: 0 } }): void {
    const enabled = this.configManager.getUserConfig('keep-window-state')
    if (!enabled) {
      return
    }

    const state = this.configManager.getUserConfig('window-state', {})
    const { page, bounds } = data
    const newState = {
      ...state,
      [page]: bounds
    }
    this.configManager.setUserConfig('window-state', newState)
  }

  start (page: string, options: { openedAtLogin?: boolean } = {}): BrowserWindow {
    const win = this.showPage(page, options)

    // Debug: capture renderer console output in terminal
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      const levels = ['LOG', 'WARN', 'ERROR']
      logger.info(`[Renderer ${levels[level] || level}] ${message} (${sourceId}:${line})`)
    })

    win.once('ready-to-show', () => {
      this.isReady = true
      this.emit('ready')
    })

    if (is.macOS()) {
      this.touchBarManager.setup(page, win)
    }

    return win
  }

  showPage (page: string, options: { openedAtLogin?: boolean } = {}): BrowserWindow {
    const { openedAtLogin } = options
    const autoHideWindow = this.configManager.getUserConfig('auto-hide-window')
    return this.windowManager.openWindow(page, {
      hidden: openedAtLogin || autoHideWindow
    })
  }

  show (page: string = 'index'): void {
    this.windowManager.showWindow(page)
  }

  hide (page?: string): void {
    if (page) {
      this.windowManager.hideWindow(page)
    } else {
      this.windowManager.hideAllWindow()
    }
  }

  toggle (page: string = 'index'): void {
    this.windowManager.toggleWindow(page)
  }

  closePage (page: string): void {
    this.windowManager.destroyWindow(page)
  }

  stop (): Promise<any>[] | undefined {
    try {
      const promises: Promise<any>[] = [
        this.stopEngine(),
        this.shutdownUPnPManager(),
        Promise.resolve(this.energyManager.stopPowerSaveBlocker()),
        Promise.resolve(this.trayManager.destroy())
      ]

      return promises
    } catch (err: any) {
      logger.warn('[Motrix] stop error: ', err.message)
    }
  }

  async stopAllSettled (): Promise<void> {
    const promises = this.stop()
    if (promises) {
      await Promise.allSettled(promises)
    }
  }

  async quit (): Promise<void> {
    await this.stopAllSettled()
    app.exit()
  }

  sendCommand (command: string, ...args: any[]): void {
    if (!this.emit(command, ...args)) {
      const window = this.windowManager.getFocusedWindow()
      if (window) {
        this.windowManager.sendCommandTo(window, command, ...args)
      }
    }
  }

  sendCommandToAll (command: string, ...args: any[]): void {
    if (!this.emit(command, ...args)) {
      this.windowManager.getWindowList().forEach((window: BrowserWindow) => {
        this.windowManager.sendCommandTo(window, command, ...args)
      })
    }
  }

  sendMessageToAll (channel: string, ...args: any[]): void {
    this.windowManager.getWindowList().forEach((window: BrowserWindow) => {
      this.windowManager.sendMessageTo(window, channel, ...args)
    })
  }

  initThemeManager (): void {
    this.themeManager = new ThemeManager()
    this.themeManager.on('system-theme-change', (theme: string) => {
      this.trayManager.handleSystemThemeChange(theme)
      this.sendCommandToAll('application:update-system-theme', { theme })
    })
  }

  initTouchBarManager (): void {
    if (!is.macOS()) {
      return
    }

    this.touchBarManager = new TouchBarManager()
  }

  initProtocolManager (): void {
    const protocols = this.configManager.getUserConfig('protocols', {})
    this.protocolManager = new ProtocolManager({
      protocols
    })
  }

  handleProtocol (url: string): void {
    this.show()

    this.protocolManager.handle(url)
  }

  handleFile (filePath: string): void {
    if (!filePath) {
      return
    }

    if (extname(filePath).toLowerCase() !== '.torrent') {
      return
    }

    this.show()

    const name = basename(filePath)
    readFile(filePath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
      if (err) {
        logger.warn(`[Motrix] read file error: ${filePath}`, err.message)
        return
      }
      const dataURL = Buffer.from(data).toString('base64')
      this.sendCommandToAll('application:new-bt-task-with-file', {
        name,
        dataURL
      })
    })
  }

  initUpdaterManager (): void {
    if (is.mas()) {
      return
    }

    const enabled = this.configManager.getUserConfig('auto-check-update')
    const proxy = this.configManager.getSystemConfig('all-proxy')
    const lastTime = this.configManager.getUserConfig('last-check-update-time')
    const autoCheck = checkIsNeedRun(enabled, lastTime, AUTO_CHECK_UPDATE_INTERVAL)
    this.updateManager = new UpdateManager({
      autoCheck,
      proxy
    })
    this.handleUpdaterEvents()
  }

  handleUpdaterEvents (): void {
    this.updateManager.on('checking', (_event: any) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', false)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', false)
      this.configManager.setUserConfig('last-check-update-time', Date.now())
    })

    this.updateManager.on('download-progress', (event: any) => {
      const win = this.windowManager.getWindow('index')
      if (win) {
        win.setProgressBar(event.percent / 100)
      }
    })

    this.updateManager.on('update-not-available', (_event: any) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    })

    this.updateManager.on('update-downloaded', (_event: any) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
      const win = this.windowManager.getWindow('index')
      if (win) {
        win.setProgressBar(1)
      }
    })

    this.updateManager.on('update-cancelled', (_event: any) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
      const win = this.windowManager.getWindow('index')
      if (win) {
        win.setProgressBar(-1)
      }
    })

    this.updateManager.on('will-updated', async (_event: any) => {
      this.windowManager.setWillQuit(true)
      await this.stopAllSettled()
    })

    this.updateManager.on('update-error', (_event: any) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    })
  }

  async relaunch (): Promise<void> {
    await this.stopAllSettled()
    app.relaunch()
    app.exit()
  }

  async resetSession (): Promise<void> {
    await this.stopEngine()

    app.clearRecentDocuments()

    const sessionPath = this.context.get('session-path') as string
    setTimeout(() => {
      unlink(sessionPath, (err: NodeJS.ErrnoException | null) => {
        logger.info('[Motrix] Removed the download seesion file:', err)
      })

      this.engine.start()
    }, 3000)
  }

  savePreference (config: PreferenceConfig = {}): void {
    logger.info('[Motrix] save preference:', config)
    const { system, user } = config
    if (!isEmpty(system)) {
      console.info('[Motrix] main save system config: ', system)
      this.configManager.setSystemConfig(system)
      this.engineClient.changeGlobalOption(system!)
    }

    if (!isEmpty(user)) {
      console.info('[Motrix] main save user config: ', user)
      this.configManager.setUserConfig(user)
    }
  }

  handleCommands (): void {
    this.on('application:save-preference', this.savePreference)

    this.on('application:update-tray', (tray: ArrayBuffer) => {
      this.trayManager.updateTrayByImage(tray)
    })

    this.on('application:relaunch', () => {
      this.relaunch()
    })

    this.on('application:quit', () => {
      this.quit()
    })

    this.on('application:show', ({ page }: { page: string }) => {
      this.show(page)
    })

    this.on('application:hide', ({ page }: { page: string }) => {
      this.hide(page)
    })

    this.on('application:reset-session', () => this.resetSession())

    this.on('application:factory-reset', () => {
      this.offConfigListeners()
      this.configManager.reset()
      this.relaunch()
    })

    this.on('application:check-for-updates', () => {
      this.updateManager.check()
    })

    this.on('application:change-theme', (theme: string) => {
      this.themeManager.updateSystemTheme(theme)
      this.sendCommandToAll('application:update-theme', { theme })
    })

    this.on('application:change-locale', (locale: string) => {
      this.localeManager.changeLanguageByLocale(locale)
        .then(() => {
          this.menuManager.handleLocaleChange(locale)
          this.trayManager.handleLocaleChange(locale)
        })
    })

    this.on('application:toggle-dock', (visible: boolean) => {
      if (visible) {
        this.dockManager.show()
      } else {
        this.dockManager.hide()
        // Hiding the dock icon will trigger the entire app to hide.
        this.show()
      }
    })

    this.on('application:auto-hide-window', (hide: boolean) => {
      if (hide) {
        this.windowManager.handleWindowBlur()
      } else {
        this.windowManager.unbindWindowBlur()
      }
    })

    this.on('application:change-menu-states', (
      visibleStates: Record<string, boolean> | null,
      enabledStates: Record<string, boolean> | null,
      checkedStates: Record<string, boolean> | null
    ) => {
      this.menuManager.updateMenuStates(visibleStates, enabledStates, checkedStates)
      this.trayManager.updateMenuStates(visibleStates, enabledStates, checkedStates)
    })

    this.on('application:open-file', (_event: any) => {
      dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'Torrent',
            extensions: ['torrent']
          }
        ]
      }).then(({ canceled, filePaths }: { canceled: boolean; filePaths: string[] }) => {
        if (canceled || filePaths.length === 0) {
          return
        }

        const [filePath] = filePaths
        this.handleFile(filePath)
      })
    })

    this.on('application:clear-recent-tasks', () => {
      app.clearRecentDocuments()
    })

    this.on('application:setup-protocols-client', (protocols: Record<string, boolean>) => {
      if (is.dev() || is.mas() || !protocols) {
        return
      }
      logger.info('[Motrix] setup protocols client:', protocols)
      this.protocolManager.setup(protocols)
    })

    this.on('application:open-external', (url: string) => {
      this.openExternal(url)
    })

    this.on('application:reveal-in-folder', (data: { gid?: string; path?: string }) => {
      const { gid, path } = data
      logger.info('[Motrix] application:reveal-in-folder===>', path)
      if (path) {
        showItemInFolder(path)
      }
      if (gid) {
        this.sendCommandToAll('application:show-task-detail', { gid })
      }
    })

    this.on('help:official-website', () => {
      const url = 'https://motrix.app/'
      this.openExternal(url)
    })

    this.on('help:manual', () => {
      const url = 'https://motrix.app/manual'
      this.openExternal(url)
    })

    this.on('help:release-notes', () => {
      const url = 'https://motrix.app/release'
      this.openExternal(url)
    })

    this.on('help:report-problem', () => {
      const url = 'https://motrix.app/report'
      this.openExternal(url)
    })
  }

  openExternal (url: string): void {
    if (!url) {
      return
    }

    shell.openExternal(url)
  }

  handleConfigChange (configName: string): void {
    this.sendCommandToAll('application:update-preference-config', { configName })
  }

  handleEvents (): void {
    this.once('application:initialized', () => {
      this.autoSyncTrackers()

      this.autoResumeTask()

      this.adjustMenu()
    })

    ;(this.configManager.userConfig as any).onDidAnyChange(() => this.handleConfigChange('user'))
    ;(this.configManager.systemConfig as any).onDidAnyChange(() => this.handleConfigChange('system'))

    this.watchOpenAtLoginChange()
    this.watchProtocolsChange()
    this.watchRunModeChange()
    this.watchShowProgressBarChange()
    this.watchProxyChange()
    this.watchLocaleChange()
    this.watchThemeChange()

    this.on('download-status-change', (downloading: boolean) => {
      this.trayManager.handleDownloadStatusChange(downloading)
      if (downloading) {
        this.energyManager.startPowerSaveBlocker()
      } else {
        this.energyManager.stopPowerSaveBlocker()
      }
    })

    this.on('speed-change', (speed: SpeedData) => {
      this.dockManager.handleSpeedChange(speed)
      this.trayManager.handleSpeedChange(speed)
    })

    this.on('task-download-complete', (_task: any, path: string) => {
      this.dockManager.openDock(path)

      if (is.linux()) {
        return
      }
      app.addRecentDocument(path)
    })

    if (this.configManager.userConfig.get('show-progress-bar')) {
      this.bindProgressChange()
    }
  }

  handleProgressChange (progress: number): void {
    if (this.updateManager.isChecking) {
      return
    }
    if (!is.windows() && progress === 2) {
      progress = 0
    }
    const win = this.windowManager.getWindow('index')
    if (win) {
      win.setProgressBar(progress)
    }
  }

  bindProgressChange (): void {
    if (this.listeners('progress-change').length > 0) {
      return
    }

    this.on('progress-change', this.handleProgressChange)
  }

  unbindProgressChange (): void {
    if (this.listeners('progress-change').length === 0) {
      return
    }

    this.off('progress-change', this.handleProgressChange)
    const win = this.windowManager.getWindow('index')
    if (win) {
      win.setProgressBar(-1)
    }
  }

  handleIpcMessages (): void {
    ipcMain.on('command', (_event: IpcMainEvent, command: string, ...args: any[]) => {
      logger.log('[Motrix] ipc receive command', command, ...args)
      this.emit(command, ...args)
    })

    ipcMain.on('event', (_event: IpcMainEvent, eventName: string, ...args: any[]) => {
      logger.log('[Motrix] ipc receive event', eventName, ...args)
      this.emit(eventName, ...args)
    })
  }

  handleIpcInvokes (): void {
    ipcMain.handle('get-app-config', async (_event: IpcMainInvokeEvent) => {
      const systemConfig = this.configManager.getSystemConfig()
      const userConfig = this.configManager.getUserConfig()
      const context = this.context.get()

      const result = {
        ...systemConfig,
        ...userConfig,
        ...context
      }
      return result
    })
  }
}
