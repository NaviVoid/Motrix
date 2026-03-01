import { join } from 'node:path'
import { EventEmitter } from 'node:events'
import { debounce } from 'lodash'
import { app, shell, screen, BrowserWindow } from 'electron'
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron'
import is from 'electron-is'

import pageConfig from '../configs/page'
import logger from '../core/Logger'

declare const __static: string

interface PageOptions {
  attrs: BrowserWindowConstructorOptions & { frame?: boolean; icon?: string }
  bindCloseToHide?: boolean
  openDevTools?: boolean
  url?: string
}

interface OpenWindowOptions {
  hidden?: boolean
}

interface WindowStateData {
  page: string
  bounds: Rectangle
}

const baseBrowserOptions: BrowserWindowConstructorOptions = {
  titleBarStyle: 'hiddenInset',
  show: false,
  width: 1024,
  height: 768,
  backgroundColor: '#fff',
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
    preload: join(__dirname, '../preload/index.js')
  }
}

// fix: BrowserWindow rendering bug under linux
const defaultBrowserOptions: BrowserWindowConstructorOptions = is.macOS()
  ? {
    ...baseBrowserOptions,
    vibrancy: 'ultra-dark' as const,
    visualEffectState: 'active' as const,
    backgroundColor: '#00000000'
  }
  : {
    ...baseBrowserOptions
  }

export default class WindowManager extends EventEmitter {
  private userConfig: Record<string, any>
  private windows: Record<string, BrowserWindow | null>
  willQuit: boolean

  constructor (options: { userConfig?: Record<string, any> } = {}) {
    super()
    this.userConfig = options.userConfig || {}

    this.windows = {}

    this.willQuit = false

    this.handleBeforeQuit()

    this.handleAllWindowClosed()
  }

  setWillQuit (flag: boolean): void {
    this.willQuit = flag
  }

  getPageOptions (page: string): PageOptions {
    const result: PageOptions = (pageConfig as Record<string, PageOptions>)[page] || { attrs: {} }
    const hideAppMenu = this.userConfig['hide-app-menu']
    if (hideAppMenu) {
      result.attrs.frame = false
    }

    // Optimized for small screen users
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const widthScale = width >= 1280 ? 1 : 0.875
    const heightScale = height >= 800 ? 1 : 0.875
    result.attrs.width = (result.attrs.width as number) * widthScale
    result.attrs.height = (result.attrs.height as number) * heightScale

    // fix AppImage Dock Icon Missing
    // https://github.com/AppImage/AppImageKit/wiki/Bundling-Electron-apps
    if (is.linux()) {
      result.attrs.icon = join(__static, './512x512.png')
    }

    return result
  }

  getPageBounds (page: string): Rectangle | null {
    const enabled = this.userConfig['keep-window-state']
    const windowStateMap = this.userConfig['window-state'] || {}
    let result: Rectangle | null = null
    if (enabled) {
      result = windowStateMap[page] || null
    }

    return result
  }

