<!-- @format -->

# `clients/desktop` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`clients/desktop` (`Xernerx App`) is the native Electron desktop wrapper for `app.xernerx.com`, featuring a custom frameless titlebar, system tray integration, hardware acceleration toggles, and `electron-updater` auto-updates.

## 🏗️ Architecture & Files

- **`src/main.ts`:** Electron main process (ES Module) managing window lifecycle, tray, auto-updater, and environment-aware target URL resolution (`https://app.xernerx.com` in production, or local dev port `4004` / `app.dev.*` in development).
- **`src/preload.cts`:** CommonJS preload script bridging `window.electron` (`minimize`, `maximize`, `close`, `isMaximized`, `onStatus`, `onError`, `version`, `metadata`) into the renderer context.
- **`pages/loading.html`:** Local splash/loading screen displayed while connecting to the web application.
- **`metadata.json`:** Runtime configuration flags (debug mode, GPU acceleration, etc.).

## ⚠️ Important Rules & Gotchas

1. **Preload Script Must Stay `.cts` (CommonJS):** While `package.json` sets `"type": "module"`, Electron's sandboxed preload script requires CommonJS output. Keep preload code in `src/preload.cts` (compiled to `dist/preload.cjs`).
2. **Context Isolation & Security:** Never expose raw `ipcRenderer` or Node.js primitives directly on `window`. Expose only narrow, typed methods via `contextBridge.exposeInMainWorld('electron', ...)` in `src/preload.cts`.
