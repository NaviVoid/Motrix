import { app } from 'electron'

import { LOGIN_SETTING_OPTIONS } from '@shared/constants'

export default class AutoLaunchManager {
  enable (): Promise<void> {
    return new Promise((resolve, _reject) => {
      const enabled = app.getLoginItemSettings(LOGIN_SETTING_OPTIONS).openAtLogin
      if (enabled) {
        resolve()
      }

      app.setLoginItemSettings({
        ...LOGIN_SETTING_OPTIONS,
        openAtLogin: true
      })
      resolve()
    })
  }

  disable (): Promise<void> {
    return new Promise((resolve, _reject) => {
      app.setLoginItemSettings({ openAtLogin: false })
      resolve()
    })
  }

  isEnabled (): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      const enabled = app.getLoginItemSettings(LOGIN_SETTING_OPTIONS).openAtLogin
      resolve(enabled)
    })
  }
}
