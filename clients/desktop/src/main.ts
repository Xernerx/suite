/** @format */

import { BrowserWindow, Notification, Tray, app, globalShortcut, ipcMain, screen, shell } from 'electron';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { type Metadata, broadcastMetadataUpdate, createSystemTray, getMetadataFilePath, loadMetadata, syncGlobalHotkey, watchMetadataFile } from './metadata.js';
import { configureFramelessWindow, getAccountsState, getActivePartition, removeAccountSlot, syncAccountSlotProfile, toggleOverlayWindow } from './overlay.js';
import { type RpcActivityPayload, syncDiscordRpc } from './rpc.js';

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, '../public/icon.ico');
const preloadPath = path.join(__dirname, 'preload.cjs');
const isCanary = app.getVersion().includes('canary');
const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || '';
const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);

const WEB_URL = app.isPackaged
	? isCanary
		? 'https://app.canary.xernerx.com'
		: 'https://app.xernerx.com'
	: domain && !isIp && domain !== 'localhost' && domain !== '127.0.0.1'
		? `https://app.dev.${domain}`
		: `http://${domain || '127.0.0.1'}:4004`;
let win: BrowserWindow;
let splash: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let ipcRegistered = false;

function log(message: string) {
	try {
		const file = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		fs.appendFileSync(file, `[${new Date().toISOString()}] ${message}\n`);
	} catch {}
}

export function getMetadata(): Metadata {
	return loadMetadata(store, log);
}

function applyRuntimeMetadata(targetMeta: Metadata) {
	if (win && !win.isDestroyed()) win.setAlwaysOnTop(Boolean(targetMeta.alwaysOnTop));
	syncGlobalHotkey(targetMeta.globalHotkey !== false, () => win);
	syncDiscordRpc(targetMeta.discordRpc !== false);
	broadcastMetadataUpdate(targetMeta);
}

export function saveMetadata(patch: Partial<Metadata>): Metadata {
	const current = getMetadata();
	const updated: Metadata = { ...current, ...patch };
	store.set('metadataOverrides', updated);

	try {
		fs.writeFileSync(getMetadataFilePath(), JSON.stringify(updated, null, '\t') + '\n', 'utf-8');
	} catch {
		log(`WARNING: Could not write directly to ${getMetadataFilePath()}, persisted in electron-store`);
	}

	try {
		app.setLoginItemSettings({ openAtLogin: Boolean(updated.startOnBoot) });
	} catch {}

	applyRuntimeMetadata(updated);
	return updated;
}

watchMetadataFile(() => applyRuntimeMetadata(getMetadata()));

const meta = getMetadata();
const DEBUG = meta.debug === true;
if (meta.hardwareAcceleration === false) app.disableHardwareAcceleration();
try {
	app.setLoginItemSettings({ openAtLogin: Boolean(meta.startOnBoot) });
} catch {}

function sendError(message: string) {
	log(`ERROR: ${message}`);
	if (splash && !splash.isDestroyed()) splash.webContents.send('startup:error', message);
}

function sendStatus(message: string) {
	log(`STATUS: ${message}`);
	if (splash && !splash.isDestroyed()) splash.webContents.send('startup:status', message);
}

function getSafeBounds(bounds?: Electron.Rectangle): Electron.Rectangle {
	const { workArea } = screen.getPrimaryDisplay();
	const fallback = { x: workArea.x + 100, y: workArea.y + 100, width: 1200, height: 800 };
	if (!bounds) return fallback;
	const off = bounds.x + bounds.width < workArea.x || bounds.y + bounds.height < workArea.y || bounds.x > workArea.x + workArea.width || bounds.y > workArea.y + workArea.height;
	return off ? fallback : bounds;
}

function createSplash() {
	splash = new BrowserWindow({
		width: 500,
		height: 350,
		center: true,
		roundedCorners: true,
		frame: false,
		transparent: true,
		resizable: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		backgroundColor: '#00000000',
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
	});
	splash.loadFile(path.join(__dirname, '../pages/loading.html'));
}

async function waitForServer() {
	sendStatus('Connecting...');
	let attempt = 0;
	while (true) {
		attempt++;
		try {
			const res = await fetch(`${WEB_URL}/api/version`);
			if (res.ok) {
				sendStatus('Ready');
				return;
			}
			const delay = Math.min(attempt * attempt, 180);
			for (let s = delay; s > 0; s--) {
				sendStatus(`Retrying in ${s}s`);
				await new Promise((r) => setTimeout(r, 1000));
			}
		} catch (e) {
			sendError((e as Error).message);
			return;
		}
	}
}

async function runUpdater() {
	if (DEBUG) return;
	sendStatus('Checking for updates…');
	const { autoUpdater } = (await import('electron-updater')).default;
	try {
		autoUpdater.autoDownload = true;
		autoUpdater.on('update-available', () => sendStatus('Downloading update…'));
		autoUpdater.on('update-not-available', () => sendStatus('No updates found'));
		autoUpdater.on('update-downloaded', () => {
			sendStatus('Installing update…');
			setTimeout(() => autoUpdater.quitAndInstall(), 1000);
		});
		await autoUpdater.checkForUpdates();
	} catch (error) {
		sendError((error as Error).message);
	}
}

