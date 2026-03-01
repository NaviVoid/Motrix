/* eslint no-unused-vars: 'off' */
import { TRAY_CANVAS_CONFIG } from '@shared/constants'
import { draw } from '@shared/utils/tray'

let idx = 0
let canvas: OffscreenCanvas | undefined

const initCanvas = (): OffscreenCanvas => {
  if (canvas) {
    return canvas
  }

  const { WIDTH, HEIGHT } = TRAY_CANVAS_CONFIG
  return new OffscreenCanvas(WIDTH, HEIGHT)
}

interface DrawPayload {
  theme: string
  icon: ImageBitmap
  uploadSpeed: number
  downloadSpeed: number
  scale: number
  resultType: string
}

const drawTray = async (payload: DrawPayload): Promise<void> => {
  self.postMessage({
    type: 'log',
    payload
  })

  if (!canvas) {
    canvas = initCanvas()
  }

  try {
    const tray = await draw({
      canvas,
      ...payload
    })

    self.postMessage({
      type: 'tray:drawed',
      payload: {
        idx,
        tray
      }
    })

    idx += 1
  } catch (error: unknown) {
    logger((error as Error).message)
  }
}

const logger = (text: string): void => {
  self.postMessage({
    type: 'log',
    payload: text
  })
}

self.postMessage({
  type: 'initialized',
  payload: Date.now()
})

self.addEventListener('message', (event: MessageEvent) => {
  const { type, payload } = event.data
  switch (type) {
  case 'tray:draw':
    drawTray(payload)
    break
  default:
    logger(JSON.stringify(event.data))
  }
})
