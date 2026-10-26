/** @format */

import { BrowserWindow, Menu, app, clipboard, desktopCapturer, globalShortcut, nativeImage, powerMonitor } from 'electron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { STARTUP_LOCATION_URLS, loadEnvDomain, normalizeStartupLocation, resolveDesktopTargetUrl, type Metadata } from './metadata.js';

export interface DesktopPowerState {
	onBattery: boolean;
	batterySaverEnabled: boolean;
	effectiveBatterySaver: boolean;
	lastResumeAt: number | null;
	event?: 'init' | 'on-battery' | 'on-ac' | 'suspend' | 'resume' | 'unlock-screen' | 'preference-changed';
}

export interface DesktopStreamerState {
	streamerMode: boolean;
	contentProtected: boolean;
	broadcasterDetected: boolean;
	broadcasterName: string | null;
}

export interface QuickCapturePayload {
	dataUrl: string;
	filename: string;
	sourceType: 'screen' | 'clipboard';
	timestamp: number;
}

let lastResumeAt: number | null = null;
let cachedBroadcaster: string | null = null;
let powerMonitorInitialized = false;

const BROADCASTER_PROCESSES = ['obs64', 'obs32', 'obs', 'streamlabs', 'xsplit', 'bdcam', 'action!'];

export function getPowerState(meta: Metadata, event: DesktopPowerState['event'] = 'init'): DesktopPowerState {
	let onBattery = false;
	try {
		onBattery = typeof powerMonitor.isOnBatteryPower === 'function' ? powerMonitor.isOnBatteryPower() : false;
	} catch {}
	const batterySaverEnabled = meta.batterySaver !== false;
	return {
		onBattery,
		batterySaverEnabled,
		effectiveBatterySaver: batterySaverEnabled && onBattery,
		lastResumeAt,
		event,
	};
}

export function broadcastPowerState(meta: Metadata, event: DesktopPowerState['event'] = 'preference-changed') {
	const state = getPowerState(meta, event);
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			bw.webContents.send('power:updated', state);
		}
	}
	return state;
}

export function initPowerMonitor(getMeta: () => Metadata, log: (msg: string) => void) {
	if (powerMonitorInitialized) return;
	powerMonitorInitialized = true;

	try {
		powerMonitor.on('on-battery', () => {
			log('POWER: Switched to battery power');
			broadcastPowerState(getMeta(), 'on-battery');
		});
		powerMonitor.on('on-ac', () => {
			log('POWER: Switched to AC power');
			broadcastPowerState(getMeta(), 'on-ac');
		});
		powerMonitor.on('suspend', () => {
			log('POWER: System suspending');
			broadcastPowerState(getMeta(), 'suspend');
		});
		powerMonitor.on('resume', () => {
			lastResumeAt = Date.now();
			log('POWER: System resumed from sleep');
			broadcastPowerState(getMeta(), 'resume');
		});
		powerMonitor.on('unlock-screen', () => {
			lastResumeAt = Date.now();
			broadcastPowerState(getMeta(), 'unlock-screen');
		});
	} catch {}
}

export function detectBroadcasterProcess(): Promise<string | null> {
	return new Promise((resolve) => {
		const cmd = process.platform === 'win32' ? 'tasklist /NH /FO CSV' : 'ps -A -o comm=';
		exec(cmd, { timeout: 2500, windowsHide: true }, (err, stdout) => {
			if (err || !stdout) {
				resolve(cachedBroadcaster);
				return;
			}
			const lower = stdout.toLowerCase();
			const match = BROADCASTER_PROCESSES.find((proc) => lower.includes(proc));
			cachedBroadcaster = match ? match.toUpperCase() : null;
			resolve(cachedBroadcaster);
		});
	});
}

export function getStreamerState(meta: Metadata): DesktopStreamerState {
	const enabled = Boolean(meta.streamerMode);
	return {
		streamerMode: enabled,
		contentProtected: enabled,
		broadcasterDetected: Boolean(cachedBroadcaster),
		broadcasterName: cachedBroadcaster,
	};
}

export function syncStreamerProtection(meta: Metadata) {
	const enabled = Boolean(meta.streamerMode);
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			try {
				bw.setContentProtection(enabled);
			} catch {}
		}
	}

	if (!enabled) {
		cachedBroadcaster = null;
		const state = getStreamerState(meta);
		for (const bw of BrowserWindow.getAllWindows()) {
			if (!bw.isDestroyed()) {
				bw.webContents.send('streamer:updated', state);
			}
		}
		return;
	}

	void detectBroadcasterProcess().then(() => {
		const state = getStreamerState(meta);
		for (const bw of BrowserWindow.getAllWindows()) {
			if (!bw.isDestroyed()) {
				bw.webContents.send('streamer:updated', state);
			}
		}
	});
}

