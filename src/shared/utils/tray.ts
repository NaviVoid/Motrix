import { APP_THEME, TRAY_CANVAS_CONFIG } from '@shared/constants'

// Temp Fix: Cannot find module 'lodash'
// import { bytesToSize } from '@shared/utils'
const bytesToSize = (bytes: string | number): string => {
  const b = parseInt(bytes as string, 10)
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) { return '0 KB' }
  const i = parseInt(Math.floor(Math.log(b) / Math.log(1024)) as unknown as string, 10)
  if (i === 0) { return `${b} ${sizes[i]}` }
  return `${(b / (1024 ** i)).toFixed(1)} ${sizes[i]}`
}

const lightTextColor = '#000'
const darkTextColor = '#fff'
const baseWidth = TRAY_CANVAS_CONFIG.WIDTH
const baseHeight = TRAY_CANVAS_CONFIG.HEIGHT
const baseIconWidth = TRAY_CANVAS_CONFIG.ICON_WIDTH
const baseIconHeight = TRAY_CANVAS_CONFIG.ICON_HEIGHT
const baseTextWidth = TRAY_CANVAS_CONFIG.TEXT_WIDTH
const baseFontSize = TRAY_CANVAS_CONFIG.TEXT_FONT_SIZE
const fontFamily = 'Arial'

interface DrawOptions {
  canvas: OffscreenCanvas
  theme: string
  icon?: ImageBitmap
  uploadSpeed: number | string
  downloadSpeed: number | string
  scale: number
  resultType?: string
}

export const draw = async ({
  canvas,
  theme,
  icon,
  uploadSpeed,
  downloadSpeed,
  scale,
  resultType
}: DrawOptions): Promise<string | Blob | ImageBitmap> => {
  if (!canvas) {
    throw new Error('canvas is required')
  }

  const width = baseWidth * scale
  const height = baseHeight * scale
  const textColor = (theme === APP_THEME.LIGHT) ? lightTextColor : darkTextColor
  const fontSize = (baseFontSize * scale) + 1
  const textFont = `${fontSize}px "${fontFamily}"`
  const iconWidth = baseIconWidth * scale
  const iconHeight = baseIconHeight * scale
  const textWidth = baseTextWidth * scale

  if (canvas.width !== width) {
    canvas.width = width
  }

  if (canvas.height !== height) {
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (icon) {
    ctx.drawImage(icon, 0, 0, iconWidth, iconHeight)
  }

  ctx.font = textFont
  ctx.textBaseline = 'top'
  ctx.textAlign = 'right'
  ctx.fillStyle = textColor

  const uploadText = `${bytesToSize(uploadSpeed)}/s`
  const uploadTextY = 0
  ctx.fillText(uploadText, width, uploadTextY, textWidth)

  const downloadText = `${bytesToSize(downloadSpeed)}/s`
  const downloadTextY = baseFontSize * scale + 0.5
  ctx.fillText(downloadText, width, downloadTextY, textWidth)

  const result = transferCanvasTo(canvas, resultType)

  return result
}

export const transferCanvasTo = (canvas: OffscreenCanvas, type?: string): string | Blob | Promise<Blob> | ImageBitmap => {
  switch (type) {
  case 'DATA_URL':
    return (canvas as unknown as HTMLCanvasElement).toDataURL()
  case 'BLOB':
    return canvas.convertToBlob()
  case 'BITMAP':
    return canvas.transferToImageBitmap()
  default:
    return canvas.convertToBlob()
  }
}
