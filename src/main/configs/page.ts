import { join } from 'node:path'
import is from 'electron-is'

interface PageAttrs {
  title: string
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  transparent?: boolean
  [key: string]: any
}

interface PageConfig {
  attrs: PageAttrs
  bindCloseToHide?: boolean
  openDevTools?: boolean
  url?: string
}

const pageConfig: Record<string, PageConfig> = {
  index: {
    attrs: {
      title: 'Motrix',
      width: 1024,
      height: 768,
      minWidth: 478,
      minHeight: 420,
      transparent: is.macOS()
    },
    bindCloseToHide: true,
    openDevTools: is.dev(),
    url: is.dev()
      ? process.env.ELECTRON_RENDERER_URL
      : 'file://' + join(__dirname, '../renderer/index.html')
  }
}

export default pageConfig
