/** @format */

import { BrowserWindow, Menu, Tray, app, globalShortcut, nativeImage } from 'electron';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx';
export type StartupLocation = 'last' | 'explore' | 'dashboard' | 'account' | 'store' | 'portal' | 'api' | 'docs' | 'cdn' | 'website' | 'help' | 'admin' | 'hosting';

export const STARTUP_LOCATION_URLS: Record<Exclude<StartupLocation, 'last'>, string> = {
	explore: 'https://app.xernerx.com',
	dashboard: 'https://app.xernerx.com/dashboard',
	account: 'https://account.xernerx.com',
	store: 'https://store.xernerx.com',
	portal: 'https://portal.xernerx.com',
	api: 'https://api.xernerx.com',
	docs: 'https://docs.xernerx.com',
	cdn: 'https://cdn.xernerx.com',
	website: 'https://www.xernerx.com',
	help: 'https://info.xernerx.com',
	admin: 'https://admin.xernerx.com',
	hosting: 'https://hosting.xernerx.com',
};

export function normalizeStartupLocation(raw?: string | null): StartupLocation {
	if (!raw || typeof raw !== 'string') return 'dashboard';
	const cleaned = raw.trim().toLowerCase();
	if (cleaned === 'last') return 'last';
	if (cleaned in STARTUP_LOCATION_URLS) {
		return cleaned as StartupLocation;
	}
	for (const [key, baseUrl] of Object.entries(STARTUP_LOCATION_URLS)) {
		if (cleaned === baseUrl.toLowerCase()) {
			return key as StartupLocation;
		}
	}
	return 'dashboard';
}

const SUBDOMAIN_TO_PORT: Record<string, string> = {
	www: '4000',
	api: '4001',
	cdn: '4002',
	account: '4003',
	app: '4004',
	docs: '4005',
	admin: '4006',
	info: '4007',
	store: '4008',
	portal: '4009',
	hosting: '4010',
};

const PORT_TO_SUBDOMAIN: Record<string, string> = {
	'4000': 'www',
	'4001': 'api',
	'4002': 'cdn',
	'4003': 'account',
	'4004': 'app',
	'4005': 'docs',
	'4006': 'admin',
	'4007': 'info',
	'4008': 'store',
	'4009': 'portal',
	'4010': 'hosting',
};

