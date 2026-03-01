import { spawn, ChildProcess } from 'node:child_process'
import { existsSync, writeFile, unlink } from 'node:fs'
import is from 'electron-is'

import logger from './Logger'
import { getI18n } from '../ui/Locale'
import {
  getEnginePidPath,
  getAria2BinPath,
  getAria2ConfPath,
  getSessionPath,
  transformConfig
} from '../utils/index'

import type { i18n } from 'i18next'

const { platform, arch } = process

interface EngineOptions {
  systemConfig?: Record<string, any>
  userConfig?: Record<string, any>
}

export default class Engine {
  static instance: ChildProcess | null = null

  private options: EngineOptions
  private i18n: i18n
  private systemConfig: Record<string, any>
  private userConfig: Record<string, any>
  private instance: ChildProcess | null = null

  constructor (options: EngineOptions = {}) {
    this.options = options

    this.i18n = getI18n()
    this.systemConfig = options.systemConfig || {}
    this.userConfig = options.userConfig || {}
  }

  start (): void {
    const pidPath = getEnginePidPath()
    logger.info('[Motrix] Engie pid path:', pidPath)

    if (this.instance) {
      return
    }

    const binPath = this.getEngineBinPath()
    const args = this.getStartArgs()
    this.instance = spawn(binPath, args, {
      windowsHide: false,
      stdio: is.dev() ? 'pipe' : 'ignore'
    })
    const pid = this.instance.pid!.toString()
    this.writePidFile(pidPath, pid)

    this.instance.once('close', () => {
      try {
        unlink(pidPath, (err: NodeJS.ErrnoException | null) => {
          if (err) {
            logger.warn(`[Motrix] Unlink engine process pid file failed: ${err}`)
          }
        })
      } catch (err) {
        logger.warn(`[Motrix] Unlink engine process pid file failed: ${err}`)
      }
    })

    if (is.dev()) {
      this.instance.stdout!.on('data', (data: Buffer) => {
        logger.log('[Motrix] engine stdout===>', data.toString())
      })

      this.instance.stderr!.on('data', (data: Buffer) => {
        logger.log('[Motrix] engine stderr===>', data.toString())
      })
    }
  }

  stop (): void {
    logger.info('[Motrix] engine.stop.instance')
    if (this.instance) {
      this.instance.kill()
      this.instance = null
    }
  }

  writePidFile (pidPath: string, pid: string): void {
    writeFile(pidPath, pid, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        logger.error(`[Motrix] Write engine process pid failed: ${err}`)
      }
    })
  }

  getEngineBinPath (): string {
    const result = getAria2BinPath(platform, arch)
    const binIsExist = existsSync(result)
    if (!binIsExist) {
      logger.error('[Motrix] engine bin is not exist:', result)
      throw new Error(this.i18n.t('app.engine-missing-message'))
    }

    return result
  }

  getStartArgs (): string[] {
    const confPath = getAria2ConfPath(platform, arch)

    const sessionPath = getSessionPath()
    const sessionIsExist = existsSync(sessionPath)

    let result: string[] = [`--conf-path=${confPath}`, `--save-session=${sessionPath}`]
    if (sessionIsExist) {
      result = [...result, `--input-file=${sessionPath}`]
    }

    const extraConfig: Record<string, any> = {
      ...this.systemConfig
    }
    const keepSeeding = this.userConfig['keep-seeding']
    const seedRatio = this.systemConfig['seed-ratio']
    if (keepSeeding || seedRatio === 0) {
      extraConfig['seed-ratio'] = 0
      delete extraConfig['seed-time']
    }
    console.log('extraConfig===>', extraConfig)

    const extra = transformConfig(extraConfig)
    result = [...result, ...extra]

    return result
  }

  isRunning (pid: number): boolean {
    try {
      return process.kill(pid, 0)
    } catch (e: any) {
      return e.code === 'EPERM'
    }
  }

  restart (): void {
    this.stop()
    this.start()
  }
}
