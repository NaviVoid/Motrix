import { EventEmitter } from 'node:events'
import { join } from 'node:path'
import { TouchBar, nativeImage } from 'electron'
import type { BrowserWindow, NativeImage } from 'electron'

import { handleCommand } from '../utils/menu'
import logger from '../core/Logger'
import touchBarTemplate from '../menus/touchBar.json'

declare const __static: string

const { TouchBarButton, TouchBarLabel, TouchBarSpacer, TouchBarGroup } = TouchBar

type TouchBarItemType = 'button' | 'label' | 'spacer' | 'group'

interface TouchBarTemplateItem {
  id?: string
  type: TouchBarItemType
  label?: string
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'large' | 'flexible'
  icon?: string
  command?: string
  items?: TouchBarTemplateItem[]
  [key: string]: any
}

interface BuildItemOptions {
  label?: string
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'large' | 'flexible'
  icon?: string
  command?: string
  items?: any[]
  type?: TouchBarItemType
  [key: string]: any
}

type TouchBarItem = InstanceType<typeof TouchBarButton> |
  InstanceType<typeof TouchBarLabel> |
  InstanceType<typeof TouchBarSpacer> |
  InstanceType<typeof TouchBarGroup>

export default class TouchBarManager extends EventEmitter {
  private options: any
  private bars: Record<string, TouchBar>
  private template!: TouchBarTemplateItem[]

  constructor (options?: any) {
    super()
    this.options = options
    this.bars = {}
    this.load()
  }

  load (): void {
    this.template = touchBarTemplate
  }

  getClickFn (item: BuildItemOptions): () => void {
    let fn: () => void = () => {}
    if (item.command) {
      fn = () => {
        handleCommand(item)
      }
    }
    return fn
  }

  getIconImage (icon?: string): NativeImage | undefined {
    if (!icon) {
      return
    }
    const img = join(__static, `./icons/${icon}.png`)
    return nativeImage.createFromPath(img)
  }

  buildItem (type: TouchBarItemType, options: BuildItemOptions): TouchBarItem | null {
    let result: TouchBarItem | null = null
    const { label, backgroundColor, textColor, size } = options

    switch (type) {
    case 'button':
      result = new TouchBarButton({
        label,
        backgroundColor,
        icon: this.getIconImage(options.icon),
        click: this.getClickFn(options)
      })
      break
    case 'label':
      result = new TouchBarLabel({
        label,
        textColor
      })
      break
    case 'spacer':
      result = new TouchBarSpacer({ size })
      break
    case 'group':
      result = new TouchBarGroup({
        items: new TouchBar({
          items: options.items as any
        })
      })
      break
    default:
      result = null
    }

    return result
  }

  build (template: TouchBarTemplateItem[]): TouchBarItem[] {
    const result: TouchBarItem[] = []

    template.forEach((tpl: TouchBarTemplateItem) => {
      const { id, type, ...rest } = tpl
      let options: BuildItemOptions = { ...rest }
      if (type === 'group') {
        options = { type, items: this.build(options.items as TouchBarTemplateItem[]) }
      }
      const item = this.buildItem(type, options)
      if (item) {
        result.push(item)
      }
    })
    return result
  }

  getTouchBarByPage (page: string): TouchBar | null {
    let bar: TouchBar | null = this.bars[page] || null
    if (!bar) {
      try {
        const items = this.build(this.template)
        bar = new TouchBar({ items: items as any })
        this.bars[page] = bar
      } catch (e) {
        logger.info('getTouchBarByPage fail', e)
      }
    }
    return bar
  }

  setup (page: string, window: BrowserWindow): void {
    const bar = this.getTouchBarByPage(page)
    if (bar) {
      window.setTouchBar(bar)
    }
  }
}
