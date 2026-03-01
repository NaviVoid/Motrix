const { contextBridge, ipcRenderer } = require('electron')

interface ElectronAPI {
  sendCommand (command: string, ...args: any[]): void
  sendEvent (eventName: string, ...args: any[]): void
  onCommand (callback: (command: string, ...args: any[]) => void): () => void
  invoke (channel: string, ...args: any[]): Promise<any>
  showOpenDialog (options: any): Promise<any>
  showMessageBox (options: any): Promise<any>
  showItemInFolder (fullPath: string): Promise<void>
  openPath (fullPath: string): Promise<string>
  openExternal (url: string): Promise<void>
  trashItem (path: string): Promise<void>
  windowMinimize (): void
  windowMaximize (): void
  windowClose (): void
  windowIsMaximized (): Promise<boolean>
  getSystemTheme (): Promise<string>
  getAppVersion (): Promise<string>
  getAppLocale (): Promise<string>
  fileExists (filePath: string): Promise<boolean>
  resolvePath (...segments: string[]): Promise<string>
}

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC
  sendCommand (command: string, ...args: any[]): void {
    ipcRenderer.send('command', command, ...args)
  },
  sendEvent (eventName: string, ...args: any[]): void {
    ipcRenderer.send('event', eventName, ...args)
  },
  onCommand (callback: (command: string, ...args: any[]) => void): () => void {
    const listener = (_event: any, command: string, ...args: any[]): void => callback(command, ...args)
    ipcRenderer.on('command', listener)
    return () => ipcRenderer.removeListener('command', listener)
  },
  invoke (channel: string, ...args: any[]): Promise<any> {
    return ipcRenderer.invoke(channel, ...args)
  },

  // Dialog
  showOpenDialog (options: any): Promise<any> {
    return ipcRenderer.invoke('dialog:showOpenDialog', options)
  },
  showMessageBox (options: any): Promise<any> {
    return ipcRenderer.invoke('dialog:showMessageBox', options)
  },

  // Shell
  showItemInFolder (fullPath: string): Promise<void> {
    return ipcRenderer.invoke('shell:showItemInFolder', fullPath)
  },
  openPath (fullPath: string): Promise<string> {
    return ipcRenderer.invoke('shell:openPath', fullPath)
  },
  openExternal (url: string): Promise<void> {
    return ipcRenderer.invoke('shell:openExternal', url)
  },
  trashItem (path: string): Promise<void> {
    return ipcRenderer.invoke('shell:trashItem', path)
  },

  // Window
  windowMinimize (): void {
    ipcRenderer.send('window:minimize')
  },
  windowMaximize (): void {
    ipcRenderer.send('window:maximize')
  },
  windowClose (): void {
    ipcRenderer.send('window:close')
  },
  windowIsMaximized (): Promise<boolean> {
    return ipcRenderer.invoke('window:isMaximized')
  },

  // Theme
  getSystemTheme (): Promise<string> {
    return ipcRenderer.invoke('theme:getSystemTheme')
  },

  // App
  getAppVersion (): Promise<string> {
    return ipcRenderer.invoke('app:getVersion')
  },
  getAppLocale (): Promise<string> {
    return ipcRenderer.invoke('app:getLocale')
  },

  // FS
  fileExists (filePath: string): Promise<boolean> {
    return ipcRenderer.invoke('fs:fileExists', filePath)
  },
  resolvePath (...segments: string[]): Promise<string> {
    return ipcRenderer.invoke('fs:resolvePath', ...segments)
  }
} as ElectronAPI)
