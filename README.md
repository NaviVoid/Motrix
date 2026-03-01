# Motrix

<p>
  <a href="https://motrix.app">
    <img src="./static/512x512.png" width="256" alt="Motrix App Icon" />
  </a>
</p>

## A full-featured download manager

Motrix is a full-featured download manager that supports downloading HTTP, FTP, BitTorrent, Magnet, etc.

This is a modernized fork of the [original Motrix project](https://github.com/agalwood/Motrix) by [@agalwood](https://github.com/agalwood). The entire stack has been migrated to current technologies while preserving the same clean interface and full feature set.

## Technology Stack

- [Electron 33](https://electronjs.org/) with `contextIsolation` and preload security
- [Vue 3](https://vuejs.org/) Composition API (`<script setup lang="ts">`)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Element Plus](https://element-plus.org/) UI components
- [vue-i18n v9](https://vue-i18n.intlify.dev/) for internationalization
- [TypeScript](https://www.typescriptlang.org/) (strict mode throughout)
- [electron-vite](https://electron-vite.org/) build system
- [Aria2](https://aria2.github.io/) download engine via JSON-RPC

## Development

### Prerequisites

- Node.js >= 16
- [pnpm](https://pnpm.io/)

### Quick Start

```bash
pnpm install
pnpm dev
```

### Available Commands

Run `make help` to see all available targets, or use pnpm directly:

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `make install`    | Install dependencies                         |
| `make dev`        | Start dev mode with HMR                      |
| `make build`      | Build and package for distribution           |
| `make build-dir`  | Build without packaging (unpacked directory) |
| `make type-check` | Run TypeScript type checking                 |
| `make lint`       | Run ESLint                                   |
| `make lint-fix`   | Run ESLint with auto-fix                     |
| `make clean`      | Remove build artifacts                       |

Or equivalently with pnpm:

```bash
pnpm dev          # Development with HMR
pnpm build        # Production build + package
pnpm build:dir    # Production build, unpacked
pnpm type-check   # TypeScript checking (vue-tsc)
pnpm lint         # ESLint
pnpm lint:fix     # ESLint auto-fix
```

### Build for Distribution

After building, packaged applications are in the `release/` directory.

```bash
make build        # Full build + package
make build-dir    # Build without installer (faster, for testing)
```

Packaging is configured in `electron-builder.json` for macOS (DMG/ZIP), Windows (NSIS/AppX/Portable), and Linux (AppImage/DEB/RPM/Snap).

## License

[MIT](https://opensource.org/licenses/MIT) Copyright (c) 2018-present Dr_rOot
