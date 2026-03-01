import { EventEmitter } from 'node:events'
import { join } from 'node:path'
import { Tray, Menu, nativeImage } from 'electron'
import type { NativeImage, MenuItem, KeyboardEvent } from 'electron'
import is from 'electron-is'

import { APP_RUN_MODE, APP_THEME } from '@shared/constants'
import { getInverseTheme } from '@shared/utils'
import logger from '../core/Logger'
import { getI18n } from './Locale'
import {
  translateTemplate,
  flattenMenuItems,
  updateStates
} from '../utils/menu'
import { convertArrayBufferToBuffer } from '../utils/index'
import trayMenuTemplate from '../menus/tray.json'

import type { i18n } from 'i18next'

declare const __static: string

let tray: Tray | null = null
const { platform } = process

interface TrayManagerOptions {
  theme?: string
  systemTheme?: string
  speedometer?: boolean
  runMode?: string
}

interface SpeedData {
  uploadSpeed: number
  downloadSpeed: number
}

export default class TrayManager extends EventEmitter {
  private options: TrayManagerOptions
  private theme: string
  private systemTheme: string
  private inverseSystemTheme: string
  private macOS: boolean
  private speedometer: boolean
  private runMode: string
  private i18n: i18n
  private menu: Menu | null
  private cache: Record<string, NativeImage>
  private items!: Record<string, MenuItem>
  private keymap?: Record<string, string>
  private template!: any[]

  private uploadSpeed: number
  private downloadSpeed: number
  private status: boolean
  private focused: boolean
  private initialized: boolean

  private normalIcon!: NativeImage
  private activeIcon!: NativeImage
  private inverseNormalIcon!: NativeImage
  private inverseActiveIcon!: NativeImage

  constructor (options: TrayManagerOptions = {}) {
    super()

    this.options = options
    this.theme = options.theme || APP_THEME.AUTO

    this.systemTheme = options.systemTheme || APP_THEME.LIGHT
    this.inverseSystemTheme = getInverseTheme(this.systemTheme)
    this.macOS = platform === 'darwin'

    this.speedometer = options.speedometer || false
    this.runMode = options.runMode || APP_RUN_MODE.STANDARD

    this.i18n = getI18n()
    this.menu = null
    this.cache = {}

    this.uploadSpeed = 0
    this.downloadSpeed = 0
    this.status = false
    this.focused = false
    this.initialized = false

    this.init()
  }

  init (): void {
    if (tray || this.initialized || this.runMode === APP_RUN_MODE.HIDE_TRAY) {
      return
    }

    this.loadTemplate()
    this.loadImages()
    this.initTray()
    this.setupMenu()
    this.bindEvents()

    this.initialized = true
  }

  loadTemplate (): void {
    this.template = trayMenuTemplate
  }

  loadImages (): void {
    switch (platform) {
    case 'darwin':
      this.loadImagesForMacOS()
      break
    case 'win32':
      this.loadImagesForWindows()
      break
    case 'linux':
      this.loadImagesForLinux()
      break

    default:
      this.loadImagesForDefault()
      break
    }
  }

  loadImagesForMacOS (): void {
    this.normalIcon = this.getFromCacheOrCreateImage('mo-tray-light-normal.png')
  }

  loadImagesForWindows (): void {
    this.normalIcon = this.getFromCacheOrCreateImage('mo-tray-colorful-normal.png')
    this.activeIcon = this.getFromCacheOrCreateImage('mo-tray-colorful-active.png')
  }

  loadImagesForLinux (): void {
    const { theme } = this
    if (theme === APP_THEME.AUTO) {
      this.normalIcon = this.getFromCacheOrCreateImage('mo-tray-dark-normal.png')
      this.activeIcon = this.getFromCacheOrCreateImage('mo-tray-dark-active.png')
    } else {
      this.normalIcon = this.getFromCacheOrCreateImage(`mo-tray-${theme}-normal.png`)
      this.activeIcon = this.getFromCacheOrCreateImage(`mo-tray-${theme}-active.png`)
    }
  }

  loadImagesForDefault (): void {
    this.normalIcon = this.getFromCacheOrCreateImage('mo-tray-light-normal.png')
    this.activeIcon = this.getFromCacheOrCreateImage('mo-tray-light-active.png')
  }

  getFromCacheOrCreateImage (key: string): NativeImage {
    let file = this.getCache(key)
    if (file) {
      return file
    }

    file = nativeImage.createFromPath(join(__static, `./${key}`))
    file.setTemplateImage(this.macOS)
    this.setCache(key, file)
    return file
  }

  getCache (key: string): NativeImage | undefined {
    return this.cache[key]
  }

  setCache (key: string, value: NativeImage): void {
    this.cache[key] = value
  }

  buildMenu (): void {
    const keystrokesByCommand: Record<string, string> = {}
    for (const item in this.keymap) {
      keystrokesByCommand[this.keymap![item]] = item
    }

    // Deepclone the menu template to refresh menu
    const template = JSON.parse(JSON.stringify(this.template))
    const tpl = translateTemplate(template, keystrokesByCommand, this.i18n)
    this.menu = Menu.buildFromTemplate(tpl)
    this.items = flattenMenuItems(this.menu)
  }

  setupMenu (): void {
    this.buildMenu()

    this.updateContextMenu()
  }

  initTray (): void {
    const { icon } = this.getIcons()
    tray = new Tray(icon)
    // tray.setPressedImage(inverseIcon)

    if (!this.macOS) {
      tray.setToolTip('Motrix')
    }
  }

