/** @format */

import { BrowserWindow, screen, session, shell } from 'electron';
import Store from 'electron-store';

export interface DesktopAccountProfile {
	slot: string;
	id?: string;
	username?: string;
	globalName?: string;
	avatar?: string;
	lastActive: number;
}

let overlayWin: BrowserWindow | null = null;

export function getActivePartition(store: Store): string {
	const slot = (store.get('activeAccountSlot') as string) || 'default';
	return slot === 'default' ? 'persist:xernerx' : `persist:xernerx-${slot}`;
}

export function getAccountsState(store: Store): { activeSlot: string; accounts: DesktopAccountProfile[] } {
	const activeSlot = (store.get('activeAccountSlot') as string) || 'default';
	const stored = (store.get('desktopAccounts') as DesktopAccountProfile[] | undefined) || [];
	const bySlot = new Map<string, DesktopAccountProfile>();
	bySlot.set('default', { slot: 'default', lastActive: Date.now() });
	for (const acc of stored) {
		if (acc && typeof acc.slot === 'string') {
			bySlot.set(acc.slot, acc);
		}
	}
	if (!bySlot.has(activeSlot)) {
		bySlot.set(activeSlot, { slot: activeSlot, lastActive: Date.now() });
	}
	const accounts = Array.from(bySlot.values());
	if (stored.length !== accounts.length) {
		store.set('desktopAccounts', accounts);
	}
	return { activeSlot, accounts };
}

export function syncAccountSlotProfile(store: Store, profile: { id?: string; username?: string; globalName?: string; avatar?: string }) {
	const { activeSlot, accounts } = getAccountsState(store);
	const next = accounts.map((acc) =>
		acc.slot === activeSlot
			? {
					...acc,
					...profile,
					lastActive: Date.now(),
				}
			: acc
	);
	store.set('desktopAccounts', next);
	return { activeSlot, accounts: next };
}

export async function removeAccountSlot(store: Store, slot: string) {
	if (slot === 'default') return getAccountsState(store);
	const partName = `persist:xernerx-${slot}`;
	try {
		await session.fromPartition(partName).clearStorageData();
	} catch {}
	const { activeSlot, accounts } = getAccountsState(store);
	const nextAccounts = accounts.filter((a) => a.slot !== slot);
	store.set('desktopAccounts', nextAccounts);
	if (activeSlot === slot) {
		store.set('activeAccountSlot', 'default');
	}
	return getAccountsState(store);
}

const FALLBACK_HEADER_SCRIPT = `
(() => {
	if (document.getElementById('xernerx-electron-fallback-header') || document.querySelector('header')) return;
	document.documentElement.classList.add('is-electron');
	const bar = document.createElement('div');
	bar.id = 'xernerx-electron-fallback-header';
	bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:50px;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:#09090b;border-bottom:1px solid rgba(255,255,255,0.08);color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:700;-webkit-app-region:drag;user-select:none;';
	bar.innerHTML = \`
		<div style="display:flex;align-items:center;gap:8px;">
			<span style="color:#3b82f6;font-weight:800;letter-spacing:0.04em;">XERNERX</span>
			<span style="opacity:0.5;font-weight:500;font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${document.title || window.location.hostname}</span>
		</div>
		<div style="display:flex;align-items:center;gap:14px;-webkit-app-region:no-drag;">
			<button id="xx-min" style="background:none;border:none;color:#f4f4f5;cursor:pointer;padding:4px;font-size:16px;line-height:1;">&#8722;</button>
			<button id="xx-max" style="background:none;border:none;color:#f4f4f5;cursor:pointer;padding:4px;font-size:13px;line-height:1;">&#9633;</button>
			<button id="xx-close" style="background:none;border:none;color:#f4f4f5;cursor:pointer;padding:4px;font-size:18px;line-height:1;">&times;</button>
		</div>
	\`;
	document.body.style.paddingTop = '50px';
	document.body.appendChild(bar);
	document.getElementById('xx-min')?.addEventListener('click', () => window.electron?.minimize?.());
	document.getElementById('xx-max')?.addEventListener('click', () => window.electron?.maximize?.());
	document.getElementById('xx-close')?.addEventListener('click', () => window.electron?.close?.());
})();
`;

export function configureFramelessWindow(
	targetWin: BrowserWindow,
	opts: {
		preloadPath: string;
		iconPath: string;
		getPartition: () => string;
		shouldOpenExternal: () => boolean;
	}
) {
	try {
		targetWin.setMenuBarVisibility(false);
		targetWin.removeMenu();
	} catch {}

	targetWin.webContents.setWindowOpenHandler(({ url }) => {
		const forceExternal = url.includes('external=true');
		const isInternal =
			!forceExternal && (url.includes('xernerx.com') || url.includes('localhost') || url.includes('127.0.0.1') || url.includes('discord.com/oauth2') || url.includes('discordapp.com/oauth2'));

		if (forceExternal || (opts.shouldOpenExternal() && !isInternal)) {
			shell.openExternal(url).catch(() => {});
			return { action: 'deny' };
		}

		return {
			action: 'allow',
			overrideBrowserWindowOptions: {
				parent: undefined,
				modal: false,
				frame: false,
				roundedCorners: true,
				transparent: false,
				resizable: true,
				autoHideMenuBar: true,
				backgroundColor: '#09090b',
				icon: opts.iconPath,
				webPreferences: {
					preload: opts.preloadPath,
					contextIsolation: true,
					nodeIntegration: false,
					sandbox: false,
					partition: opts.getPartition(),
				},
			},
		};
	});

	targetWin.webContents.on('did-finish-load', () => {
		const currentUrl = targetWin.webContents.getURL();
		if (!currentUrl || currentUrl.startsWith('file://') || currentUrl.startsWith('devtools://')) return;
		targetWin.webContents.executeJavaScript(FALLBACK_HEADER_SCRIPT).catch(() => {});
	});
}

export function toggleOverlayWindow(opts: { webUrl: string; preloadPath: string; iconPath: string; partition: string; shouldOpenExternal?: () => boolean }): boolean {
	if (overlayWin && !overlayWin.isDestroyed()) {
		overlayWin.close();
		overlayWin = null;
		return false;
	}

	const { workArea } = screen.getPrimaryDisplay();
	const width = 400;
	const height = 540;

	overlayWin = new BrowserWindow({
		width,
		height,
		x: workArea.x + workArea.width - width - 24,
		y: workArea.y + 48,
		roundedCorners: true,
		frame: false,
		transparent: false,
		resizable: true,
		autoHideMenuBar: true,
		alwaysOnTop: true,
		skipTaskbar: false,
		backgroundColor: '#09090b',
		icon: opts.iconPath,
		webPreferences: {
			preload: opts.preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			partition: opts.partition,
		},
	});

	configureFramelessWindow(overlayWin, {
		preloadPath: opts.preloadPath,
		iconPath: opts.iconPath,
		getPartition: () => opts.partition,
		shouldOpenExternal: opts.shouldOpenExternal || (() => true),
	});

	overlayWin.setAlwaysOnTop(true, 'floating');
	overlayWin.loadURL(`${opts.webUrl}/overlay`).catch(() => {});

	overlayWin.on('closed', () => {
		overlayWin = null;
	});

	return true;
}
