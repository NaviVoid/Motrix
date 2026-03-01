import { join } from 'node:path'
import { app } from 'electron'
import is from 'electron-is'

import Launcher from './Launcher'

declare const appId: string
declare const __static: string

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// Disable GPU hardware acceleration on Linux to avoid EGL/ANGLE errors
// on systems without proper GPU driver support
if (is.linux()) {
  app.disableHardwareAcceleration()
}

// In electron-vite, main bundle is at dist/electron/main/index.js
// so __static is three levels up to reach project root's static/
;(global as any).__static = join(__dirname, '../../../static').replace(/\\/g, '\\\\')

/**
 * Fix Windows notification func
 * appId defined in .electron-vue/webpack.main.config.js
 */
if (is.windows()) {
  app.setAppUserModelId(appId)
}

;(global as any).launcher = new Launcher()
