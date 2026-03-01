# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Motrix is a full-featured desktop download manager built with Electron 33 + Vue 3 + Aria2. It supports HTTP, FTP, BitTorrent, and Magnet downloads. The download engine is Aria2, controlled via JSON-RPC over WebSocket.

## Development Commands

```bash
pnpm install              # Install dependencies (runs postinstall: electron-builder install-app-deps)
pnpm dev                  # Start in development mode with HMR (electron-vite)
pnpm build                # Build + package with electron-builder
pnpm build:dir            # Build without packaging (outputs unpacked directory)
pnpm type-check           # TypeScript type checking (vue-tsc --noEmit)
pnpm lint                 # ESLint check on src/ (.ts and .vue files)
pnpm lint:fix             # ESLint auto-fix
```

There is no test suite configured in this project.

## Tech Stack

- **Runtime**: Electron 33 with `contextIsolation: true`, preload script + `contextBridge`
- **UI**: Vue 3 (Composition API, `<script setup lang="ts">`) + Element Plus
- **State**: Pinia (stores in `src/renderer/store/`)
- **i18n**: vue-i18n v9 (renderer), i18next (main process)
- **Language**: Strict TypeScript throughout (`src/**/*.ts`, `<script setup lang="ts">`)
- **Build**: electron-vite (Vite-based), pnpm package manager
- **Routing**: Vue Router 4 with hash history

## Architecture

### Electron Dual-Process Structure

- **Main process** (`src/main/`): Node.js backend — manages windows, tray, menus, system integration, and the Aria2 engine subprocess. Entry point: `src/main/index.ts` → `Launcher.ts` → `Application.ts`.
- **Preload** (`src/main/preload.ts`): Exposes `window.electronAPI` via `contextBridge` for secure IPC.
- **Renderer process** (`src/renderer/`): Vue 3 UI — the download manager interface. Entry point: `src/renderer/pages/index/main.ts`.
- **Shared code** (`src/shared/`): Constants, config key definitions, the Aria2 RPC client, locale translations, and utilities used by both processes.

### Main Process (`src/main/`)

`Application.ts` is the central controller (extends EventEmitter). It initializes:

- `core/Engine.ts` — Spawns and manages the Aria2 subprocess
- `core/EngineClient.ts` — Aria2 JSON-RPC client wrapper
- `core/ConfigManager.ts` — Persistent config via electron-store
- `core/IpcHandlers.ts` — Registers all ipcMain handlers for the preload bridge
- `ui/WindowManager.ts`, `ui/MenuManager.ts`, `ui/TrayManager.ts` — Window/menu/tray lifecycle
- `core/ProtocolManager.ts` — Custom protocol handlers (`mo://`, `motrix://`, `magnet://`, `thunder://`)
- `core/UPnPManager.ts` — UPnP/NAT-PMP port mapping for BitTorrent

### Renderer Process (`src/renderer/`)

- **UI framework**: Vue 3 + Element Plus component library
- **State management**: Pinia stores: `app.ts`, `task.ts`, `preference.ts`
- **Routing**: Vue Router 4 — `/task/:status` (download list), `/preference` (settings with sub-routes: basic, advanced, lab)
- **Components**: All use `<script setup lang="ts">` Composition API
  - `components/Task/` — download task UI
  - `components/Preference/` — settings panels
  - `components/Native/` — Electron integration (TitleBar, EngineClient, IPC)
  - `components/TaskDetail/` — task detail drawer
- **Web Workers**: `workers/tray.worker.ts` — tray speed meter

### Build Configuration (`electron.vite.config.js`)

- `main`: entry `src/main/index.ts`, output `dist/electron/main`
- `preload`: entry `src/main/preload.ts`, output `dist/electron/preload`
- `renderer`: entry `src/renderer/pages/index/index.html`, Vue plugin, SCSS with Variables.scss injection

**Path aliases** (defined in electron.vite.config.js and tsconfig.json):
- `@` → `src/renderer` (in renderer config) or `src/main` (in main config)
- `@shared` → `src/shared`

## Code Style

- 2-space indentation (ESLint enforced)
- In `.vue` files, script content uses `baseIndent: 1` (indented one level inside `<script>`)
- ESLint with `@typescript-eslint/parser` + `plugin:vue/essential` + `@vue/standard`
- `console` usage is allowed (`no-console: off`)
- All Vue components use `<script setup lang="ts">`

## Internationalization

- **Renderer**: vue-i18n v9 with 26 locales. Plugin at `src/renderer/plugins/i18n.ts`.
- **Main process**: i18next via `src/shared/locales/LocaleManager.ts`.
- Translation files live in `src/shared/locales/{locale}/` with per-module files (app.js, task.js, menu.js, preferences.js, etc.).
- Element Plus locale packs are merged in `src/shared/locales/all.js`.

## Build & Packaging

- `electron-builder.json` configures packaging for macOS (DMG/ZIP), Windows (NSIS/AppX/Portable), Linux (AppImage/DEB/RPM/Snap)
- Platform-specific extra resources (e.g., Aria2 binaries) are in `extra/`
- Requires Node.js >= 16
