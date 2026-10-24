/** @format */

import { BrowserWindow, Notification, Tray, app, nativeImage, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { loadEnvDomain, resolveDesktopTargetUrl, type Metadata } from './metadata.js';
import { createWindowsBadgeOverlay } from './desktopExtras.js';

export const APP_USER_MODEL_ID = 'Xernerx.Desktop.Client';

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

export function applyWindowAppDetails(targetWin: BrowserWindow, iconPath: string) {
	if (process.platform !== 'win32' || !targetWin || targetWin.isDestroyed()) return;
	try {
		if (iconPath && fs.existsSync(iconPath)) {
			const appIcon = nativeImage.createFromPath(iconPath);
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
			if (iconPath && fs.existsSync(iconPath)) {
				const startMenuDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
				const shortcutPath = path.join(startMenuDir, 'Xernerx App.lnk');
				const targetArgs = app.isPackaged ? '' : appRootPath || process.cwd();
				shell.writeShortcutLink(shortcutPath, 'create', {
					target: process.execPath,
					args: targetArgs,
					cwd: app.isPackaged ? path.dirname(process.execPath) : targetArgs,
					description: 'Xernerx App',
					icon: iconPath,
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
		const pngIconPath = path.join(path.dirname(ctx.iconPath), 'icon.png');

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
