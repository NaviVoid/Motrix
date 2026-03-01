import { EventEmitter } from 'node:events'
import { Menu } from 'electron'
import type { MenuItem } from 'electron'
import type { i18n } from 'i18next'

import keymap from '@shared/keymap'
import {
  translateTemplate,
  flattenMenuItems,
  updateStates
} from '../utils/menu'
import { getI18n } from '../ui/Locale'

import darwinMenu from '../menus/darwin.json'
import linuxMenu from '../menus/linux.json'
import win32Menu from '../menus/win32.json'

const menuByPlatform: Record<string, { menu: any[] }> = {
  darwin: darwinMenu,
  linux: linuxMenu,
  win32: win32Menu
}

export default class MenuManager extends EventEmitter {
  private options: any
  private i18n: i18n
  private keymap: Record<string, string>
  private items: Record<string, MenuItem>
  private template!: any[]

  constructor (options?: any) {
    super()
    this.options = options
    this.i18n = getI18n()

    this.keymap = keymap
    this.items = {}

    this.load()

    this.setup()
  }

  load (): void {
    const template = menuByPlatform[process.platform] || linuxMenu
    this.template = template.menu
  }

  build (): Menu {
    const keystrokesByCommand: Record<string, string> = {}
    for (const item in this.keymap) {
      keystrokesByCommand[this.keymap[item]] = item
    }

    // Deepclone the menu template to refresh menu
    const template = JSON.parse(JSON.stringify(this.template))
    const tpl = translateTemplate(template, keystrokesByCommand, this.i18n)
    const menu = Menu.buildFromTemplate(tpl)
    return menu
  }

  setup (_locale?: string): void {
    const menu = this.build()
    Menu.setApplicationMenu(menu)
    this.items = flattenMenuItems(menu)
  }

  handleLocaleChange (_locale: string): void {
    this.setup()
  }

  updateMenuStates (
    visibleStates: Record<string, boolean> | null,
    enabledStates: Record<string, boolean> | null,
    checkedStates: Record<string, boolean> | null
  ): void {
    updateStates(this.items, visibleStates, enabledStates, checkedStates)
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
}