export function loadEnvDomain(): string {
	const existing = (process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || '').trim();
	if (existing) return existing;
	const candidates = [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')];
	for (const envFile of candidates) {
		try {
			if (!fs.existsSync(envFile)) continue;
			const content = fs.readFileSync(envFile, 'utf-8');
			for (const rawLine of content.split(/\r?\n/)) {
				const line = rawLine.trim();
				if (!line || line.startsWith('#')) continue;
				const match = line.match(/^(?:NEXT_PUBLIC_DOMAIN|DOMAIN)\s*=\s*(.+)$/);
				if (match?.[1]) {
					const val = match[1].trim().replace(/^['"]|['"]$/g, '');
					if (val) {
						process.env.DOMAIN = val;
						process.env.NEXT_PUBLIC_DOMAIN = val;
						return val;
					}
				}
			}
		} catch {}
	}
	return '';
}

export function extractSuiteSubdomain(parsed: URL, customDomain?: string): string {
	const host = parsed.hostname.toLowerCase();
	const isHostIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
	if (host === 'localhost' || host === '127.0.0.1' || isHostIp) {
		return PORT_TO_SUBDOMAIN[parsed.port] || 'app';
	}
	const cleanDomain = (customDomain || 'xernerx.com').toLowerCase().replace(/^www\./, '');
	let stripped = host;
	for (const suffix of [`.${cleanDomain}`, '.xernerx.com']) {
		if (stripped.endsWith(suffix)) {
			stripped = stripped.slice(0, -suffix.length);
			break;
		}
	}
	if (stripped === cleanDomain || stripped === 'xernerx.com' || stripped === '') {
		return 'www';
	}
	stripped = stripped.replace(/\.(?:dev|canary)$/i, '');
	if (stripped === 'dev' || stripped === 'canary' || stripped === '') {
		return 'www';
	}
	return stripped in SUBDOMAIN_TO_PORT ? stripped : 'app';
}

export function resolveDesktopTargetUrl(baseUrl: string, opts: { isPackaged: boolean; isCanary: boolean; domain: string }): string {
	const { isPackaged, isCanary, domain } = opts;
	const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
	const isLocal = !isPackaged && (!domain || isIp || domain === 'localhost' || domain === '127.0.0.1');

	try {
		const parsed = new URL(baseUrl);
		const sub = extractSuiteSubdomain(parsed, domain);

		if (isLocal) {
			parsed.protocol = 'http:';
			parsed.port = SUBDOMAIN_TO_PORT[sub] || '4004';
			parsed.hostname = domain || '127.0.0.1';
			return parsed.toString().replace(/\/$/, parsed.pathname === '/' ? '' : '/');
		}

		const targetDomain = (!isPackaged && domain ? domain : 'xernerx.com').replace(/^www\./, '');
		const envSegment = isPackaged ? (isCanary ? '.canary' : '') : '.dev';
		parsed.protocol = 'https:';
		parsed.port = '';
		parsed.hostname = `${sub}${envSegment}.${targetDomain}`;
		return parsed.toString().replace(/\/$/, parsed.pathname === '/' ? '' : '/');
	} catch {
		return baseUrl;
	}
}

export type Metadata = {
	debug?: boolean;
	hardwareAcceleration?: boolean;
	startMinimized?: boolean;
	startMaximized?: boolean;
	startOnBoot?: boolean;
	alwaysOnTop?: boolean;
	minimizeOnClose?: boolean;
	globalHotkey?: boolean;
	globalQuickLauncher?: boolean;
	quickCaptureHotkey?: boolean;
	streamerMode?: boolean;
	batterySaver?: boolean;
	openExternalInBrowser?: boolean;
	discordRpc?: boolean;
	desktopNotifications?: boolean;
	dailyStreakReminder?: boolean;
	idlePrivacyShield?: boolean;
	idleAfkRpc?: boolean;
	explorerContextMenu?: boolean;
	cdnWatchFolder?: string;
	windowControls?: WindowControlsStyle;
	startupLocation?: StartupLocation;
};

export const DEFAULT_METADATA: Metadata = {
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
	cdnWatchFolder: '',
	windowControls: 'system',
	startupLocation: 'dashboard',
};

let cachedMetadata: Metadata | null = null;
let lastInternalWriteAt = 0;

export function sanitizeMetadata(raw?: Partial<Metadata> | null): Metadata {
	const merged = { ...DEFAULT_METADATA, ...(raw && typeof raw === 'object' ? raw : {}) };
	const validControls: WindowControlsStyle[] = ['system', 'windows', 'macos', 'xernerx'];
	return {
		...merged,
		debug: Boolean(merged.debug),
		hardwareAcceleration: merged.hardwareAcceleration !== false,
		startMinimized: Boolean(merged.startMinimized),
		startMaximized: Boolean(merged.startMaximized),
		startOnBoot: Boolean(merged.startOnBoot),
		alwaysOnTop: Boolean(merged.alwaysOnTop),
		minimizeOnClose: Boolean(merged.minimizeOnClose),
		globalHotkey: merged.globalHotkey !== false,
		globalQuickLauncher: Boolean(merged.globalQuickLauncher),
		quickCaptureHotkey: Boolean(merged.quickCaptureHotkey),
		streamerMode: Boolean(merged.streamerMode),
		batterySaver: merged.batterySaver !== false,
		openExternalInBrowser: merged.openExternalInBrowser !== false,
		discordRpc: merged.discordRpc !== false,
		desktopNotifications: merged.desktopNotifications !== false,
		dailyStreakReminder: merged.dailyStreakReminder !== false,
		idlePrivacyShield: Boolean(merged.idlePrivacyShield),
		idleAfkRpc: merged.idleAfkRpc !== false,
		explorerContextMenu: Boolean(merged.explorerContextMenu),
		cdnWatchFolder: typeof merged.cdnWatchFolder === 'string' ? merged.cdnWatchFolder.trim() : '',
		windowControls: validControls.includes(merged.windowControls as WindowControlsStyle) ? (merged.windowControls as WindowControlsStyle) : 'system',
		startupLocation: normalizeStartupLocation(merged.startupLocation),
	};
}

export function getMetadataFilePath(): string {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, 'metadata.json');
	}
	const projectMeta = path.resolve(__dirname, '../metadata.json');
	if (fs.existsSync(projectMeta) || fs.existsSync(path.resolve(__dirname, '../package.json'))) {
		return projectMeta;
	}
	return path.join(process.cwd(), 'metadata.json');
}

export function getUserMetadataFilePath(): string {
	return path.join(app.getPath('userData'), 'metadata.json');
}

function writeAndFlushFile(filePath: string, content: string): void {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	const fd = fs.openSync(filePath, 'w');
	try {
		fs.writeFileSync(fd, content, 'utf-8');
		fs.fsyncSync(fd);
	} finally {
		fs.closeSync(fd);
	}
}

export function loadMetadata(store: Store, log: (msg: string) => void, forceReload = false): Metadata {
	if (cachedMetadata && !forceReload) {
		return { ...cachedMetadata };
	}

	const primaryFile = getMetadataFilePath();
	const userFile = getUserMetadataFilePath();
	const lastSavedPrimaryRaw = store.get('lastSavedMetadataRaw') as string | undefined;
	const overrides = (store.get('metadataOverrides') as Partial<Metadata> | undefined) || {};

	let primaryRaw: string | null = null;
	let primaryData: Partial<Metadata> = {};
	try {
		log(`LOADING: ${primaryFile}`);
		if (fs.existsSync(primaryFile)) {
			primaryRaw = fs.readFileSync(primaryFile, 'utf-8');
			primaryData = JSON.parse(primaryRaw);
		}
	} catch {
		log(`WARNING: Failed to load ${primaryFile}`);
	}

	let userData: Partial<Metadata> = {};
	try {
		if (app.isPackaged && fs.existsSync(userFile)) {
			userData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
		}
	} catch {}

	const fileChangedExternally = !app.isPackaged && primaryRaw !== null && primaryRaw !== lastSavedPrimaryRaw;
	const resolved = fileChangedExternally
		? sanitizeMetadata({
				...DEFAULT_METADATA,
				...overrides,
				...userData,
				...primaryData,
			})
		: sanitizeMetadata({
				...DEFAULT_METADATA,
				...primaryData,
				...userData,
				...overrides,
			});

	cachedMetadata = resolved;

	try {
		store.set('metadataOverrides', resolved);
		if (primaryRaw !== null) {
			store.set('lastSavedMetadataRaw', primaryRaw);
		}
	} catch {}

	return { ...resolved };
}

export function persistMetadata(store: Store, patch: Partial<Metadata>, log: (msg: string) => void): Metadata {
	const current = loadMetadata(store, log, false);
	const updated = sanitizeMetadata({ ...current, ...patch });
	const serialized = JSON.stringify(updated, null, '\t') + '\n';

	cachedMetadata = updated;
	lastInternalWriteAt = Date.now();

	const primaryFile = getMetadataFilePath();
	const userFile = getUserMetadataFilePath();

	try {
		store.set('metadataOverrides', updated);
	} catch {}

	let wrotePrimary = false;
	try {
		writeAndFlushFile(primaryFile, serialized);
		store.set('lastSavedMetadataRaw', serialized);
		wrotePrimary = true;
		log(`SAVED: ${primaryFile}`);
	} catch {
		try {
			if (fs.existsSync(primaryFile)) {
				store.set('lastSavedMetadataRaw', fs.readFileSync(primaryFile, 'utf-8'));
			}
		} catch {}
		log(`WARNING: Could not write directly to ${primaryFile}, persisting to userData metadata.json`);
	}

	if (app.isPackaged || !wrotePrimary) {
		try {
			writeAndFlushFile(userFile, serialized);
			if (!wrotePrimary) {
				log(`SAVED: ${userFile}`);
			}
		} catch {}
	}

	return { ...updated };
}

export function broadcastMetadataUpdate(updated: Metadata) {
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			bw.webContents.send('metadata:updated', updated);
		}
	}
}

