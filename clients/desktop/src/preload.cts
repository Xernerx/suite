/** @format */

const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('../package.json');

const fs = require('fs');
const path = require('path');

let metadata: Record<string, any> = {
	debug: false,
	hardwareAcceleration: true,
	startMinimized: false,
	startMaximized: false,
	startOnBoot: false,
	alwaysOnTop: false,
	minimizeOnClose: false,
	globalHotkey: true,
	globalQuickLauncher: false,
	quickCaptureHotkey: false,
	streamerMode: false,
	batterySaver: true,
	openExternalInBrowser: true,
	discordRpc: true,
	desktopNotifications: true,
	dailyStreakReminder: true,
	idlePrivacyShield: false,
	idleAfkRpc: true,
	explorerContextMenu: false,
	windowControls: 'system',
	startupLocation: 'dashboard',
	cdnWatchFolder: '',
};

try {
	const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
	const candidates = [
		appDataDir ? path.join(appDataDir, 'Xernerx App', 'metadata.json') : '',
		path.resolve(__dirname, '../metadata.json'),
		process.resourcesPath ? path.join(process.resourcesPath, 'metadata.json') : '',
		path.join(process.cwd(), 'metadata.json'),
	].filter(Boolean);

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
			if (parsed && typeof parsed === 'object') {
				metadata = { ...metadata, ...parsed };
				break;
			}
		}
	}
} catch {}

ipcRenderer
	.invoke('metadata:get')
	.then((latest: any) => {
		if (latest && typeof latest === 'object') {
			metadata = { ...metadata, ...latest };
		}
	})
	.catch(() => {});

const metadataListeners = new Set<(meta: Record<string, any>) => void>();
let inFlightMetadataPromise: Promise<Record<string, any>> | null = null;

function notifyMetadataListeners(updated: Record<string, any>) {
	if (!updated || typeof updated !== 'object') return;
	metadata = { ...metadata, ...updated };
	for (const listener of metadataListeners) {
		try {
			listener({ ...metadata });
		} catch {}
	}
	if (typeof window !== 'undefined') {
		try {
			window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: { ...metadata } }));
		} catch {}
	}
}

ipcRenderer.on('metadata:updated', (_: any, updated: any) => {
	notifyMetadataListeners(updated);
});

