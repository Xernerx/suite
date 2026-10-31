/** @format */

import { BrowserWindow, Tray, app, globalShortcut, ipcMain, nativeImage, screen, shell } from 'electron';
import Store from 'electron-store';
import { Terminal } from '@xernerx/terminal';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import {
	broadcastPowerState,
	captureAndDispatch,
	configureOsTaskbarAndDock,
	getPowerState,
	getStreamerState,
	handleJumpArgs,
	initDailyGiftMonitor,
	initPowerMonitor,
	relayLocalWebhook,
	syncDailyGiftSchedule,
	syncFeatureShortcuts,
	syncStreamerProtection,
	writeClipboardText,
} from './features.js';
import {
	STARTUP_LOCATION_URLS,
	type Metadata,
	broadcastMetadataUpdate,
	createSystemTray,
	loadEnvDomain,
	loadMetadata,
	normalizeStartupLocation,
	persistMetadata,
	resolveDesktopTargetUrl,
	syncGlobalHotkey,
	watchMetadataFile,
} from './metadata.js';
import { type DesktopNotificationPayload, applyWindowAppDetails, configureAppNotificationIdentity, dispatchNativeNotification, syncAppBadgeCount } from './notifications.js';
import {
	applyWindowsThumbarButtons,
	cancelClipboardGuard,
	getWebhookRelayHistory,
	guardClipboardSecret,
	promptSelectWatchFolder,
	recordAndBroadcastWebhookDelivery,
	setWindowProgressBar,
	syncCdnWatchFolder,
} from './desktopExtras.js';
import {
	type DockedSide,
	type LocalBotOpenTarget,
	captureDesktopSourceAndDispatch,
	configureLocalBotRunner,
	dispatchLocalFileToCdnUpload,
	extractUploadArgFile,
	getIdleState,
	getLocalBotRunnersState,
	getWindowDockedState,
	initIdleAndLockMonitor,
	listDesktopCaptureSources,
	lockIdlePrivacyShield,
	openLocalBotPathInTarget,
	prepareCdnDragFile,
	probeBotRunnerApiEndpoint,
	selectLocalBotDirectory,
	setWindowDockedMode,
	startLocalBot,
	startNativeCdnDrag,
	stopAllLocalBots,
	stopLocalBot,
	syncExplorerContextMenu,
	unlockIdlePrivacyShield,
	verifyOsBiometrics,
} from './nativeSuite.js';
import {
	configureFramelessWindow,
	getAccountsState,
	getActivePartition,
	getOverlayState,
	openCompanionWindow,
	removeAccountSlot,
	setOverlayGhostMode,
	setOverlayInteractiveHover,
	setOverlayOpacity,
	syncAccountSlotProfile,
	toggleOverlayWindow,
} from './overlay.js';
import { type RpcActivityPayload, syncDiscordRpc } from './rpc.js';
import { checkDesktopRelease, downloadAndInstallUpdate, runStartupUpdater } from './updater.js';

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, '../public/icon.ico');
const preloadPath = path.join(__dirname, 'preload.cjs');
if (!app.isPackaged) {
	app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
}
configureAppNotificationIdentity(iconPath, path.resolve(__dirname, '..'));
const isCanary = app.getVersion().includes('canary');
const domain = loadEnvDomain();
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
let pendingDeepLink: string | null = null;
let pendingBugReport: { dataUrl: string; filename: string; pageUrl: string; product?: string; timestamp: number } | null = null;

const desktopTerminal = new Terminal({
	title: 'XERNERX',
	scope: 'DESKTOP',
	format: ['title', 'scope', 'datetime', 'memory'],
	spin: false,
});

function log(message: string) {
	if (/error|failed|exception/i.test(message)) {
		desktopTerminal.error(message);
	} else if (/warn/i.test(message)) {
		desktopTerminal.warn(message);
	} else {
		desktopTerminal.log(message);
	}
	try {
		const file = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		fs.appendFileSync(file, `[${new Date().toISOString()}] ${message}\n`);
	} catch {}
}

export function getMetadata(forceReload = false): Metadata {
	return loadMetadata(store, log, forceReload);
}

function triggerQuickCapture(sourceType: 'screen' | 'clipboard' = 'screen') {
	void captureAndDispatch(sourceType, { getWin: () => win, log });
}

