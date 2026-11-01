/** @format */

import { BrowserWindow, Notification, Tray, app, nativeImage, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { loadEnvDomain, resolveDesktopTargetUrl, type Metadata } from './metadata.js';
import { createWindowsBadgeOverlay } from './desktopExtras.js';

export const APP_USER_MODEL_ID = app.isPackaged ? 'Xernerx.Desktop.Client' : 'Xernerx.Desktop.Client.Dev';

export interface DesktopNotificationPayload {
	id?: string;
	title: string;
	body?: string;
	subtitle?: string;
	link?: string | null;
	silent?: boolean;
	urgency?: 'normal' | 'critical' | 'low';
	force?: boolean;
}

/**
 * Resolves an icon path that external Windows OS Shell APIs (Explorer shortcuts,
 * JumpLists, Registry context menus) can read directly from the host filesystem.
 * Windows Explorer cannot read inside Electron `.asar` archives, even though
 * Electron's patched `fs.existsSync` returns `true` for `.asar` paths.
 */
export function resolveOsShellIconPath(iconPath?: string): string {
	try {
		const targetFileName = iconPath ? path.basename(iconPath) : 'icon.ico';
		if (iconPath && !/\.asar([\\/]|$)/i.test(iconPath) && fs.existsSync(iconPath)) {
			return iconPath;
		}
		if (process.resourcesPath) {
			const extraResourceVariant = path.join(process.resourcesPath, targetFileName);
			if (!/\.asar([\\/]|$)/i.test(extraResourceVariant) && fs.existsSync(extraResourceVariant)) {
				return extraResourceVariant;
			}
		}
		if (iconPath && fs.existsSync(iconPath)) {
			const userDataIcon = path.join(app.getPath('userData'), targetFileName);
			const srcBuf = fs.readFileSync(iconPath);
			let needsWrite = true;
			if (fs.existsSync(userDataIcon)) {
				try {
					const stat = fs.statSync(userDataIcon);
					if (stat.size === srcBuf.length) needsWrite = false;
				} catch {}
			}
			if (needsWrite) {
				fs.mkdirSync(path.dirname(userDataIcon), { recursive: true });
				fs.writeFileSync(userDataIcon, srcBuf);
			}
			if (fs.existsSync(userDataIcon)) {
				return userDataIcon;
			}
		}
		if (process.resourcesPath) {
			const extraResourceDefault = path.join(process.resourcesPath, 'icon.ico');
			if (!/\.asar([\\/]|$)/i.test(extraResourceDefault) && fs.existsSync(extraResourceDefault)) {
				return extraResourceDefault;
			}
		}
		const exeDirIcon = path.join(path.dirname(process.execPath), 'uninstallerIcon.ico');
		if (fs.existsSync(exeDirIcon)) {
			return exeDirIcon;
		}
	} catch {}
	return process.execPath;
}

export function applyWindowAppDetails(targetWin: BrowserWindow, iconPath: string) {
	if (process.platform !== 'win32' || !targetWin || targetWin.isDestroyed()) return;
	try {
		const shellIconPath = resolveOsShellIconPath(iconPath);
		const candidatePath = iconPath && fs.existsSync(iconPath) ? iconPath : shellIconPath;
		if (candidatePath && fs.existsSync(candidatePath)) {
			const appIcon = nativeImage.createFromPath(candidatePath);
			if (!appIcon.isEmpty()) {
				targetWin.setIcon(appIcon);
			}
		}
	} catch {}
}

export function configureAppNotificationIdentity(iconPath?: string, appRootPath?: string) {
	try {
		app.setName('Xernerx App');
		if (process.platform === 'win32') {
			app.setAppUserModelId(APP_USER_MODEL_ID);
			const shellIconPath = resolveOsShellIconPath(iconPath);
			const startMenuDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
			const shortcutName = app.isPackaged ? 'Xernerx App.lnk' : 'Xernerx App (Dev).lnk';
			const shortcutPath = path.join(startMenuDir, shortcutName);
			const targetArgs = app.isPackaged ? '' : appRootPath || process.cwd();

			try {
				if (fs.existsSync(shortcutPath)) {
					fs.chmodSync(shortcutPath, 0o666);
				}
			} catch {}

			shell.writeShortcutLink(shortcutPath, fs.existsSync(shortcutPath) ? 'replace' : 'create', {
				target: process.execPath,
				args: targetArgs,
				cwd: app.isPackaged ? path.dirname(process.execPath) : targetArgs,
				description: app.isPackaged ? 'Xernerx App' : 'Xernerx App (Dev)',
				icon: shellIconPath,
				iconIndex: 0,
				appUserModelId: APP_USER_MODEL_ID,
			});

			if (!app.isPackaged) {
				const electronShortcutPath = path.join(startMenuDir, 'Electron.lnk');
				if (fs.existsSync(electronShortcutPath)) {
					try {
						fs.unlinkSync(electronShortcutPath);
					} catch {}
				}

				const prodUserShortcutPath = path.join(startMenuDir, 'Xernerx App.lnk');
				if (fs.existsSync(prodUserShortcutPath)) {
					try {
						const parsed = shell.readShortcutLink(prodUserShortcutPath);
						if (/electron\.exe$/i.test(parsed.target || '') || /\.asar([\\/]|$)/i.test(parsed.icon || '')) {
							fs.chmodSync(prodUserShortcutPath, 0o666);
							fs.unlinkSync(prodUserShortcutPath);
						}
					} catch {}
				}
			}
		}
	} catch {}
}

export function dispatchNativeNotification(
	payload: DesktopNotificationPayload,
	ctx: {
		getWin: () => BrowserWindow | undefined;
		getTray: () => Tray | null;
		getMeta: () => Metadata;
		webUrl: string;
		iconPath: string;
		log: (msg: string) => void;
	}
): boolean {
	try {
		if (!payload?.title) return false;

		const currentMeta = ctx.getMeta();
		if (!payload.force && currentMeta.desktopNotifications === false) {
			return false;
		}

		const win = ctx.getWin();
		const tray = ctx.getTray();
		const isMac = process.platform === 'darwin';
		const isWin = process.platform === 'win32';
		const pngIconPath = ctx.iconPath.replace(/\.ico$/i, '.png');

		const focusAndNavigate = () => {
			const targetWin = ctx.getWin();
			if (!targetWin || targetWin.isDestroyed()) return;
			if (targetWin.isMinimized()) targetWin.restore();
			targetWin.show();
			targetWin.focus();
			if (isMac) {
				try {
					app.focus({ steal: true });
				} catch {}
			}

			try {
				targetWin.webContents.send('notification:clicked', payload);
			} catch {}

			if (payload.link && typeof payload.link === 'string') {
				const fullUrl = payload.link.startsWith('http')
					? resolveDesktopTargetUrl(payload.link, {
							isPackaged: app.isPackaged,
							isCanary: app.getVersion().includes('canary'),
							domain: loadEnvDomain(),
						})
					: `${ctx.webUrl}${payload.link.startsWith('/') ? payload.link : '/' + payload.link}`;
				targetWin.loadURL(fullUrl).catch(() => {});
			}
		};

		if (Notification.isSupported()) {
			const resolvedIcon = !isMac ? (fs.existsSync(pngIconPath) ? nativeImage.createFromPath(pngIconPath) : fs.existsSync(ctx.iconPath) ? ctx.iconPath : undefined) : undefined;

			const notif = new Notification({
				title: payload.title,
				subtitle: isMac ? payload.subtitle || 'Xernerx Suite' : undefined,
				body: payload.body || '',
				icon: resolvedIcon,
				silent: Boolean(payload.silent),
				urgency: payload.urgency || 'normal',
				timeoutType: 'default',
			});

			notif.on('click', focusAndNavigate);
			notif.show();

			if (isMac && (!win || win.isDestroyed() || !win.isFocused())) {
				try {
					app.dock?.bounce('informational');
				} catch {}
			}
		} else if (isWin && tray) {
			try {
				tray.displayBalloon({
					iconType: 'info',
					title: payload.title,
					content: payload.body || '',
				});
			} catch {}
		}

		if (win && !win.isDestroyed() && !win.isFocused()) {
			try {
				win.flashFrame(true);
			} catch {}
		}

		return true;
	} catch (err) {
		ctx.log(`WARNING: Notification dispatch failed: ${(err as Error)?.message || 'unknown'}`);
		return false;
	}
}

export function syncAppBadgeCount(count: number, getTray: () => Tray | null, getWin?: () => BrowserWindow | undefined) {
	const safeCount = Math.max(0, Math.floor(Number(count) || 0));
	try {
		app.setBadgeCount(safeCount);
	} catch {}

	if (process.platform === 'darwin' && app.dock) {
		try {
			app.dock.setBadge(safeCount > 0 ? (safeCount > 99 ? '99+' : String(safeCount)) : '');
		} catch {}
	}

	if (process.platform === 'win32' && getWin) {
		try {
			const win = getWin();
			if (win && !win.isDestroyed()) {
				if (safeCount > 0) {
					const overlayImg = createWindowsBadgeOverlay(safeCount);
					win.setOverlayIcon(overlayImg, `${safeCount} unread notifications`);
				} else {
					win.setOverlayIcon(null, '');
				}
			}
		} catch {}
	}

	try {
		getTray()?.setToolTip(safeCount > 0 ? `Xernerx App (${safeCount} unread)` : 'Xernerx App');
	} catch {}
}
