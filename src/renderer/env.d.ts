/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ElectronAPI {
  // IPC
  sendCommand(command: string, ...args: unknown[]): void
  sendEvent(eventName: string, ...args: unknown[]): void
  onCommand(callback: (command: string, ...args: unknown[]) => void): () => void
  invoke(channel: string, ...args: unknown[]): Promise<unknown>

  // Dialog
  showOpenDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>
  showMessageBox(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>

  // Shell
  showItemInFolder(fullPath: string): Promise<void>
  openPath(fullPath: string): Promise<string>
  openExternal(url: string): Promise<void>
  trashItem(path: string): Promise<void>

  // Window
  windowMinimize(): void
  windowMaximize(): void
  windowClose(): void
  windowIsMaximized(): Promise<boolean>

  // Theme
  getSystemTheme(): Promise<string>

  // App
  getAppVersion(): Promise<string>
  getAppLocale(): Promise<string>

  // FS
  fileExists(filePath: string): Promise<boolean>
  resolvePath(...segments: string[]): Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
