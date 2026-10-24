<!-- @format -->

# `clients/desktop` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`clients/desktop` (`Xernerx App`) is the native Electron desktop wrapper for `app.xernerx.com`, featuring a custom frameless titlebar, system tray integration, hardware acceleration toggles, and `electron-updater` auto-updates.

## 🏗️ Architecture & Files

- **`src/main.ts`:** Electron main process (ES Module) managing window lifecycle, tray, auto-updater, and environment-aware target URL resolution (`https://app.xernerx.com` in production, or local dev port `4004` / `app.dev.*` in development).
- **`src/metadata.ts`:** Runtime configuration persistence (`config.json` in `userData` + `metadata.json` sync), external file watcher, system tray menu builder, and Discord Rich Presence (`@xhayper/discord-rpc`).
- **`src/notifications.ts`:** Native Windows Action Center & Apple Notification Center (`UNNotification`) dispatcher, click-to-navigate handler, taskbar flash, and macOS Dock / system tray unread badge synchronization.
- **`src/features.ts`:** Native desktop-exclusive OS integrations:
    - **Streamer Protection (`win.setContentProtection`)** & broadcaster process detection (`obs64`, `streamlabs`, `xsplit`, `bdcam`).
    - **Windows Taskbar JumpList (`app.setUserTasks`), Thumbnail Toolbar (`win.setThumbarButtons`), and macOS Dock Menu (`app.dock.setMenu`)** with `--jump=` CLI routing.
    - **Quick Screen & Clipboard Capture (`desktopCapturer` + `clipboard`)** piped to renderer for instant `cdn.xernerx.com` upload.
    - **Optional Global Feature Hotkeys:** `Ctrl/Cmd + Shift + Space` (Spotlight Quick Launcher, `globalQuickLauncher`) and `Ctrl/Cmd + Shift + S` (Quick Screen Capture, `quickCaptureHotkey`).
    - **Smart Battery Saver & Wake Sync (`powerMonitor`):** Broadcasts `on-battery`, `on-ac`, `suspend`, `resume`, and `unlock-screen` power states to pause background canvas animations and resync notifications on wake.
- **`src/preload.cts`:** CommonJS preload script bridging `window.electron` (`minimize`, `maximize`, `close`, `isMaximized`, `notify`, `setBadgeCount`, `onNotificationClick`, `getPowerState`, `onPowerStateChange`, `getStreamerState`, `onStreamerStateChange`, `quickCapture`, `onQuickCapture`, `writeClipboardText`, `onQuickLaunch`, `getMetadata`, `updateMetadata`, `onMetadataUpdated`, `setActivity`, `toggleOverlay`, `getAccounts`, `onStatus`, `onError`, `version`, `metadata`) into the renderer context.
- **`pages/loading.html`:** Local splash/loading screen displayed while connecting to the web application.
- **`metadata.json`:** Runtime configuration flags (`debug`, `hardwareAcceleration`, `streamerMode`, `batterySaver`, `globalQuickLauncher`, `quickCaptureHotkey`, `desktopNotifications`, etc.).

## ⚠️ Important Rules & Gotchas

1. **Preload Script Must Stay `.cts` (CommonJS):** While `package.json` sets `"type": "module"`, Electron's sandboxed preload script requires CommonJS output. Keep preload code in `src/preload.cts` (compiled to `dist/preload.cjs`).
2. **Context Isolation & Security:** Never expose raw `ipcRenderer` or Node.js primitives directly on `window`. Expose only narrow, typed methods via `contextBridge.exposeInMainWorld('electron', ...)` in `src/preload.cts`.
3. **Sync `www/download` Showcase & FAQ:** Whenever changing desktop features, window controls, overlay behavior, account switching, or shortcuts in `clients/desktop`, update `apps/www/src/app/download/page.tsx` (`DesktopInteractivePreview.tsx` and `DesktopPerksBento.tsx`) and the Desktop FAQ (`apps/info/src/components/faq/DesktopAndOverlay.tsx` + `apps/api/src/lib/faqBlueprintsPlatform.ts`) to stay in lockstep.
