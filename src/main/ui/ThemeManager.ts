import { EventEmitter } from 'node:events'
import { nativeTheme } from 'electron'

import { APP_THEME } from '@shared/constants'
import logger from '../core/Logger'
import { getSystemTheme } from '../utils'

interface ThemeManagerOptions {
  [key: string]: any
}

export default class ThemeManager extends EventEmitter {
  private options: ThemeManagerOptions
  private systemTheme: string

  constructor (options: ThemeManagerOptions = {}) {
    super()

    this.options = options
    this.systemTheme = ''
    this.init()
  }

  init (): void {
    this.systemTheme = getSystemTheme()

    this.handleEvents()
  }

  getSystemTheme (): string {
    return this.systemTheme
  }

  handleEvents (): void {
    nativeTheme.on('updated', () => {
      const theme = getSystemTheme()
      this.systemTheme = theme
      logger.info('[Motrix] nativeTheme updated===>', theme)
      this.emit('system-theme-change', theme)
    })
  }

  updateSystemTheme (theme: string): void {
    theme = theme === APP_THEME.AUTO ? 'system' : theme
    nativeTheme.themeSource = theme as 'system' | 'light' | 'dark'
  }
}