/* --------------------------------------------- */
/* Window & IPC                                  */
/* --------------------------------------------- */

function registerIpcHandlers() {
	if (ipcRegistered) return;
	ipcRegistered = true;

	ipcMain.on('window:minimize', (event) => {
		const target = BrowserWindow.fromWebContents(event.sender) || win;
		target?.minimize();
	});
	ipcMain.on('window:maximize', (event) => {
		const target = BrowserWindow.fromWebContents(event.sender) || win;
		if (!target || target.isDestroyed()) return;
		if (target.isMaximized()) target.unmaximize();
		else target.maximize();
	});

	ipcMain.on('window:close', (event) => {
		const senderWin = BrowserWindow.fromWebContents(event.sender);
		if (senderWin && senderWin !== win) {
			senderWin.close();
			return;
		}
		const latestMeta = getMetadata();
		if (latestMeta.minimizeOnClose && !isQuitting) {
			if (tray) win?.hide();
			else win?.minimize();
		} else {
			win?.close();
		}
	});

	ipcMain.handle('window:isMaximized', (event) => {
		const target = BrowserWindow.fromWebContents(event.sender) || win;
		return target?.isMaximized() ?? false;
	});
	ipcMain.handle('metadata:get', () => getMetadata());
	ipcMain.handle('metadata:set', (_, patch: Partial<Metadata>) => saveMetadata(patch));

	ipcMain.handle('app:clearCache', async () => {
		if (win && !win.isDestroyed()) await win.webContents.session.clearCache();
		return true;
	});

	ipcMain.handle('app:getLogs', () => {
		const logFile = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		try {
			if (!fs.existsSync(logFile)) log('Initialized debug log file');
			return fs.readFileSync(logFile, 'utf-8');
		} catch {
			return '';
		}
	});

	ipcMain.handle('app:openLogs', async () => {
		const logFile = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		try {
			if (!fs.existsSync(logFile)) log('Opened debug log file');
			await shell.openPath(logFile);
		} catch {
			await shell.openPath(app.getPath('userData'));
		}
		return true;
	});

	ipcMain.handle('app:openExternal', async (_, url: string) => {
		if (typeof url === 'string' && /^https?:\/\//i.test(url)) await shell.openExternal(url);
		return true;
	});

	ipcMain.on('app:notify', (_, payload: { title: string; body?: string }) => {
		try {
			if (Notification.isSupported() && payload?.title) {
				const notif = new Notification({
					title: payload.title,
					body: payload.body || '',
					icon: fs.existsSync(iconPath) ? iconPath : undefined,
				});
				notif.on('click', () => {
					if (!win || win.isDestroyed()) return;
					if (win.isMinimized()) win.restore();
					win.show();
					win.focus();
				});
				notif.show();
			}
			if (win && !win.isDestroyed() && !win.isFocused()) {
				win.flashFrame(true);
			}
		} catch {}
	});

	ipcMain.on('rpc:setActivity', (_, activity: RpcActivityPayload) => {
		const latest = getMetadata();
		syncDiscordRpc(latest.discordRpc !== false, activity);
	});

	ipcMain.handle('overlay:toggle', () => {
		return toggleOverlayWindow({
			webUrl: WEB_URL,
			preloadPath,
			iconPath,
			partition: getActivePartition(store),
		});
	});

	ipcMain.on('overlay:navigateMain', (_, targetPath: string) => {
		if (!win || win.isDestroyed()) return;
		if (win.isMinimized()) win.restore();
		win.show();
		win.focus();
		const fullUrl = targetPath.startsWith('http') ? targetPath : `${WEB_URL}${targetPath.startsWith('/') ? targetPath : '/' + targetPath}`;
		win.loadURL(fullUrl).catch(() => {});
	});

	ipcMain.handle('accounts:get', () => getAccountsState(store));
	ipcMain.handle('accounts:sync', (_, profile: { id?: string; username?: string; globalName?: string; avatar?: string }) => syncAccountSlotProfile(store, profile));
	ipcMain.handle('accounts:remove', (_, slot: string) => removeAccountSlot(store, slot));
	ipcMain.handle('accounts:switch', async (_, targetSlot: string) => {
		const { accounts } = getAccountsState(store);
		let nextSlot = targetSlot;
		if (targetSlot === 'new') {
			const idx = accounts.length + 1;
			nextSlot = `slot-${idx}-${Date.now().toString(36).slice(-3)}`;
			accounts.push({ slot: nextSlot, lastActive: Date.now() });
			store.set('desktopAccounts', accounts);
		}
		store.set('activeAccountSlot', nextSlot);
		app.relaunch();
		app.exit(0);
		return true;
	});

	ipcMain.on('app:restart', () => {
		app.relaunch();
		app.exit(0);
	});
}

function createMainWindow(bounds: Electron.Rectangle) {
	registerIpcHandlers();

	win = new BrowserWindow({
		width: bounds.width,
		height: bounds.height,
		x: bounds.x,
		y: bounds.y,
		roundedCorners: true,
		frame: false,
		transparent: false,
		resizable: true,
		backgroundColor: '#00000000',
		icon: iconPath,
		show: false,
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			partition: getActivePartition(store),
		},
	});

	if (meta.alwaysOnTop) win.setAlwaysOnTop(true);

	const wasMaximized = store.get('windowMaximized');
	if (meta.startMaximized || wasMaximized) win.maximize();

	function saveBounds() {
		if (!win || win.isDestroyed() || win.isMinimized()) return;
		if (win.isMaximized()) {
			store.set('windowMaximized', true);
			return;
		}
		store.set('windowMaximized', false);
		store.set('windowBounds', win.getBounds());
	}

	win.on('resize', saveBounds);
	win.on('move', saveBounds);
	win.on('close', saveBounds);

	let crashCount = 0;
	win.webContents.on('render-process-gone', (_, details) => {
		log(`CRASH: ${JSON.stringify(details)}`);
		if (++crashCount > 3) return;
		setTimeout(() => win.reload(), 1000);
	});

	if (DEBUG) {
		win.webContents.on('did-finish-load', () => log(`LOADED: ${win.webContents.getURL()}`));
		win.webContents.on('will-redirect', (_, url) => log(`REDIRECT: ${url}`));
	}

	if (app.isPackaged && !DEBUG) {
		win.webContents.on('before-input-event', (event, input) => {
			if (input.key === 'F12') event.preventDefault();
			if (input.control && input.shift && input.key.toLowerCase() === 'i') event.preventDefault();
		});
		win.webContents.on('context-menu', (e) => e.preventDefault());
	}

	configureFramelessWindow(win, {
		preloadPath,
		iconPath,
		getPartition: () => getActivePartition(store),
		shouldOpenExternal: () => getMetadata().openExternalInBrowser !== false,
	});
}

