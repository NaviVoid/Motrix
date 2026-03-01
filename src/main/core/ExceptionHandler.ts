import { app, dialog } from 'electron'
import is from 'electron-is'

import logger from './Logger'

interface ExceptionHandlerOptions {
  showDialog: boolean
}

const defaults: ExceptionHandlerOptions = {
  showDialog: !is.dev()
}

export default class ExceptionHandler {
  private options: ExceptionHandlerOptions

  constructor (options: Partial<ExceptionHandlerOptions> = {}) {
    this.options = {
      ...defaults,
      ...options
    }

    this.setup()
  }

  setup (): void {
    if (is.dev()) {
      return
    }
    const { showDialog } = this.options
    process.on('uncaughtException', (err: Error) => {
      const { message, stack } = err
      logger.error(`[Motrix] Uncaught exception: ${message}`)
      logger.error(stack)

      if (showDialog && app.isReady()) {
        dialog.showErrorBox('Error: ', message)
      }
    })
  }
}
