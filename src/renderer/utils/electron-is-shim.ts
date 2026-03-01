// Browser-compatible replacement for 'electron-is' in the renderer process.
// The real electron-is uses Node.js 'os' module which is unavailable in Vite's browser context.

const p = globalThis.process || { type: '', platform: '', env: {} }
const platform = typeof navigator !== 'undefined'
  ? (navigator.platform?.startsWith('Win') ? 'win32'
    : navigator.platform?.startsWith('Mac') ? 'darwin' : 'linux')
  : (p.platform || 'linux')

const is = {
  renderer: () => true,
  main: () => false,
  macOS: () => platform === 'darwin',
  windows: () => platform === 'win32',
  linux: () => platform === 'linux',
  osx: () => platform === 'darwin',
  dev: () => {
    const env = p.env || {}
    if (env.ELECTRON_IS_DEV !== undefined) {
      return env.ELECTRON_IS_DEV === '1'
    }
    return !!(p as any).defaultApp ||
      /node_modules[\\/]electron[\\/]/.test((p as any).execPath || '')
  },
  production: () => !is.dev(),
  all: (...fns: (() => boolean)[]) => fns.every(fn => fn()),
  none: (...fns: (() => boolean)[]) => fns.every(fn => !fn()),
  one: (...fns: (() => boolean)[]) => fns.some(fn => fn()),

  // Version stubs (not available in renderer)
  gtRelease: () => false,
  ltRelease: () => false,
  gteRelease: () => false,
  lteRelease: () => false,
  eqRelease: () => false,

  // Feature stubs
  mas: () => false,
  windowsStore: () => false,
  usingAsar: () => false,
  sandbox: () => false
}

export default is