export function watchMetadataFile(onUpdate: () => void) {
	try {
		const metaFile = getMetadataFilePath();
		if (fs.existsSync(metaFile)) {
			fs.watchFile(metaFile, { interval: 1000 }, (curr, prev) => {
				if (curr.mtimeMs === prev.mtimeMs) return;
				if (Date.now() - lastInternalWriteAt < 1500) return;
				onUpdate();
			});
		}
	} catch {}
}

export function syncGlobalHotkey(enabled: boolean | undefined, getWin: () => BrowserWindow | undefined) {
	try {
		globalShortcut.unregister('CommandOrControl+Shift+X');
		if (enabled !== false) {
			globalShortcut.register('CommandOrControl+Shift+X', () => {
				const win = getWin();
				if (!win || win.isDestroyed()) return;
				if (win.isVisible() && win.isFocused()) {
					win.minimize();
				} else {
					if (win.isMinimized()) win.restore();
					win.show();
					win.focus();
				}
			});
		}
	} catch {}
}

export function createSystemTray(
	iconPath: string,
	webUrl: string,
	getWin: () => BrowserWindow | undefined,
	onToggleOverlay: () => void,
	onQuit: () => void,
	opts?: {
		getMeta?: () => Metadata;
		onToggleNotifications?: (enabled: boolean) => void;
		onToggleStreamerMode?: (enabled: boolean) => void;
		onToggleDiscordRpc?: (enabled: boolean) => void;
		onQuickCapture?: (sourceType: 'screen' | 'clipboard') => void;
		onOpenCompanionWindow?: () => void;
		onSetDockedMode?: (side: 'left' | 'right' | null) => void;
		onRestart?: () => void;
	}
): Tray | null {
	try {
		const pngFallback = path.join(path.dirname(iconPath), 'icon.png');
		const resolvedIconPath = process.platform === 'darwin' && fs.existsSync(pngFallback) ? pngFallback : fs.existsSync(iconPath) ? iconPath : pngFallback;
		if (!fs.existsSync(resolvedIconPath)) return null;

		let trayIcon = nativeImage.createFromPath(resolvedIconPath);
		if (process.platform === 'darwin' && !trayIcon.isEmpty()) {
			trayIcon = trayIcon.resize({ width: 18, height: 18 });
		}

		const tray = new Tray(trayIcon.isEmpty() ? resolvedIconPath : trayIcon);
		tray.setToolTip('Xernerx App');

		const buildMenu = () => {
			const currentMeta = opts?.getMeta?.() || DEFAULT_METADATA;
			return Menu.buildFromTemplate([
				{
					label: 'Open Xernerx',
					click: () => {
						const win = getWin();
						if (!win || win.isDestroyed()) return;
						if (win.isMinimized()) win.restore();
						win.show();
						win.focus();
					},
				},
				{
					label: 'New Companion Window (Ctrl+Shift+N)',
					click: () => opts?.onOpenCompanionWindow?.(),
				},
				{
					label: 'Docked Sidebar Mode',
					submenu: [
						{
							label: 'Snap Left Sidebar',
							click: () => opts?.onSetDockedMode?.('left'),
						},
						{
							label: 'Snap Right Sidebar',
							click: () => opts?.onSetDockedMode?.('right'),
						},
						{
							label: 'Restore Normal Window',
							click: () => opts?.onSetDockedMode?.(null),
						},
					],
				},
				{
					label: 'Live Overlay Monitor',
					click: () => onToggleOverlay(),
				},
				{
					label: 'Quick Screen Capture to CDN',
					click: () => opts?.onQuickCapture?.('screen'),
				},
				{
					label: 'Upload Clipboard Image to CDN',
					click: () => opts?.onQuickCapture?.('clipboard'),
				},
				{ type: 'separator' },
				{
					label: 'Dashboard',
					click: () => {
						const win = getWin();
						if (!win || win.isDestroyed()) return;
						win.show();
						win.focus();
						win.loadURL(`${webUrl}/dashboard`).catch(() => {});
					},
				},
				{
					label: 'Developer Portal',
					click: () => {
						const win = getWin();
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
				{ type: 'separator' },
				{
					label: 'Discord Rich Presence (RPC)',
					type: 'checkbox',
					checked: currentMeta.discordRpc !== false,
					click: (menuItem) => {
						opts?.onToggleDiscordRpc?.(menuItem.checked);
						tray.setContextMenu(buildMenu());
					},
				},
				{
					label: 'Desktop Notifications',
					type: 'checkbox',
					checked: currentMeta.desktopNotifications !== false,
					click: (menuItem) => {
						opts?.onToggleNotifications?.(menuItem.checked);
						tray.setContextMenu(buildMenu());
					},
				},
				{
					label: 'Streamer Protection (Anti-Capture)',
					type: 'checkbox',
					checked: Boolean(currentMeta.streamerMode),
					click: (menuItem) => {
						opts?.onToggleStreamerMode?.(menuItem.checked);
						tray.setContextMenu(buildMenu());
					},
				},
				{ type: 'separator' },
				{
					label: 'Restart App',
					click: () => {
						if (opts?.onRestart) {
							opts.onRestart();
						} else {
							app.relaunch();
							app.exit(0);
						}
					},
				},
				{
					label: 'Quit Xernerx',
					click: () => {
						onQuit();
						app.quit();
					},
				},
			]);
		};

		tray.setContextMenu(buildMenu());
		tray.on('click', () => {
			const win = getWin();
			if (!win || win.isDestroyed()) return;
			if (win.isMinimized()) win.restore();
			win.show();
			win.focus();
		});
		return tray;
	} catch {
		return null;
	}
}