export async function captureAndDispatch(
	sourceType: 'screen' | 'clipboard',
	opts: {
		getWin: () => BrowserWindow | undefined;
		log: (msg: string) => void;
	}
): Promise<QuickCapturePayload | null> {
	try {
		let dataUrl = '';

		if (sourceType === 'clipboard') {
			const clipImg = await Promise.resolve((clipboard as any).readImage());
			if (clipImg && !clipImg.isEmpty()) {
				dataUrl = clipImg.toDataURL();
			}
		}

		if (!dataUrl && sourceType === 'screen') {
			const win = opts.getWin();
			if (win && !win.isDestroyed() && win.isVisible()) {
				try {
					const pageImg = await win.webContents.capturePage();
					if (pageImg && !pageImg.isEmpty()) {
						dataUrl = pageImg.toDataURL();
						try {
							await Promise.resolve((clipboard as any).writeImage(pageImg));
						} catch {}
					}
				} catch {}
			}
		}

		if (!dataUrl) {
			const sources = await desktopCapturer.getSources({
				types: ['screen'],
				thumbnailSize: { width: 1920, height: 1080 },
			});
			const primarySource = sources[0];
			if (primarySource && primarySource.thumbnail && !primarySource.thumbnail.isEmpty()) {
				dataUrl = primarySource.thumbnail.toDataURL();
				try {
					await Promise.resolve((clipboard as any).writeImage(primarySource.thumbnail));
				} catch {}
			}
		}

		if (!dataUrl) {
			opts.log(`WARNING: Quick capture (${sourceType}) found no image data`);
			return null;
		}

		const timestamp = Date.now();
		const filename = `xernerx-capture-${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.png`;
		const payload: QuickCapturePayload = {
			dataUrl,
			filename,
			sourceType,
			timestamp,
		};

		const win = opts.getWin();
		if (win && !win.isDestroyed()) {
			win.webContents.send('capture:ready', payload);
		}
		opts.log(`CAPTURE: Dispatched ${sourceType} snapshot (${filename})`);
		return payload;
	} catch (err) {
		opts.log(`WARNING: Quick capture failed: ${(err as Error)?.message || String(err)}`);
		return null;
	}
}

export async function writeClipboardText(text: string): Promise<boolean> {
	try {
		if (typeof text === 'string' && text.length > 0) {
			await Promise.resolve((clipboard as any).writeText(text));
			return true;
		}
	} catch {}
	return false;
}

export function syncFeatureShortcuts(
	meta: Metadata,
	opts: {
		getWin: () => BrowserWindow | undefined;
		onQuickCapture: (sourceType: 'screen' | 'clipboard') => void;
	}
) {
	try {
		globalShortcut.unregister('CommandOrControl+Shift+Space');
		if (meta.globalQuickLauncher === true) {
			globalShortcut.register('CommandOrControl+Shift+Space', () => {
				const win = opts.getWin();
				if (!win || win.isDestroyed()) return;
				if (win.isMinimized()) win.restore();
				win.show();
				win.focus();
				win.webContents.send('launcher:open');
			});
		}
	} catch {}

	try {
		globalShortcut.unregister('CommandOrControl+Shift+S');
		if (meta.quickCaptureHotkey === true) {
			globalShortcut.register('CommandOrControl+Shift+S', () => {
				opts.onQuickCapture('screen');
			});
		}
	} catch {}
}