async function createWindow() {
	let bounds = store.get('windowBounds') as Electron.Rectangle | undefined;
	bounds = getSafeBounds(bounds);

	createSplash();

	await new Promise<void>((resolve) => {
		if (!splash) return resolve();
		splash.webContents.once('did-finish-load', () => resolve());
	});

	try {
		await runUpdater();
		await waitForServer();

		sendStatus('Launching...');
		createMainWindow(bounds);

		await win.loadURL(WEB_URL + '/dashboard').catch((err) => {
			if (err?.errno !== -3 && err?.code !== 'ERR_ABORTED') throw err;
		});

		if (!meta.startMinimized) {
			win.show();
			win.focus();
		}

		if (DEBUG) {
			setTimeout(() => {
				win.webContents.openDevTools({ mode: 'detach' });
			}, 1000);
		}
	} catch (error) {
		sendError((error as Error).message);
	} finally {
		if (splash && !splash.isDestroyed()) {
			splash.destroy();
			splash = null;
		}
	}
}

/* --------------------------------------------- */
/* App start                                     */
/* --------------------------------------------- */

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (_event, commandLine) => {
		if (win && !win.isDestroyed()) {
			if (win.isMinimized()) win.restore();
			win.show();
			win.focus();

			const deepLink = commandLine.find((arg) => arg.startsWith('xernerx://'));
			if (deepLink) {
				const subPath = '/' + deepLink.replace('xernerx://', '').replace(/^\/+/, '');
				win.loadURL(WEB_URL + subPath).catch(() => {});
			}
		}
	});

	app.on('browser-window-created', (_event, childWin) => {
		if (childWin === splash) return;
		configureFramelessWindow(childWin, {
			preloadPath,
			iconPath,
			getPartition: () => getActivePartition(store),
			shouldOpenExternal: () => getMetadata().openExternalInBrowser !== false,
		});
	});

	app.on('before-quit', () => {
		isQuitting = true;
	});

	app.on('will-quit', () => {
		globalShortcut.unregisterAll();
	});

	app.whenReady().then(() => {
		app.setAppUserModelId('com.xernerx.app');
		try {
			app.setAsDefaultProtocolClient('xernerx');
		} catch {}
		tray = createSystemTray(
			iconPath,
			WEB_URL,
			() => win,
			() =>
				toggleOverlayWindow({
					webUrl: WEB_URL,
					preloadPath,
					iconPath,
					partition: getActivePartition(store),
				}),
			() => {
				isQuitting = true;
			}
		);
		syncGlobalHotkey(meta.globalHotkey !== false, () => win);
		syncDiscordRpc(meta.discordRpc !== false);
		if (!app.isPackaged) {
			let relaunchTimer: NodeJS.Timeout | null = null;
			try {
				fs.watch(__dirname, (_event, filename) => {
					if (filename && filename.endsWith('.js')) {
						if (relaunchTimer) clearTimeout(relaunchTimer);
						relaunchTimer = setTimeout(() => {
							app.relaunch();
							app.exit(0);
						}, 600);
					}
				});
			} catch {}
		}
		createWindow();
	});
}
