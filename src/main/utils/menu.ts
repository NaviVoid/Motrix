import { parse } from 'querystring'
import type { Menu, MenuItem } from 'electron'
import type { i18n } from 'i18next'

interface MenuTemplateItem {
  id?: string
  label?: string
  command?: string
  'command-arg'?: any
  'command-before'?: string
  'command-after'?: string
  'relative-id'?: string
  position?: 'first' | 'last' | 'before' | 'after'
  accelerator?: string | null
  submenu?: MenuTemplateItem[]
  click?: () => void
  __parent?: MenuTemplateItem[]
  [key: string]: any
}

export const concat = (
  template: MenuTemplateItem[],
  submenu: MenuTemplateItem[],
  submenuToAdd: MenuTemplateItem[]
): void => {
  submenuToAdd.forEach((sub: MenuTemplateItem) => {
    let relativeItem: MenuTemplateItem | null = null
    if (sub.position) {
      switch (sub.position) {
      case 'first':
        submenu.unshift(sub)
        break
      case 'last':
        submenu.push(sub)
        break
      case 'before':
        relativeItem = findById(template, sub['relative-id']!)
        if (relativeItem) {
          const array = relativeItem.__parent!
          const index = array.indexOf(relativeItem)
          array.splice(index, 0, sub)
        }
        break
      case 'after':
        relativeItem = findById(template, sub['relative-id']!)
        if (relativeItem) {
          const array = relativeItem.__parent!
          const index = array.indexOf(relativeItem)
          array.splice(index + 1, 0, sub)
        }
        break
      default:
        submenu.push(sub)
        break
      }
    } else {
      submenu.push(sub)
    }
  })
}

export const merge = (template: MenuTemplateItem[], item: MenuTemplateItem): void => {
  if (item.id) {
    const matched = findById(template, item.id)
    if (matched) {
      if (item.submenu && Array.isArray(item.submenu)) {
        if (!Array.isArray(matched.submenu)) {
          matched.submenu = []
        }
        concat(template, matched.submenu, item.submenu)
      }
    } else {
      concat(template, template, [item])
    }
  } else {
    template.push(item)
  }
}

function findById (template: MenuTemplateItem[], id: string): MenuTemplateItem | null {
  for (const i in template) {
    const item = template[i]
    if (item.id === id) {
      // Returned item need to have a reference to parent Array (.__parent).
      // This is required to handle `position` and `relative-id`
      item.__parent = template
      return item
    } else if (Array.isArray(item.submenu)) {
      const result = findById(item.submenu, id)
      if (result) {
        return result
      }
    }
  }
  return null
}

export const translateTemplate = (
  template: MenuTemplateItem[],
  keystrokesByCommand: Record<string, string>,
  i18n?: i18n
): MenuTemplateItem[] => {
  for (const i in template) {
    const item = template[i]
    if (item.command) {
      item.accelerator = acceleratorForCommand(item.command, keystrokesByCommand)
    }

    // If label is specified, label is used as the key of i18n.t(key),
    // which mainly solves the inaccurate translation of item.id.
    if (i18n) {
      if (item.label) {
        item.label = i18n.t(item.label)
      } else if (item.id) {
        item.label = i18n.t(item.id)
      }
    }

    item.click = () => {
      handleCommand(item)
    }

    if (item.submenu) {
      translateTemplate(item.submenu, keystrokesByCommand, i18n)
    }
  }
  return template
}

export const handleCommand = (item: Record<string, any>): void => {
  handleCommandBefore(item)

  const args = item['command-arg']
    ? [item.command, item['command-arg']]
    : [item.command]

  ;(global as any).application.sendCommandToAll(...args)

  handleCommandAfter(item)
}

function handleCommandBefore (item: Record<string, any>): void {
  if (!item['command-before']) {
    return
  }
  const [command, params] = item['command-before'].split('?')
  const args = parse(params)
  ;(global as any).application.sendCommandToAll(command, args)
}

function handleCommandAfter (item: Record<string, any>): void {
  if (!item['command-after']) {
    return
  }
  const [command, params] = item['command-after'].split('?')
  const args = parse(params)
  ;(global as any).application.sendCommandToAll(command, args)
}

function acceleratorForCommand (
  command: string,
  keystrokesByCommand: Record<string, string>
): string | null {
  const keystroke = keystrokesByCommand[command]
  if (keystroke) {
    let modifiers = keystroke.split(/-(?=.)/)
    const key = modifiers.pop()!.toUpperCase()
      .replace('+', 'Plus')
      .replace('MINUS', '-')
    modifiers = modifiers.map((modifier: string) => {
      if (process.platform === 'darwin') {
        return modifier.replace(/cmdctrl/ig, 'Cmd')
          .replace(/shift/ig, 'Shift')
          .replace(/cmd/ig, 'Cmd')
          .replace(/ctrl/ig, 'Ctrl')
          .replace(/alt/ig, 'Alt')
      } else {
        return modifier.replace(/cmdctrl/ig, 'Ctrl')
          .replace(/shift/ig, 'Shift')
          .replace(/ctrl/ig, 'Ctrl')
          .replace(/alt/ig, 'Alt')
      }
    })
    const keys = modifiers.concat([key])
    return keys.join('+')
  }
  return null
}

export const flattenMenuItems = (menu: Menu): Record<string, MenuItem> => {
  const flattenItems: Record<string, MenuItem> = {}
  menu.items.forEach((item: MenuItem) => {
    if (item.id) {
      flattenItems[item.id] = item
      if (item.submenu) {
        Object.assign(flattenItems, flattenMenuItems(item.submenu))
      }
    }
  })
  return flattenItems
}

export const updateStates = (
  itemsById: Record<string, MenuItem>,
  visibleStates: Record<string, boolean> | null,
  enabledStates: Record<string, boolean> | null,
  checkedStates: Record<string, boolean> | null
): void => {
  if (visibleStates) {
    for (const command in visibleStates) {
      const item = itemsById[command]
      if (item) {
        item.visible = visibleStates[command]
      }
    }
  }
  if (enabledStates) {
    for (const command in enabledStates) {
      const item = itemsById[command]
      if (item) {
        item.enabled = enabledStates[command]
      }
    }
  }
  if (checkedStates) {
    for (const id in checkedStates) {
      const item = itemsById[id]
      if (item) {
        item.checked = checkedStates[id]
      }
    }
  }
}
