import { access, constants } from 'node:fs'
import { resolve } from 'node:path'
import { ipcMain, dialog, shell, nativeTheme, app, BrowserWindow } from 'electron'
import type { IpcMainInvokeEvent, IpcMainEvent, OpenDialogOptions, MessageBoxOptions } from 'electron'

import { APP_THEME } from '@shared/constants'

export function registerIpcHandlers (): void {
  // Dialog
  ipcMain.handle('dialog:showOpenDialog', async (event: IpcMainInvokeEvent, options: OpenDialogOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return dialog.showOpenDialog(win!, options)
  })

  ipcMain.handle('dialog:showMessageBox', async (event: IpcMainInvokeEvent, options: MessageBoxOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return dialog.showMessageBox(win!, options)
  })

  // Shell
  ipcMain.handle('shell:showItemInFolder', async (_event: IpcMainInvokeEvent, fullPath: string) => {
    shell.showItemInFolder(fullPath)
  })

  ipcMain.handle('shell:openPath', async (_event: IpcMainInvokeEvent, fullPath: string) => {
    return shell.openPath(fullPath)
  })

  ipcMain.handle('shell:openExternal', async (_event: IpcMainInvokeEvent, url: string) => {
    return shell.openExternal(url)
  })

  ipcMain.handle('shell:trashItem', async (_event: IpcMainInvokeEvent, path: string) => {
    return shell.trashItem(path)
  })

  // Window
  ipcMain.on('window:minimize', (event: IpcMainEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })

  ipcMain.on('window:maximize', (event: IpcMainEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window:close', (event: IpcMainEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
  })

  ipcMain.handle('window:isMaximized', (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win ? win.isMaximized() : false
  })

  // Theme
  ipcMain.handle('theme:getSystemTheme', () => {
    return nativeTheme.shouldUseDarkColors ? APP_THEME.DARK : APP_THEME.LIGHT
  })

  // App
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:getLocale', () => {
    return app.getLocale()
  })

  // FS
  ipcMain.handle('fs:fileExists', async (_event: IpcMainInvokeEvent, filePath: string) => {
    return new Promise<boolean>((resolve) => {
      access(filePath, constants.F_OK, (err: NodeJS.ErrnoException | null) => {
        resolve(!err)
      })
    })
  })

  ipcMain.handle('fs:resolvePath', (_event: IpcMainInvokeEvent, ...segments: string[]) => {
    return resolve(...segments)
  })
}