  openWindow (page: string, options: OpenWindowOptions = {}): BrowserWindow {
    const pageOptions = this.getPageOptions(page)
    const { hidden } = options
    const autoHideWindow = this.userConfig['auto-hide-window']
    let window = this.windows[page] || null
    if (window) {
      window.show()
      window.focus()
      return window
    }

    window = new BrowserWindow({
      ...defaultBrowserOptions,
      ...pageOptions.attrs
    })

    const bounds = this.getPageBounds(page)
    if (bounds) {
      window.setBounds(bounds)
    }

    if (is.dev() && pageOptions.openDevTools) {
      window.webContents.openDevTools()
    }

    window.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url)
      return { action: 'deny' as const }
    })

    if (pageOptions.url) {
      window.loadURL(pageOptions.url)
    }

    window.once('ready-to-show', () => {
      if (!hidden) {
        window!.show()
      }
    })

    window.on('enter-full-screen', () => {
      this.emit('enter-full-screen', window)
    })

    window.on('leave-full-screen', () => {
      this.emit('leave-full-screen', window)
    })

    this.handleWindowState(page, window)

    this.handleWindowClose(pageOptions, page, window)

    this.bindAfterClosed(page, window)

    this.addWindow(page, window)
    if (autoHideWindow) {
      this.handleWindowBlur()
    }

    return window
  }

  getWindow (page: string): BrowserWindow | null {
    return this.windows[page] || null
  }

  getWindows (): Record<string, BrowserWindow | null> {
    return this.windows || {}
  }

  getWindowList (): BrowserWindow[] {
    return Object.values(this.getWindows()).filter(Boolean) as BrowserWindow[]
  }

  addWindow (page: string, window: BrowserWindow): void {
    this.windows[page] = window
  }

  destroyWindow (page: string): void {
    const win = this.getWindow(page)
    if (!win) {
      return
    }

    this.removeWindow(page)
    win.removeListener('closed', () => {})
    win.removeListener('move', () => {})
    win.removeListener('resize', () => {})
    win.destroy()
  }

  removeWindow (page: string): void {
    this.windows[page] = null
  }

  bindAfterClosed (page: string, window: BrowserWindow): void {
    window.on('closed', (_event: Event) => {
      this.removeWindow(page)
    })
  }

  handleWindowState (page: string, window: BrowserWindow): void {
    window.on('resize', debounce(() => {
      const bounds = window.getBounds()
      this.emit('window-resized', { page, bounds })
    }, 500))

    window.on('move', debounce(() => {
      const bounds = window.getBounds()
      this.emit('window-moved', { page, bounds })
    }, 500))
  }

  handleWindowClose (pageOptions: PageOptions, page: string, window: BrowserWindow): void {
    window.on('close', (event: Event) => {
      if (pageOptions.bindCloseToHide && !this.willQuit) {
        event.preventDefault()

        // @see https://github.com/electron/electron/issues/20263
        if (window.isFullScreen()) {
          window.once('leave-full-screen', () => window.hide())

          window.setFullScreen(false)
        } else {
          window.hide()
        }
      }
      const bounds = window.getBounds()
      this.emit('window-closed', { page, bounds })
    })
  }

  showWindow (page: string): void {
    const window = this.getWindow(page)
    if (!window || (window.isVisible() && !window.isMinimized())) {
      return
    }

    window.show()
  }

  hideWindow (page: string): void {
    const window = this.getWindow(page)
    if (!window || !window.isVisible()) {
      return
    }
    window.hide()
  }

  hideAllWindow (): void {
    this.getWindowList().forEach((window: BrowserWindow) => {
      window.hide()
    })
  }

  toggleWindow (page: string): void {
    const window = this.getWindow(page)
    if (!window) {
      return
    }

    if (!window.isVisible() || window.isFullScreen()) {
      window.show()
    } else {
      window.hide()
    }
  }

  getFocusedWindow (): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow()
  }

  handleBeforeQuit (): void {
    app.on('before-quit', () => {
      this.setWillQuit(true)
    })
  }

  onWindowBlur (_event: Event, window: BrowserWindow): void {
    window.hide()
  }

  handleWindowBlur (): void {
    app.on('browser-window-blur', this.onWindowBlur)
  }

  unbindWindowBlur (): void {
    app.removeListener('browser-window-blur', this.onWindowBlur)
  }

  handleAllWindowClosed (): void {
    app.on('window-all-closed', (event: Event) => {
      event.preventDefault()
    })
  }

  sendCommandTo (window: BrowserWindow, command: string, ...args: any[]): void {
    if (!window) {
      return
    }
    logger.info('[Motrix] send command to:', command, ...args)
    window.webContents.send('command', command, ...args)
  }

  sendMessageTo (window: BrowserWindow, channel: string, ...args: any[]): void {
    if (!window) {
      return
    }
    window.webContents.send(channel, ...args)
  }
}