contextBridge.exposeInMainWorld('electron', {
	minimize: () => ipcRenderer.send('window:minimize'),
	maximize: () => ipcRenderer.send('window:maximize'),
	close: () => ipcRenderer.send('window:close'),
	isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
	getMetadata: () => {
		if (!inFlightMetadataPromise) {
			inFlightMetadataPromise = ipcRenderer
				.invoke('metadata:get')
				.then((res: any) => {
					if (res && typeof res === 'object') {
						metadata = { ...metadata, ...res };
					}
					return { ...metadata };
				})
				.catch(() => ({ ...metadata }))
				.finally(() => {
					inFlightMetadataPromise = null;
				});
		}
		return inFlightMetadataPromise;
	},
	updateMetadata: async (patch: Record<string, any>) => {
		const updated = await ipcRenderer.invoke('metadata:set', patch);
		if (updated && typeof updated === 'object') {
			notifyMetadataListeners(updated);
			return { ...metadata };
		}
		notifyMetadataListeners(patch);
		return { ...metadata };
	},
	onMetadataUpdated: (callback: (meta: any) => void) => {
		metadataListeners.add(callback);
		return () => {
			metadataListeners.delete(callback);
		};
	},
	getPowerState: () => ipcRenderer.invoke('app:getPowerState'),
	onPowerStateChange: (callback: (state: any) => void) => {
		const listener = (_: any, state: any) => callback(state);
		ipcRenderer.on('power:updated', listener);
		return () => ipcRenderer.removeListener('power:updated', listener);
	},
	getStreamerState: () => ipcRenderer.invoke('app:getStreamerState'),
	onStreamerStateChange: (callback: (state: any) => void) => {
		const listener = (_: any, state: any) => callback(state);
		ipcRenderer.on('streamer:updated', listener);
		return () => ipcRenderer.removeListener('streamer:updated', listener);
	},
	quickCapture: (sourceType?: 'screen' | 'clipboard') => ipcRenderer.invoke('app:quickCapture', sourceType || 'screen'),
	captureBugReport: (meta?: { pageUrl?: string; product?: string }) => ipcRenderer.invoke('app:captureBugReport', meta),
	consumeBugReport: () => ipcRenderer.invoke('app:consumeBugReport'),
	onQuickCapture: (callback: (payload: any) => void) => {
		const listener = (_: any, payload: any) => callback(payload);
		ipcRenderer.on('capture:ready', listener);
		return () => ipcRenderer.removeListener('capture:ready', listener);
	},
	writeClipboardText: (text: string) => ipcRenderer.invoke('app:writeClipboardText', text),
	guardClipboardSecret: (secret: string, ttlMs?: number) => ipcRenderer.invoke('app:guardClipboardSecret', secret, ttlMs),
	cancelClipboardGuard: () => ipcRenderer.invoke('app:cancelClipboardGuard'),
	onClipboardGuardState: (callback: (payload: any) => void) => {
		const listener = (_: any, payload: any) => callback(payload);
		ipcRenderer.on('clipboard:guardState', listener);
		return () => ipcRenderer.removeListener('clipboard:guardState', listener);
	},
	setProgressBar: (progress: number, mode?: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused') => ipcRenderer.invoke('app:setProgressBar', progress, mode),
	selectWatchFolder: () => ipcRenderer.invoke('app:selectWatchFolder'),
	clearWatchFolder: () => ipcRenderer.invoke('app:clearWatchFolder'),
	onQuickLaunch: (callback: () => void) => {
		const listener = () => callback();
		ipcRenderer.on('launcher:open', listener);
		return () => ipcRenderer.removeListener('launcher:open', listener);
	},
	clearCache: () => ipcRenderer.invoke('app:clearCache'),
	getLogs: () => ipcRenderer.invoke('app:getLogs'),
	openLogs: () => ipcRenderer.invoke('app:openLogs'),
	openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
	notify: (payload: { id?: string; title: string; body?: string; subtitle?: string; link?: string | null; silent?: boolean; urgency?: 'normal' | 'critical' | 'low'; force?: boolean }) =>
		ipcRenderer.invoke('app:notify', payload),
	setBadgeCount: (count: number) => ipcRenderer.send('app:setBadgeCount', count),
	onNotificationClick: (callback: (payload: any) => void) => {
		const listener = (_: any, payload: any) => callback(payload);
		ipcRenderer.on('notification:clicked', listener);
		return () => ipcRenderer.removeListener('notification:clicked', listener);
	},
	setActivity: (activity: { details?: string; state?: string }) => {
		if (metadata.discordRpc === false) return;
		ipcRenderer.send('rpc:setActivity', activity);
	},
	toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
	getOverlayState: () => ipcRenderer.invoke('overlay:getState'),
	setOverlayGhostMode: (enabled: boolean) => ipcRenderer.invoke('overlay:setGhostMode', enabled),
	setOverlayInteractiveHover: (hovering: boolean) => ipcRenderer.invoke('overlay:setInteractiveHover', hovering),
	setOverlayOpacity: (opacity: number) => ipcRenderer.invoke('overlay:setOpacity', opacity),
	onOverlayStateChange: (callback: (state: any) => void) => {
		const listener = (_: any, state: any) => callback(state);
		ipcRenderer.on('overlay:state', listener);
		return () => ipcRenderer.removeListener('overlay:state', listener);
	},
	openCompanionWindow: (targetUrl?: string) => ipcRenderer.invoke('window:openCompanion', targetUrl),
	getDockedState: () => ipcRenderer.invoke('window:getDockedState'),
	setDockedMode: (side?: 'left' | 'right' | null) => ipcRenderer.invoke('window:setDockedMode', side),
	onDockedStateChange: (callback: (state: any) => void) => {
		const listener = (_: any, state: any) => callback(state);
		ipcRenderer.on('window:dockedState', listener);
		return () => ipcRenderer.removeListener('window:dockedState', listener);
	},
	getIdleState: () => ipcRenderer.invoke('app:getIdleState'),
	unlockPrivacyShield: () => ipcRenderer.invoke('app:unlockPrivacyShield'),
	lockPrivacyShield: () => ipcRenderer.invoke('app:lockPrivacyShield'),
	onIdleStateChange: (callback: (state: any) => void) => {
		const listener = (_: any, state: any) => callback(state);
		ipcRenderer.on('idle:updated', listener);
		return () => ipcRenderer.removeListener('idle:updated', listener);
	},
	prepareCdnDragFile: (payload: { url: string; filename: string }) => ipcRenderer.invoke('cdn:prepareDragFile', payload),
	startCdnDrag: (payload: { url: string; filename?: string }) => ipcRenderer.send('cdn:startDrag', payload),
	getBotRunners: () => ipcRenderer.invoke('botRunner:getAll'),
	selectBotRunnerDirectory: () => ipcRenderer.invoke('botRunner:selectDirectory'),
	configureBotRunner: (payload: { botId: string; name?: string; cwd?: string; command?: string; remove?: boolean }) => ipcRenderer.invoke('botRunner:configure', payload),
	startBotRunner: (botId: string) => ipcRenderer.invoke('botRunner:start', botId),
	stopBotRunner: (botId: string) => ipcRenderer.invoke('botRunner:stop', botId),
	restartBotRunner: (botId: string) => ipcRenderer.invoke('botRunner:restart', botId),
	probeBotRunnerApi: (payload: { botId: string; url: string; method?: string }) => ipcRenderer.invoke('botRunner:probeApi', payload),
	openBotRunnerTarget: (payload: { cwd: string; target: 'vscode' | 'cursor' | 'terminal' | 'explorer' }) => ipcRenderer.invoke('botRunner:openTarget', payload),
	onBotRunnersChange: (callback: (states: any[]) => void) => {
		const listener = (_: any, states: any[]) => callback(states);
		ipcRenderer.on('botRunner:updated', listener);
		return () => ipcRenderer.removeListener('botRunner:updated', listener);
	},
	listCaptureSources: () => ipcRenderer.invoke('capture:listSources'),
	captureSourceToCdn: (sourceId?: string) => ipcRenderer.invoke('capture:sourceToCdn', sourceId),
	verifyBiometrics: (reason?: string) => ipcRenderer.invoke('biometrics:verify', reason),
	relayLocalWebhook: (req: { url: string; botId?: string; events?: string[] }) => ipcRenderer.invoke('app:relayWebhook', req),
	getWebhookHistory: () => ipcRenderer.invoke('app:getWebhookHistory'),
	onWebhookDelivery: (callback: (payload: any) => void) => {
		const listener = (_: any, payload: any) => callback(payload);
		ipcRenderer.on('webhook:delivery', listener);
		return () => ipcRenderer.removeListener('webhook:delivery', listener);
	},
	syncDailyGiftSchedule: (payload: { nextClaimAt?: string | number | null; streak?: number }) => ipcRenderer.invoke('app:syncDailyGiftSchedule', payload),
	navigateMain: (targetPath: string) => ipcRenderer.send('overlay:navigateMain', targetPath),
	getAccounts: () => ipcRenderer.invoke('accounts:get'),
	syncAccountProfile: (profile: { id?: string; username?: string; globalName?: string; avatar?: string }) => ipcRenderer.invoke('accounts:sync', profile),
	switchAccount: (slot: string) => ipcRenderer.invoke('accounts:switch', slot),
	removeAccount: (slot: string) => ipcRenderer.invoke('accounts:remove', slot),
	checkForUpdate: () => ipcRenderer.invoke('app:checkForUpdate'),
	installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
	onUpdateProgress: (callback: (payload: any) => void) => {
		const listener = (_: any, payload: any) => callback(payload);
		ipcRenderer.on('update:progress', listener);
		return () => ipcRenderer.removeListener('update:progress', listener);
	},
	restart: (finalMeta?: Record<string, any>) => ipcRenderer.invoke('app:restart', finalMeta),
	onStatus: (callback: any) => {
		ipcRenderer.on('startup:status', (_: any, message: any) => {
			callback(message);
		});
	},
	onError: (callback: any) => {
		ipcRenderer.on('startup:error', (_: any, message: any) => {
			callback(message);
		});
	},
	version,
	get metadata() {
		return { ...metadata };
	},
});
