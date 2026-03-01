interface PlatformBinMap {
  darwin: string
  win32: string
  linux: string
  [key: string]: string
}

interface ArchMapping {
  [arch: string]: string
}

interface PlatformArchMap {
  darwin: ArchMapping
  win32: ArchMapping
  linux: ArchMapping
  [key: string]: ArchMapping
}

export const engineBinMap: PlatformBinMap = {
  darwin: 'aria2c',
  win32: 'aria2c.exe',
  linux: 'aria2c'
}

export const engineArchMap: PlatformArchMap = {
  darwin: {
    x64: 'x64',
    arm64: 'arm64'
  },
  win32: {
    ia32: 'ia32',
    x64: 'x64',
    arm64: 'x64'
  },
  linux: {
    x64: 'x64',
    arm: 'armv7l',
    arm64: 'arm64'
  }
}