export function configureOsTaskbarAndDock(opts: {
	iconPath: string;
	webUrl: string;
	getWin: () => BrowserWindow | undefined;
	getMeta: () => Metadata;
	onToggleOverlay: () => void;
	onQuickCapture: (sourceType: 'screen' | 'clipboard') => void;
	onToggleStreamerMode: (enabled: boolean) => void;
	onToggleDiscordRpc?: (enabled: boolean) => void;
}) {
	const appRoot = path.resolve(path.dirname(opts.iconPath), '..');
	const baseArgs = app.isPackaged ? [] : [appRoot];

	if (process.platform === 'win32') {
		const taskIconPath = fs.existsSync(opts.iconPath) ? opts.iconPath : process.execPath;
		try {
			app.setUserTasks([
				{
					program: process.execPath,
					arguments: [...baseArgs, '--jump=dashboard'].join(' '),
					iconPath: taskIconPath,
					iconIndex: 0,
					title: 'Server Dashboard',
					description: 'Open your Xernerx Server & Bot Dashboard',
				},
				{
					program: process.execPath,
					arguments: [...baseArgs, '--jump=portal'].join(' '),
					iconPath: taskIconPath,
					iconIndex: 0,
					title: 'Developer Portal',
					description: 'Manage bots, tokens, and developer tools',
				},
				{
					program: process.execPath,
					arguments: [...baseArgs, '--jump=overlay'].join(' '),
					iconPath: taskIconPath,
					iconIndex: 0,
					title: 'Toggle Live Overlay',
					description: 'Launch or hide the always-on-top telemetry overlay',
				},
				{
					program: process.execPath,
					arguments: [...baseArgs, '--jump=capture'].join(' '),
					iconPath: taskIconPath,
					iconIndex: 0,
					title: 'Quick Capture to CDN',
					description: 'Capture your screen and upload straight to Xernerx CDN',
				},
			]);
		} catch {}

		try {
			const win = opts.getWin();
			const pngPath = path.join(path.dirname(opts.iconPath), 'icon.png');
			const resolvedThumbPath = fs.existsSync(opts.iconPath) ? opts.iconPath : pngPath;
			if (win && !win.isDestroyed() && fs.existsSync(resolvedThumbPath)) {
				const thumbIcon = nativeImage.createFromPath(resolvedThumbPath).resize({ width: 16, height: 16 });
				if (!thumbIcon.isEmpty()) {
					win.setThumbarButtons([
						{
							tooltip: 'Live Overlay Monitor',
							icon: thumbIcon,
							click: () => opts.onToggleOverlay(),
						},
						{
							tooltip: 'Quick Capture to CDN',
							icon: thumbIcon,
							click: () => opts.onQuickCapture('screen'),
						},
					]);
				}
			}
		} catch {}
	}

	if (process.platform === 'darwin' && app.dock) {
		try {
			const currentMeta = opts.getMeta();
			const dockMenu = Menu.buildFromTemplate([
				{
					label: 'Server Dashboard',
					click: () => {
						const win = opts.getWin();
						if (!win || win.isDestroyed()) return;
						win.show();
						win.focus();
						win.loadURL(`${opts.webUrl}/dashboard`).catch(() => {});
					},
				},
				{
					label: 'Developer Portal',
					click: () => {
						const win = opts.getWin();
						if (!win || win.isDestroyed()) return;
						win.show();
						win.focus();
						const portalUrl = resolveDesktopTargetUrl(STARTUP_LOCATION_URLS.portal, {
							isPackaged: app.isPackaged,
							isCanary: app.getVersion().includes('canary'),
							domain: loadEnvDomain(),
						});
						win.loadURL(portalUrl).catch(() => {});
					},
				},
				{
					label: 'Live Overlay Monitor',
					click: () => opts.onToggleOverlay(),
				},
				{
					label: 'Quick Screen Capture to CDN',
					click: () => opts.onQuickCapture('screen'),
				},
				{ type: 'separator' },
				{
					label: 'Discord Rich Presence (RPC)',
					type: 'checkbox',
					checked: currentMeta.discordRpc !== false,
					click: (menuItem) => opts.onToggleDiscordRpc?.(menuItem.checked),
				},
				{
					label: 'Streamer Protection (Anti-Capture)',
					type: 'checkbox',
					checked: Boolean(currentMeta.streamerMode),
					click: (menuItem) => opts.onToggleStreamerMode(menuItem.checked),
				},
			]);
			app.dock.setMenu(dockMenu);
		} catch {}
	}
}

export function handleJumpArgs(
	commandLine: string[],
	opts: {
		webUrl: string;
		getWin: () => BrowserWindow | undefined;
		onToggleOverlay: () => void;
		onQuickCapture: (sourceType: 'screen' | 'clipboard') => void;
	}
): boolean {
	const jumpArg = commandLine.find((arg) => arg.startsWith('--jump='));
	if (!jumpArg) return false;

	const target = jumpArg.split('=')[1];
	const win = opts.getWin();

	if (target === 'overlay') {
		opts.onToggleOverlay();
		return true;
	}
	if (target === 'capture') {
		opts.onQuickCapture('screen');
		return true;
	}
	if (win && !win.isDestroyed()) {
		if (win.isMinimized()) win.restore();
		win.show();
		win.focus();
		if (target) {
			const loc = normalizeStartupLocation(target);
			const baseUrl = loc !== 'last' ? STARTUP_LOCATION_URLS[loc] : STARTUP_LOCATION_URLS.dashboard;
			const targetUrl = resolveDesktopTargetUrl(baseUrl, {
				isPackaged: app.isPackaged,
				isCanary: app.getVersion().includes('canary'),
				domain: loadEnvDomain(),
			});
			win.loadURL(targetUrl).catch(() => {});
		}
		return true;
	}
	return false;
}

export interface LocalWebhookRelayResult {
	ok: boolean;
	status: number;
	statusText: string;
	latencyMs: number;
	error?: string;
	delivery: {
		id: string;
		url: string;
		event: string;
		status: number;
		ok: boolean;
		latencyMs: number;
		responsePreview: string;
		error?: string;
		createdAt: string;
	};
}

