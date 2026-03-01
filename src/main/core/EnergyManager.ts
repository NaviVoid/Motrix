import { powerSaveBlocker } from 'electron'

import logger from './Logger'

let psbId: number | undefined

export default class EnergyManager {
  startPowerSaveBlocker (): void {
    logger.info('[Motrix] EnergyManager.startPowerSaveBlocker', psbId)
    if (psbId && powerSaveBlocker.isStarted(psbId)) {
      return
    }

    psbId = powerSaveBlocker.start('prevent-app-suspension')
    logger.info('[Motrix] start power save blocker:', psbId)
  }

  stopPowerSaveBlocker (): void {
    logger.info('[Motrix] EnergyManager.stopPowerSaveBlocker', psbId)
    if (typeof psbId === 'undefined' || !powerSaveBlocker.isStarted(psbId)) {
      return
    }

    powerSaveBlocker.stop(psbId)
    logger.info('[Motrix] stop power save blocker:', psbId)
    psbId = undefined
  }
}