function resolveConfiguredStartupUrl(metaOverride?: Metadata): string {
	const currentMeta = metaOverride || getMetadata();
	const targetLocation = normalizeStartupLocation(currentMeta.startupLocation);
	const savedLastUrl = store.get('lastVisitedUrl') as string | undefined;
	if (targetLocation === 'last' && savedLastUrl && /^https?:\/\//i.test(savedLastUrl)) {
		return resolveDesktopTargetUrl(savedLastUrl, { isPackaged: app.isPackaged, isCanary, domain });
	}
	const locKey = targetLocation === 'last' ? 'dashboard' : targetLocation;
	const startupBaseUrl = STARTUP_LOCATION_URLS[locKey] || STARTUP_LOCATION_URLS.dashboard;
	return resolveDesktopTargetUrl(startupBaseUrl, { isPackaged: app.isPackaged, isCanary, domain });
}

function resolveDeepLinkUrl(rawDeepLink: string): string {
	try {
		const parsed = new URL(rawDeepLink);
		const urlParam = parsed.searchParams.get('url');
		if (urlParam && /^https?:\/\//i.test(urlParam)) {
			return resolveDesktopTargetUrl(urlParam, { isPackaged: app.isPackaged, isCanary, domain });
		}
	} catch {}

	const stripped = rawDeepLink.replace(/^xernerx:\/\//i, '').replace(/^\/+/, '');
	if (!stripped || stripped.toLowerCase() === 'open') {
		return resolveConfiguredStartupUrl();
	}

	const slashIdx = stripped.indexOf('/');
	const queryIdx = stripped.search(/[?#]/);
	const splitIdx = slashIdx !== -1 && (queryIdx === -1 || slashIdx < queryIdx) ? slashIdx : queryIdx;
	const firstSegment = (splitIdx === -1 ? stripped : stripped.slice(0, splitIdx)).toLowerCase();
	const remainder = splitIdx === -1 ? '' : stripped.slice(splitIdx);

	if (firstSegment in STARTUP_LOCATION_URLS) {
		const base = STARTUP_LOCATION_URLS[firstSegment as keyof typeof STARTUP_LOCATION_URLS];
		const combined = remainder ? `${base.replace(/\/$/, '')}${remainder.startsWith('/') ? remainder : '/' + remainder}` : base;
		return resolveDesktopTargetUrl(combined, { isPackaged: app.isPackaged, isCanary, domain });
	}

	const subPath = '/' + stripped;
	return WEB_URL + subPath;
}

function spawnCompanion(rawTargetUrl?: string) {
	const currentMeta = getMetadata();
	const fallbackUrl =
		win && !win.isDestroyed() && win.webContents.getURL().startsWith('http')
			? win.webContents.getURL()
			: resolveDesktopTargetUrl(STARTUP_LOCATION_URLS.dashboard, { isPackaged: app.isPackaged, isCanary, domain });
	const resolvedUrl =
		rawTargetUrl && /^https?:\/\//i.test(rawTargetUrl)
			? resolveDesktopTargetUrl(rawTargetUrl, { isPackaged: app.isPackaged, isCanary, domain })
			: rawTargetUrl
				? `${WEB_URL}${rawTargetUrl.startsWith('/') ? rawTargetUrl : '/' + rawTargetUrl}`
				: fallbackUrl;

	openCompanionWindow({
		targetUrl: resolvedUrl,
		preloadPath,
		iconPath,
		partition: getActivePartition(store),
		streamerMode: Boolean(currentMeta.streamerMode),
		shouldOpenExternal: () => getMetadata().openExternalInBrowser !== false,
	});
}

function applyRuntimeMetadata(targetMeta: Metadata) {
	if (win && !win.isDestroyed()) {
		win.setAlwaysOnTop(Boolean(targetMeta.alwaysOnTop));
		try {
			if (targetMeta.debug && !win.webContents.isDevToolsOpened()) {
				win.webContents.openDevTools({ mode: 'detach' });
			} else if (targetMeta.debug === false && win.webContents.isDevToolsOpened()) {
				win.webContents.closeDevTools();
			}
		} catch {}
	}
	syncGlobalHotkey(targetMeta.globalHotkey !== false, () => win);
	syncFeatureShortcuts(targetMeta, { getWin: () => win, onQuickCapture: triggerQuickCapture });
	syncStreamerProtection(targetMeta);
	broadcastPowerState(targetMeta, 'preference-changed');
	syncDiscordRpc(targetMeta.discordRpc !== false);
	syncCdnWatchFolder(targetMeta.cdnWatchFolder, { getWin: () => win, log });
	syncExplorerContextMenu(Boolean(targetMeta.explorerContextMenu), iconPath, log);
	broadcastMetadataUpdate(targetMeta);
}

export function saveMetadata(patch: Partial<Metadata>): Metadata {
	const updated = persistMetadata(store, patch, log);

	try {
		app.setLoginItemSettings({ openAtLogin: Boolean(updated.startOnBoot) });
	} catch {}

	applyRuntimeMetadata(updated);
	return updated;
}

export function relaunchApp(finalMeta?: Partial<Metadata>) {
	try {
		if (finalMeta && typeof finalMeta === 'object') {
			saveMetadata(finalMeta);
		}
	} catch {}

	isQuitting = true;
	try {
		globalShortcut.unregisterAll();
	} catch {}
	try {
		if (tray) {
			tray.destroy();
			tray = null;
		}
	} catch {}
	try {
		app.releaseSingleInstanceLock();
	} catch {}

	const appRoot = path.resolve(__dirname, '..');
	const rawArgs = process.argv
		.slice(1)
		.filter((arg) => !arg.startsWith('--jump=') && !arg.startsWith('--upload=') && !arg.startsWith('xernerx://'))
		.map((arg) => (arg === '.' ? appRoot : arg));
	const filteredArgs = rawArgs.length > 0 ? rawArgs : app.isPackaged ? [] : [appRoot];
	const relaunchArgs = filteredArgs.includes('--relaunch') ? filteredArgs : [...filteredArgs, '--relaunch'];

	log(`RELAUNCHING: args=${JSON.stringify(relaunchArgs)}`);
	app.relaunch({ args: relaunchArgs });
	app.exit(0);
}

watchMetadataFile(() => applyRuntimeMetadata(getMetadata(true)));

const meta = getMetadata(true);
const DEBUG = meta.debug === true;
if (meta.hardwareAcceleration === false) app.disableHardwareAcceleration();
try {
	app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512 --max-semi-space-size=16');
	app.commandLine.appendSwitch('renderer-process-limit', '4');
	app.commandLine.appendSwitch('disable-site-isolation-trials');
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
		movable: true,
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

async function waitForServer(targetUrl?: string) {
	sendStatus('Connecting...');
	let checkOrigin = WEB_URL;
	if (targetUrl) {
		try {
			checkOrigin = new URL(targetUrl).origin;
		} catch {}
	}
	const maxAttempts = 4;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		let retryLabel = 'Retrying';
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 4000);
			const res = await fetch(`${checkOrigin}/api/version`, { signal: controller.signal });
			clearTimeout(timeout);
			if (res.ok || (res.status >= 400 && res.status < 500)) {
				sendStatus('Ready');
				return;
			}
			const bodySnippet = await res.text().catch(() => '');
			const isTunnel1033 = res.status === 530 || /1033|Argo\s*Tunnel|Cloudflare\s*Tunnel/i.test(bodySnippet);
			retryLabel = isTunnel1033 ? 'Tunnel Error (1033) — Retrying' : `Server Error (${res.status}) — Retrying`;
			if (attempt === maxAttempts) {
				log(`WARNING: Server check returned HTTP ${res.status} after ${maxAttempts} attempts; proceeding to launch with error guard.`);
				return;
			}
		} catch (e) {
			retryLabel = 'Server Unreachable — Retrying';
			if (attempt === maxAttempts) {
				log(`WARNING: Server check timed out after ${maxAttempts} attempts (${(e as Error).message}); proceeding to launch.`);
				return;
			}
		}
		for (let s = 2; s > 0; s--) {
			sendStatus(`${retryLabel} in ${s}s`);
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
}

const updaterContext = {
	getWin: () => win,
	sendStatus,
	sendError,
	log,
	prepareQuit: () => {
		isQuitting = true;
		try {
			globalShortcut.unregisterAll();
		} catch {}
		try {
			if (tray) {
				tray.destroy();
				tray = null;
			}
		} catch {}
		try {
			app.releaseSingleInstanceLock();
		} catch {}
	},
};

async function runUpdater() {
	await runStartupUpdater(updaterContext, DEBUG);
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

	ipcMain.on('window:reload', (event, ignoreCache?: boolean) => {
		const target = BrowserWindow.fromWebContents(event.sender) || win;
		if (!target || target.isDestroyed()) return;
		if (ignoreCache) target.webContents.reloadIgnoringCache();
		else target.webContents.reload();
	});

	ipcMain.handle('window:isMaximized', (event) => {
		const target = BrowserWindow.fromWebContents(event.sender) || win;
		return target?.isMaximized() ?? false;
	});
	ipcMain.handle('metadata:get', () => getMetadata());
	ipcMain.handle('metadata:set', (_, patch: Partial<Metadata>) => saveMetadata(patch));
	ipcMain.handle('app:getPowerState', () => getPowerState(getMetadata()));
	ipcMain.handle('app:getStreamerState', () => getStreamerState(getMetadata()));
	ipcMain.handle('app:quickCapture', (_, sourceType?: 'screen' | 'clipboard') => captureAndDispatch(sourceType || 'screen', { getWin: () => win, log }));
	ipcMain.handle('app:captureBugReport', async (event, meta?: { pageUrl?: string; product?: string }) => {
		try {
			const sender = event.sender;
			const img = await sender.capturePage();
			const dataUrl = img.toDataURL();
			const payload = {
				dataUrl,
				filename: `xernerx-issue-${Date.now()}.png`,
				pageUrl: meta?.pageUrl || sender.getURL(),
				product: meta?.product || 'App',
				timestamp: Date.now(),
			};
			pendingBugReport = payload;
			return payload;
		} catch (err) {
			log(`WARNING: Bug report page capture failed: ${(err as Error)?.message || 'unknown'}`);
			return null;
		}
	});
	ipcMain.handle('app:consumeBugReport', () => {
		if (!pendingBugReport) return null;
		const report = pendingBugReport;
		pendingBugReport = null;
		if (Date.now() - report.timestamp > 5 * 60 * 1000) return null;
		return report;
	});
	ipcMain.handle('app:writeClipboardText', (_, text: string) => writeClipboardText(text));
	ipcMain.handle('app:guardClipboardSecret', (_, secret: string, ttlMs?: number) => guardClipboardSecret(secret, ttlMs));
	ipcMain.handle('app:cancelClipboardGuard', () => cancelClipboardGuard());
	ipcMain.handle('app:setProgressBar', (_, progress: number, mode?: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused') => setWindowProgressBar(win, progress, mode));
	ipcMain.handle('app:selectWatchFolder', async () => {
		const selected = await promptSelectWatchFolder(win);
		if (!selected) return null;
		return saveMetadata({ cdnWatchFolder: selected });
	});
	ipcMain.handle('app:clearWatchFolder', () => saveMetadata({ cdnWatchFolder: '' }));
	ipcMain.handle('app:relayWebhook', async (_, req: { url: string; botId?: string; events?: string[] }) => {
		const res = await relayLocalWebhook(req, log);
		return recordAndBroadcastWebhookDelivery(res);
	});
	ipcMain.handle('app:getWebhookHistory', () => getWebhookRelayHistory());
	ipcMain.handle('app:syncDailyGiftSchedule', (_, payload: { nextClaimAt?: string | number | null; streak?: number }) => syncDailyGiftSchedule(payload));
	ipcMain.handle('window:openCompanion', (_, targetUrl?: string) => {
		spawnCompanion(targetUrl);
		return true;
	});
	ipcMain.handle('overlay:getState', () => getOverlayState());
	ipcMain.handle('overlay:setGhostMode', (_, enabled: boolean) => setOverlayGhostMode(enabled));
	ipcMain.handle('overlay:setInteractiveHover', (_, hovering: boolean) => setOverlayInteractiveHover(hovering));
	ipcMain.handle('overlay:setOpacity', (_, opacity: number) => setOverlayOpacity(opacity));

	ipcMain.handle('window:getDockedState', () => getWindowDockedState());
	ipcMain.handle('window:setDockedMode', (_, side?: DockedSide) => setWindowDockedMode(win, side));

	ipcMain.handle('app:getIdleState', () => getIdleState());
	ipcMain.handle('app:unlockPrivacyShield', () => unlockIdlePrivacyShield());
	ipcMain.handle('app:lockPrivacyShield', () => lockIdlePrivacyShield());

	ipcMain.handle('cdn:prepareDragFile', (_, payload: { url: string; filename: string }) => prepareCdnDragFile(payload));
	ipcMain.on('cdn:startDrag', (event, payload: { url: string; filename?: string }) => {
		startNativeCdnDrag(event.sender, { url: payload?.url || '', filename: payload?.filename, iconPath });
	});

	const notifyBotCrash = (info: { botId: string; name: string; exitCode: number; lastLine: string }) => {
		dispatchNativeNotification(
			{
				title: `${info.name} Crashed (Exit ${info.exitCode})`,
				body: info.lastLine || 'Local bot process terminated unexpectedly.',
				link: resolveDesktopTargetUrl(`https://portal.xernerx.com/bots/${info.botId}`, { isPackaged: app.isPackaged, isCanary, domain }),
				urgency: 'critical',
				force: true,
			},
			{
				getWin: () => win,
				getTray: () => tray,
				getMeta: () => getMetadata(),
				webUrl: WEB_URL,
				iconPath,
				log,
			}
		);
	};

	ipcMain.handle('botRunner:getAll', () => getLocalBotRunnersState(store));
	ipcMain.handle('botRunner:selectDirectory', () => selectLocalBotDirectory(win));
	ipcMain.handle('botRunner:configure', (_, payload: { botId: string; name?: string; cwd?: string; command?: string; remove?: boolean }) => configureLocalBotRunner(store, payload));
	ipcMain.handle('botRunner:start', (_, botId: string) => startLocalBot(store, botId, { log, onCrash: notifyBotCrash }));
	ipcMain.handle('botRunner:stop', (_, botId: string) => stopLocalBot(store, botId));
	ipcMain.handle('botRunner:probeApi', (_, payload: { botId: string; url: string; method?: string }) => probeBotRunnerApiEndpoint(store, payload));
	ipcMain.handle('botRunner:openTarget', (_, payload: { cwd: string; target: LocalBotOpenTarget }) => openLocalBotPathInTarget(payload?.cwd, payload?.target));
	ipcMain.handle('botRunner:restart', async (_, botId: string) => {
		stopLocalBot(store, botId);
		await new Promise((r) => setTimeout(r, 350));
		return startLocalBot(store, botId, { log, onCrash: notifyBotCrash });
	});

	ipcMain.handle('capture:listSources', () => listDesktopCaptureSources());
	ipcMain.handle('capture:sourceToCdn', (_, sourceId?: string) => captureDesktopSourceAndDispatch(sourceId, { getWin: () => win, log }));

	ipcMain.handle('biometrics:verify', (_, reason?: string) => verifyOsBiometrics(reason));

	ipcMain.handle('app:clearCache', async () => {
		if (win && !win.isDestroyed()) await win.webContents.session.clearCache();
		return true;
	});

	ipcMain.handle('app:getLogs', () => {
		const logFile = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		try {
			if (!fs.existsSync(logFile)) log('Initialized debug log file');
			return {
				path: logFile,
				content: fs.readFileSync(logFile, 'utf-8'),
			};
		} catch {
			return {
				path: logFile,
				content: '',
			};
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

	const handleNotify = (_: unknown, payload: DesktopNotificationPayload) =>
		dispatchNativeNotification(payload, {
			getWin: () => win,
			getTray: () => tray,
			getMeta: () => getMetadata(),
			webUrl: WEB_URL,
			iconPath,
			log,
		});

	ipcMain.on('app:notify', handleNotify);
	ipcMain.handle('app:notify', handleNotify);

	ipcMain.on('app:setBadgeCount', (_, count: number) => {
		syncAppBadgeCount(
			count,
			() => tray,
			() => win
		);
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
		const fullUrl = targetPath.startsWith('http')
			? resolveDesktopTargetUrl(targetPath, { isPackaged: app.isPackaged, isCanary, domain })
			: `${WEB_URL}${targetPath.startsWith('/') ? targetPath : '/' + targetPath}`;
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
		relaunchApp();
		return true;
	});

	ipcMain.handle('app:checkForUpdate', () => checkDesktopRelease(log));
	ipcMain.handle('app:installUpdate', (_, targetInfo?: Parameters<typeof downloadAndInstallUpdate>[1]) => downloadAndInstallUpdate(updaterContext, targetInfo));

	ipcMain.on('app:restart', (_, finalMeta?: Partial<Metadata>) => {
		relaunchApp(finalMeta);
	});
	ipcMain.handle('app:restart', (_, finalMeta?: Partial<Metadata>) => {
		relaunchApp(finalMeta);
		return true;
	});
}

function createMainWindow(bounds: Electron.Rectangle) {
	registerIpcHandlers();
	const appIcon = nativeImage.createFromPath(iconPath);

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
			backgroundThrottling: true,
			spellcheck: false,
			partition: getActivePartition(store),
		},
	});

	const currentMeta = getMetadata();
	if (currentMeta.alwaysOnTop) win.setAlwaysOnTop(true);
	try {
		applyWindowAppDetails(win, iconPath);
		if (!appIcon.isEmpty()) win.setIcon(appIcon);
		win.setContentProtection(Boolean(currentMeta.streamerMode));
	} catch {}

	win.on('show', () => {
		try {
			if (!appIcon.isEmpty()) win.setIcon(appIcon);
			applyWindowsThumbarButtons(win, {
				webUrl: WEB_URL,
				onToggleOverlay: () =>
					toggleOverlayWindow({
						webUrl: WEB_URL,
						preloadPath,
						iconPath,
						partition: getActivePartition(store),
					}),
				onQuickCapture: () => triggerQuickCapture('screen'),
			});
		} catch {}
	});
	win.webContents.on('did-finish-load', () => {
		try {
			if (!appIcon.isEmpty()) win.setIcon(appIcon);
		} catch {}
	});

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
	win.on('focus', () => {
		if (!win || win.isDestroyed()) return;
		try {
			win.flashFrame(false);
		} catch {}
	});

	let crashCount = 0;
	win.webContents.on('render-process-gone', (_, details) => {
		log(`CRASH: ${JSON.stringify(details)}`);
		if (++crashCount > 3) return;
		setTimeout(() => win.reload(), 1000);
	});

	if (currentMeta.debug) {
		win.webContents.on('did-finish-load', () => log(`LOADED: ${win.webContents.getURL()}`));
		win.webContents.on('will-redirect', (_, url) => log(`REDIRECT: ${url}`));
	}

	const recordLastVisited = (url: string, httpResponseCode?: number) => {
		if (!url || !/^https?:\/\//i.test(url) || url.includes('/overlay')) return;
		if (typeof httpResponseCode === 'number' && httpResponseCode >= 500) return;
		try {
			store.set('lastVisitedUrl', url);
		} catch {}
	};
	win.webContents.on('did-navigate', (_event, url, httpResponseCode) => recordLastVisited(url, httpResponseCode));
	win.webContents.on('did-navigate-in-page', (_event, url) => recordLastVisited(url));

	win.webContents.on('before-input-event', (event, input) => {
		if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'n') {
			event.preventDefault();
			spawnCompanion();
			return;
		}
		if (app.isPackaged && !getMetadata().debug) {
			if (input.key === 'F12') event.preventDefault();
			if (input.control && input.shift && input.key.toLowerCase() === 'i') event.preventDefault();
		}
	});

	if (app.isPackaged && !currentMeta.debug) {
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

		const launchMeta = getMetadata();
		const initialDeepLink = pendingDeepLink || process.argv.find((arg) => arg.startsWith('xernerx://'));
		pendingDeepLink = null;
		const initialJumpArg = process.argv.find((arg) => arg.startsWith('--jump='));
		const jumpTarget = initialJumpArg?.split('=')[1];
		const isActionJump = jumpTarget === 'overlay' || jumpTarget === 'capture';
		const targetLocation = jumpTarget && !isActionJump ? normalizeStartupLocation(jumpTarget) : normalizeStartupLocation(launchMeta.startupLocation);
		const savedLastUrl = store.get('lastVisitedUrl') as string | undefined;

		let startupUrl: string;
		if (initialDeepLink) {
			startupUrl = resolveDeepLinkUrl(initialDeepLink);
		} else if (targetLocation === 'last' && savedLastUrl && /^https?:\/\//i.test(savedLastUrl)) {
			startupUrl = resolveDesktopTargetUrl(savedLastUrl, { isPackaged: app.isPackaged, isCanary, domain });
		} else {
			const locKey = targetLocation === 'last' ? 'dashboard' : targetLocation;
			const startupBaseUrl = STARTUP_LOCATION_URLS[locKey] || STARTUP_LOCATION_URLS.dashboard;
			startupUrl = resolveDesktopTargetUrl(startupBaseUrl, { isPackaged: app.isPackaged, isCanary, domain });
		}

		await waitForServer(startupUrl);

		sendStatus('Launching...');
		createMainWindow(bounds);

		log(`STARTUP URL: ${startupUrl} (location=${targetLocation}, configured=${launchMeta.startupLocation})`);
		await win.loadURL(startupUrl).catch(async (err) => {
			if (err?.errno === -3 || err?.code === 'ERR_ABORTED') return;
			log(`WARNING: Initial loadURL(${startupUrl}) failed (${err?.message || err}); retrying in 1s...`);
			await new Promise((r) => setTimeout(r, 1000));
			await win.loadURL(startupUrl).catch((retryErr) => {
				if (retryErr?.errno !== -3 && retryErr?.code !== 'ERR_ABORTED') {
					log(`WARNING: Retry loadURL(${startupUrl}) failed (${retryErr?.message || retryErr}); showing error recovery window.`);
				}
			});
		});

		if (jumpTarget === 'overlay') {
			toggleOverlayWindow({
				webUrl: WEB_URL,
				preloadPath,
				iconPath,
				partition: getActivePartition(store),
			});
		} else if (jumpTarget === 'capture') {
			triggerQuickCapture('screen');
		}

		if (launchMeta.startMinimized) {
			if (launchMeta.minimizeOnClose && tray) {
				win.hide();
			} else {
				win.showInactive();
				win.minimize();
			}
		} else {
			if (launchMeta.startMaximized) {
				win.maximize();
			}
			win.show();
			win.focus();
		}

		configureOsTaskbarAndDock({
			iconPath,
			webUrl: WEB_URL,
			getWin: () => win,
			getMeta: () => getMetadata(),
			onToggleOverlay: () =>
				toggleOverlayWindow({
					webUrl: WEB_URL,
					preloadPath,
					iconPath,
					partition: getActivePartition(store),
				}),
			onQuickCapture: triggerQuickCapture,
			onToggleStreamerMode: (enabled) => saveMetadata({ streamerMode: enabled }),
			onToggleDiscordRpc: (enabled) => saveMetadata({ discordRpc: enabled }),
		});

		syncStreamerProtection(launchMeta);
		syncCdnWatchFolder(launchMeta.cdnWatchFolder, { getWin: () => win, log });
		syncExplorerContextMenu(Boolean(launchMeta.explorerContextMenu), iconPath, log);
		broadcastPowerState(launchMeta, 'init');

		const initialUploadFile = extractUploadArgFile(process.argv);
		if (initialUploadFile) {
			setTimeout(() => {
				dispatchLocalFileToCdnUpload(initialUploadFile, { getWin: () => win, log });
			}, 1500);
		}

		if (launchMeta.debug) {
			setTimeout(() => {
				if (win && !win.isDestroyed()) {
					win.webContents.openDevTools({ mode: 'detach' });
				}
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

let gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock && process.argv.includes('--relaunch')) {
	const deadline = Date.now() + 3000;
	while (!gotTheLock && Date.now() < deadline) {
		try {
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
		} catch {}
		gotTheLock = app.requestSingleInstanceLock();
	}
}

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (_event, commandLine) => {
		const uploadFile = extractUploadArgFile(commandLine);
		if (uploadFile) {
			if (win && !win.isDestroyed()) {
				if (win.isMinimized()) win.restore();
				win.show();
				win.focus();
			}
			dispatchLocalFileToCdnUpload(uploadFile, { getWin: () => win, log });
			return;
		}
		const handledJump = handleJumpArgs(commandLine, {
			webUrl: WEB_URL,
			getWin: () => win,
			onToggleOverlay: () =>
				toggleOverlayWindow({
					webUrl: WEB_URL,
					preloadPath,
					iconPath,
					partition: getActivePartition(store),
				}),
			onQuickCapture: triggerQuickCapture,
		});
		if (handledJump) return;

		if (win && !win.isDestroyed()) {
			if (win.isMinimized()) win.restore();
			win.show();
			win.focus();

			const deepLink = commandLine.find((arg) => arg.startsWith('xernerx://'));
			if (deepLink) {
				win.loadURL(resolveDeepLinkUrl(deepLink)).catch(() => {});
			}
		}
	});

	app.on('open-url', (event, rawUrl) => {
		event.preventDefault();
		if (win && !win.isDestroyed()) {
			if (win.isMinimized()) win.restore();
			win.show();
			win.focus();
			win.loadURL(resolveDeepLinkUrl(rawUrl)).catch(() => {});
		} else {
			pendingDeepLink = rawUrl;
		}
	});

	app.on('browser-window-created', (_event, childWin) => {
		if (childWin === splash) return;
		try {
			applyWindowAppDetails(childWin, iconPath);
			const appIcon = nativeImage.createFromPath(iconPath);
			if (!appIcon.isEmpty()) childWin.setIcon(appIcon);
			childWin.setContentProtection(Boolean(getMetadata().streamerMode));
		} catch {}
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
		stopAllLocalBots();
		syncDiscordRpc(false);
	});

	app.whenReady().then(() => {
		registerIpcHandlers();
		configureAppNotificationIdentity(iconPath, path.resolve(__dirname, '..'));
		initPowerMonitor(() => getMetadata(), log);
		initIdleAndLockMonitor(() => getMetadata(), log);
		initDailyGiftMonitor(
			() => getMetadata(),
			(streak) => {
				dispatchNativeNotification(
					{
						title: 'Daily Mystery Gift Ready!',
						body: streak > 0 ? `Your ${streak}-day streak reward is ready to claim!` : 'Your daily credit reward is ready to claim!',
						link: '/dashboard',
					},
					{
						getWin: () => win,
						getTray: () => tray,
						getMeta: () => getMetadata(),
						webUrl: WEB_URL,
						iconPath,
						log,
					}
				);
			}
		);
		try {
			if (process.defaultApp && process.argv.length >= 2) {
				app.setAsDefaultProtocolClient('xernerx', process.execPath, [path.resolve(process.argv[1])]);
			} else {
				app.setAsDefaultProtocolClient('xernerx');
			}
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
			},
			{
				getMeta: () => getMetadata(),
				onToggleNotifications: (enabled) => {
					saveMetadata({ desktopNotifications: enabled });
				},
				onToggleStreamerMode: (enabled) => {
					saveMetadata({ streamerMode: enabled });
				},
				onToggleDiscordRpc: (enabled) => {
					saveMetadata({ discordRpc: enabled });
				},
				onQuickCapture: triggerQuickCapture,
				onOpenCompanionWindow: () => spawnCompanion(),
				onSetDockedMode: (side) => {
					setWindowDockedMode(win, side);
				},
				onRestart: () => {
					relaunchApp();
				},
			}
		);
		const readyMeta = getMetadata();
		syncGlobalHotkey(readyMeta.globalHotkey !== false, () => win);
		syncFeatureShortcuts(readyMeta, { getWin: () => win, onQuickCapture: triggerQuickCapture });
		syncDiscordRpc(readyMeta.discordRpc !== false);
		if (!app.isPackaged) {
			let relaunchTimer: NodeJS.Timeout | null = null;
			try {
				fs.watch(__dirname, (_event, filename) => {
					if (filename && filename.endsWith('.js')) {
						if (relaunchTimer) clearTimeout(relaunchTimer);
						relaunchTimer = setTimeout(() => {
							relaunchApp();
						}, 600);
					}
				});
			} catch {}
		}
		createWindow();
	});
}