export function isLocalTargetUrl(rawUrl: string): boolean {
	try {
		const parsed = new URL(rawUrl);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
		const h = parsed.hostname.toLowerCase();
		return (
			h === 'localhost' ||
			h === '127.0.0.1' ||
			h === '[::1]' ||
			h === '0.0.0.0' ||
			h.endsWith('.local') ||
			/^10\.\d+\.\d+\.\d+$/.test(h) ||
			/^192\.168\.\d+\.\d+$/.test(h) ||
			/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)
		);
	} catch {
		return false;
	}
}

export async function relayLocalWebhook(req: { url: string; botId?: string; events?: string[] }, log: (msg: string) => void): Promise<LocalWebhookRelayResult> {
	const eventName = req.events && req.events.length > 0 ? req.events[0] : 'POST vote';
	const deliveryId = `local-${Date.now().toString(36)}`;
	const createdAt = new Date().toISOString();

	if (!isLocalTargetUrl(req.url)) {
		return {
			ok: false,
			status: 400,
			statusText: 'Bad Request',
			latencyMs: 0,
			error: 'URL must be a local address (localhost, 127.0.0.1, or LAN IP)',
			delivery: {
				id: deliveryId,
				url: req.url,
				event: `${eventName} (Local Relay)`,
				status: 400,
				ok: false,
				latencyMs: 0,
				responsePreview: '',
				error: 'URL must be a local address',
				createdAt,
			},
		};
	}

	const start = performance.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);
		const bodyPayload = JSON.stringify({
			event: eventName,
			botId: req.botId || 'unknown',
			test: true,
			relay: 'xernerx-desktop',
			timestamp: createdAt,
			data: {
				user: 'DesktopLocalTester',
				points: 100,
			},
		});

		const res = await fetch(req.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Xernerx-Desktop-Webhook-Relay/2.2',
				'X-Xernerx-Event': eventName,
				'X-Xernerx-Delivery': deliveryId,
			},
			body: bodyPayload,
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const latencyMs = Math.max(1, Math.round(performance.now() - start));
		const text = await res.text().catch(() => '');
		const responsePreview = text.slice(0, 400);
		log(`LOCAL WEBHOOK RELAY: ${req.url} -> ${res.status} (${latencyMs}ms)`);

		return {
			ok: res.ok,
			status: res.status,
			statusText: res.statusText,
			latencyMs,
			error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
			delivery: {
				id: deliveryId,
				url: req.url,
				event: `${eventName} (Local Relay)`,
				status: res.status,
				ok: res.ok,
				latencyMs,
				responsePreview,
				error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
				createdAt,
			},
		};
	} catch (err: any) {
		const latencyMs = Math.max(1, Math.round(performance.now() - start));
		const errMsg = err?.message || 'Connection refused on local port';
		log(`LOCAL WEBHOOK RELAY ERROR: ${req.url} -> ${errMsg}`);
		return {
			ok: false,
			status: 0,
			statusText: 'Connection Refused',
			latencyMs,
			error: errMsg,
			delivery: {
				id: deliveryId,
				url: req.url,
				event: `${eventName} (Local Relay)`,
				status: 0,
				ok: false,
				latencyMs,
				responsePreview: '',
				error: errMsg,
				createdAt,
			},
		};
	}
}

let scheduledNextClaimMs: number | null = null;
let scheduledStreak = 0;
let lastNotifiedClaimCycle: number | null = null;
let dailyGiftTimer: NodeJS.Timeout | null = null;

export function syncDailyGiftSchedule(payload: { nextClaimAt?: string | number | null; streak?: number }): boolean {
	if (!payload) return false;
	if (typeof payload.streak === 'number') {
		scheduledStreak = payload.streak;
	}
	if (!payload.nextClaimAt) {
		scheduledNextClaimMs = null;
		return true;
	}
	const parsed = typeof payload.nextClaimAt === 'number' ? payload.nextClaimAt : new Date(payload.nextClaimAt).getTime();
	if (Number.isFinite(parsed) && parsed > 0) {
		if (parsed <= Date.now() && lastNotifiedClaimCycle === null) {
			lastNotifiedClaimCycle = parsed;
		}
		scheduledNextClaimMs = parsed;
	}
	return true;
}

export function initDailyGiftMonitor(getMeta: () => Metadata, onNotifyReady: (streak: number) => void) {
	if (dailyGiftTimer) clearInterval(dailyGiftTimer);
	dailyGiftTimer = setInterval(() => {
		if (!scheduledNextClaimMs) return;
		const meta = getMeta();
		if (meta.dailyStreakReminder === false || meta.desktopNotifications === false) return;
		const now = Date.now();
		if (now >= scheduledNextClaimMs && lastNotifiedClaimCycle !== scheduledNextClaimMs) {
			lastNotifiedClaimCycle = scheduledNextClaimMs;
			onNotifyReady(scheduledStreak);
		}
	}, 30000);
}
