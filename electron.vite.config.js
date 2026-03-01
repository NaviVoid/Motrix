import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { appId } = JSON.parse(readFileSync(resolve(__dirname, 'electron-builder.json'), 'utf-8'))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      include: [
        'electron-is',
        'electron-log',
        'electron-store',
        'electron-updater',
        '@motrix/nat-api',
        'i18next',
        'lodash'
      ]
    })],
    build: {
      outDir: 'dist/electron/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    define: {
      appId: JSON.stringify(appId)
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/electron/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer/pages/index'),
    publicDir: resolve(__dirname, 'static'),
    build: {
      outDir: resolve(__dirname, 'dist/electron/renderer'),
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/pages/index/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared'),
        'electron-is': resolve(__dirname, 'src/renderer/utils/electron-is-shim.ts')
      }
    },
    plugins: [vue()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/components/Theme/Variables.scss";',
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin']
        }
      }
    }
  }
})