  bindEvents (): void {
    // All OS
    tray!.on('click', this.handleTrayClick)

    // macOS, Windows
    // tray.on('double-click', this.handleTrayDbClick)
    tray!.on('right-click', this.handleTrayRightClick)
    tray!.on('mouse-down', this.handleTrayMouseDown)
    tray!.on('mouse-up', this.handleTrayMouseUp)

    // macOS only
    tray!.setIgnoreDoubleClickEvents(true)
    tray!.on('drop-files', this.handleTrayDropFiles)
    tray!.on('drop-text', this.handleTrayDropText)
  }

  unbindEvents (): void {
    // All OS
    tray!.removeListener('click', this.handleTrayClick)

    // macOS, Windows
    tray!.removeListener('right-click', this.handleTrayRightClick)
    tray!.removeListener('mouse-down', this.handleTrayMouseDown)
    tray!.removeListener('mouse-up', this.handleTrayMouseUp)

    // macOS only
    tray!.removeListener('drop-files', this.handleTrayDropFiles)
    tray!.removeListener('drop-text', this.handleTrayDropText)
  }

  handleTrayClick = (_event: KeyboardEvent): void => {
    const app = (global as any).application
    if (app) {
      app.toggle()
    }
  }

  handleTrayDbClick = (_event: KeyboardEvent): void => {
    const app = (global as any).application
    if (app) {
      app.show()
    }
  }

  handleTrayRightClick = (_event: KeyboardEvent): void => {
    tray!.popUpContextMenu(this.menu!)
  }

  handleTrayMouseDown = (_event: KeyboardEvent): void => {
    this.focused = true
    this.emit('mouse-down', {
      focused: true,
      theme: this.inverseSystemTheme
    })
    this.renderTray()
  }

  handleTrayMouseUp = (_event: KeyboardEvent): void => {
    this.focused = false
    this.emit('mouse-up', {
      focused: false,
      theme: this.theme
    })
    this.renderTray()
  }

  handleTrayDropFiles = (_event: Event, files: string[]): void => {
    this.emit('drop-files', files)
  }

  handleTrayDropText = (_event: Event, text: string): void => {
    this.emit('drop-text', text)
  }

  toggleSpeedometer (enabled: boolean): void {
    this.speedometer = enabled
  }

  async renderTray (): Promise<void> {
    if (!tray || this.speedometer) {
      return
    }

    const { icon } = this.getIcons()

    tray.setImage(icon)
    // tray.setPressedImage(inverseIcon)

    this.updateContextMenu()
  }

  getIcons (): { icon: NativeImage } {
    if (this.macOS) {
      return { icon: this.normalIcon }
    }

    const { focused, status, systemTheme } = this

    const icon = status ? this.activeIcon : this.normalIcon
    if (systemTheme === APP_THEME.DARK) {
      return {
        icon
      }
    }

    const inverseIcon = status ? this.inverseActiveIcon : this.inverseNormalIcon

    return {
      icon: focused ? inverseIcon : icon
      // inverseIcon: focused ? icon : inverseIcon
    }
  }

  updateContextMenu (): void {
    /**
     * Linux requires setContextMenu to be called
     * in order for the context menu to populate correctly
     */
    if (!tray || process.platform !== 'linux') {
      return
    }

    tray.setContextMenu(this.menu)
  }

  updateMenuStates (
    visibleStates: Record<string, boolean> | null,
    enabledStates: Record<string, boolean> | null,
    checkedStates: Record<string, boolean> | null
  ): void {
    updateStates(this.items, visibleStates, enabledStates, checkedStates)

    this.updateContextMenu()
  }

  updateMenuItemVisibleState (id: string, flag: boolean): void {
    const visibleStates = {
      [id]: flag
    }
    this.updateMenuStates(visibleStates, null, null)
  }

  updateMenuItemEnabledState (id: string, flag: boolean): void {
    const enabledStates = {
      [id]: flag
    }
    this.updateMenuStates(null, enabledStates, null)
  }

  handleLocaleChange (_locale: string): void {
    this.setupMenu()
  }

  handleRunModeChange (mode: string): void {
    this.runMode = mode

    if (mode === APP_RUN_MODE.HIDE_TRAY) {
      this.destroy()
    } else {
      this.init()
    }
  }

  handleSpeedometerEnableChange (enabled: boolean): void {
    this.toggleSpeedometer(enabled)

    this.renderTray()
  }

  handleSystemThemeChange (systemTheme: string = APP_THEME.LIGHT): void {
    if (!is.macOS()) {
      return
    }

    this.systemTheme = systemTheme
    this.inverseSystemTheme = getInverseTheme(systemTheme)

    this.loadImages()

    this.renderTray()
  }

  handleDownloadStatusChange (status: boolean): void {
    this.status = status

    this.renderTray()
  }

  async handleSpeedChange ({ uploadSpeed, downloadSpeed }: SpeedData): Promise<void> {
    if (!this.speedometer) {
      return
    }

    this.uploadSpeed = uploadSpeed
    this.downloadSpeed = downloadSpeed

    await this.renderTray()
  }

  async updateTrayByImage (ab: ArrayBuffer): Promise<void> {
    if (!tray) {
      return
    }

    const buffer = convertArrayBufferToBuffer(ab)
    const image = nativeImage.createFromBuffer(buffer, {
      scaleFactor: 2
    })
    image.setTemplateImage(this.macOS)
    tray.setImage(image)
  }

  destroy (): void {
    logger.info('[Motrix] TrayManager.destroy')
    if (tray) {
      this.unbindEvents()
    }

    tray!.destroy()
    tray = null
    this.initialized = false
  }
}
