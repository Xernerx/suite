/** @format */

import { BrowserWindow, app, clipboard, dialog, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';
import type { LocalWebhookRelayResult } from './features.js';
import { STARTUP_LOCATION_URLS, loadEnvDomain, resolveDesktopTargetUrl } from './metadata.js';

const MIME_BY_EXT: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
};

/* -------------------------------------------------------------------------- */
/* 1. Windows Taskbar Thumbnail Toolbar & Progress Bar                        */
/* -------------------------------------------------------------------------- */

function createGlyphIcon(kind: 'dashboard' | 'portal' | 'overlay' | 'capture'): Electron.NativeImage {
	const size = 32;
	const buf = Buffer.alloc(size * size * 4, 0);

	const setPx = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
		if (x < 0 || x >= size || y < 0 || y >= size) return;
		const idx = (y * size + x) * 4;
		buf[idx] = b;
		buf[idx + 1] = g;
		buf[idx + 2] = r;
		buf[idx + 3] = a;
	};

	const fillRect = (x0: number, y0: number, w: number, h: number, r = 255, g = 255, b = 255, a = 255) => {
		for (let y = y0; y < y0 + h; y++) {
			for (let x = x0; x < x0 + w; x++) {
				setPx(x, y, r, g, b, a);
			}
		}
	};

	const strokeRect = (x0: number, y0: number, w: number, h: number, thickness = 2) => {
		fillRect(x0, y0, w, thickness);
		fillRect(x0, y0 + h - thickness, w, thickness);
		fillRect(x0, y0, thickness, h);
		fillRect(x0 + w - thickness, y0, thickness, h);
	};

	// Subtle rounded dark badge background so white glyphs are legible on both light & dark Windows 11 taskbars
	for (let y = 2; y < size - 2; y++) {
		for (let x = 2; x < size - 2; x++) {
			const dx = Math.max(0, Math.abs(x - 15.5) - 9.5);
			const dy = Math.max(0, Math.abs(y - 15.5) - 9.5);
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist <= 4.5) {
				const alpha = dist > 3.5 ? Math.round((4.5 - dist) * 210) : 210;
				setPx(x, y, 24, 24, 30, alpha);
			}
		}
	}

	if (kind === 'dashboard') {
		fillRect(8, 8, 7, 7);
		fillRect(17, 8, 7, 7);
		fillRect(8, 17, 7, 7);
		fillRect(17, 17, 7, 7);
	} else if (kind === 'portal') {
		strokeRect(6, 7, 20, 18, 2);
		// '>' prompt chevron
		for (let i = 0; i < 4; i++) {
			fillRect(10 + i, 12 + i, 2, 2);
			fillRect(10 + i, 18 - i, 2, 2);
		}
		fillRect(16, 19, 5, 2);
	} else if (kind === 'overlay') {
		strokeRect(7, 7, 13, 13, 2);
		fillRect(12, 12, 13, 13, 255, 255, 255, 235);
		fillRect(14, 14, 9, 9, 24, 24, 30, 255);
	} else if (kind === 'capture') {
		strokeRect(6, 9, 20, 15, 2);
		fillRect(12, 7, 8, 2);
		fillRect(13, 13, 6, 6);
	}

	return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

export function applyWindowsThumbarButtons(
	win: BrowserWindow | undefined,
	opts: {
		webUrl: string;
		onToggleOverlay: () => void;
		onQuickCapture: () => void;
	}
) {
	if (process.platform !== 'win32' || !win || win.isDestroyed()) return;
	try {
		win.setThumbarButtons([
			{
				tooltip: 'Server Dashboard',
				icon: createGlyphIcon('dashboard'),
				click: () => {
					if (win.isDestroyed()) return;
					if (win.isMinimized()) win.restore();
					win.show();
					win.focus();
					win.loadURL(`${opts.webUrl}/dashboard`).catch(() => {});
				},
			},
			{
				tooltip: 'Developer Portal',
				icon: createGlyphIcon('portal'),
				click: () => {
					if (win.isDestroyed()) return;
					if (win.isMinimized()) win.restore();
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
				tooltip: 'Toggle Live Overlay (Ctrl+Shift+O)',
				icon: createGlyphIcon('overlay'),
				click: () => opts.onToggleOverlay(),
			},
			{
				tooltip: 'Quick Screen Capture (Ctrl+Shift+S)',
				icon: createGlyphIcon('capture'),
				click: () => opts.onQuickCapture(),
			},
		]);
	} catch {}
}

export function setWindowProgressBar(win: BrowserWindow | undefined, progress: number, mode?: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused'): boolean {
	if (!win || win.isDestroyed()) return false;
	try {
		if (progress < 0 || mode === 'none') {
			win.setProgressBar(-1);
		} else {
			const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
			win.setProgressBar(clamped, mode ? { mode } : undefined);
		}
		return true;
	} catch {
		return false;
	}
}

/* -------------------------------------------------------------------------- */
/* 2. Windows 11 Native-Style Taskbar Unread Notification Overlay Badge       */
/* -------------------------------------------------------------------------- */

const DIGIT_BITMAPS: Record<string, string[]> = {
	'0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
	'1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
	'2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
	'3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
	'4': ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
	'5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
	'6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
	'7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
	'8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
	'9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
	'+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
};

export function createWindowsBadgeOverlay(count: number): Electron.NativeImage {
	const size = 32;
	const buf = Buffer.alloc(size * size * 4, 0);
	const cx = 15.5;
	const cy = 15.5;
	const outerR = 14.5;
	const innerR = 12.5;

	const setPx = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
		if (x < 0 || x >= size || y < 0 || y >= size) return;
		const idx = (y * size + x) * 4;
		buf[idx] = b;
		buf[idx + 1] = g;
		buf[idx + 2] = r;
		buf[idx + 3] = a;
	};

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
			if (dist <= outerR + 0.6) {
				if (dist <= innerR) {
					// Windows 11 / Discord vibrant alert red (#ED4245)
					setPx(x, y, 237, 66, 69, 255);
				} else {
					const edgeAlpha = dist > outerR ? Math.max(0, Math.round((outerR + 0.6 - dist) * 255)) : 255;
					setPx(x, y, 24, 24, 28, edgeAlpha);
				}
			}
		}
	}

	const text = count > 9 ? '9+' : String(Math.max(1, count));
	const scale = text.length === 1 ? 2 : 2;
	const charW = 5 * scale;
	const charH = 7 * scale;
	const gap = text.length > 1 ? 2 : 0;
	const totalW = text.length * charW + (text.length - 1) * gap;
	const startX = Math.round((size - totalW) / 2);
	const startY = Math.round((size - charH) / 2);

	for (let cIdx = 0; cIdx < text.length; cIdx++) {
		const ch = text[cIdx];
		const glyph = DIGIT_BITMAPS[ch];
		if (!glyph) continue;
		const ox = startX + cIdx * (charW + gap);
		for (let gy = 0; gy < 7; gy++) {
			for (let gx = 0; gx < 5; gx++) {
				if (glyph[gy]?.[gx] === '1') {
					for (let sy = 0; sy < scale; sy++) {
						for (let sx = 0; sx < scale; sx++) {
							setPx(ox + gx * scale + sx, startY + gy * scale + sy, 255, 255, 255, 255);
						}
					}
				}
			}
		}
	}

	return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

/* -------------------------------------------------------------------------- */
/* 3. Automatic Clipboard Token Guard (60s Auto-Expire with Cancel Support)   */
/* -------------------------------------------------------------------------- */

let activeClipboardTimer: NodeJS.Timeout | null = null;
let activeGuardedSecret: string | null = null;

function broadcastClipboardState(event: 'guarded' | 'cleared' | 'cancelled', payload?: Record<string, any>) {
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			try {
				bw.webContents.send('clipboard:guardState', { event, ...payload });
			} catch {}
		}
	}
}

export function guardClipboardSecret(secret: string, ttlMs = 60000): { guarded: boolean; expiresAt: number; ttlMs: number } {
	const safeTtl = Math.max(5000, Math.min(300000, Number(ttlMs) || 60000));
	if (activeClipboardTimer) {
		clearTimeout(activeClipboardTimer);
		activeClipboardTimer = null;
	}
	try {
		clipboard.writeText(String(secret || ''));
	} catch {}
	activeGuardedSecret = String(secret || '');
	const expiresAt = Date.now() + safeTtl;

	activeClipboardTimer = setTimeout(async () => {
		activeClipboardTimer = null;
		const targetSecret = activeGuardedSecret;
		activeGuardedSecret = null;
		if (!targetSecret) return;
		try {
			const currentClipboard = await Promise.resolve((clipboard as Electron.Clipboard).readText());
			if (currentClipboard === targetSecret) {
				(clipboard as Electron.Clipboard).writeText('');
				broadcastClipboardState('cleared', { clearedAt: Date.now() });
			}
		} catch {}
	}, safeTtl);

	broadcastClipboardState('guarded', { expiresAt, ttlMs: safeTtl });
	return { guarded: true, expiresAt, ttlMs: safeTtl };
}

export function cancelClipboardGuard(): boolean {
	if (activeClipboardTimer) {
		clearTimeout(activeClipboardTimer);
		activeClipboardTimer = null;
	}
	activeGuardedSecret = null;
	broadcastClipboardState('cancelled', { cancelledAt: Date.now() });
	return true;
}

/* -------------------------------------------------------------------------- */
/* 4. Local Folder Auto-Sync Watch Folder for cdn.xernerx.com                 */
/* -------------------------------------------------------------------------- */

let activeFolderWatcher: fs.FSWatcher | null = null;
let activeWatchedPath = '';
const fileDebounceMap = new Map<string, NodeJS.Timeout>();

export async function promptSelectWatchFolder(win: BrowserWindow | undefined): Promise<string | null> {
	try {
		const res = win && !win.isDestroyed() ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] }) : await dialog.showOpenDialog({ properties: ['openDirectory'] });
		if (res.canceled || !res.filePaths?.[0]) return null;
		return res.filePaths[0];
	} catch {
		return null;
	}
}

export function syncCdnWatchFolder(
	folderPath: string | undefined,
	opts: {
		getWin: () => BrowserWindow | undefined;
		log: (msg: string) => void;
	}
) {
	const normalized = (folderPath || '').trim();
	if (normalized === activeWatchedPath && activeFolderWatcher) return;

	if (activeFolderWatcher) {
		try {
			activeFolderWatcher.close();
		} catch {}
		activeFolderWatcher = null;
	}
	activeWatchedPath = '';
	for (const timer of fileDebounceMap.values()) clearTimeout(timer);
	fileDebounceMap.clear();

	if (!normalized || !fs.existsSync(normalized)) return;

	try {
		const stat = fs.statSync(normalized);
		if (!stat.isDirectory()) return;
	} catch {
		return;
	}

	const knownFiles = new Set<string>();
	try {
		for (const existing of fs.readdirSync(normalized)) {
			knownFiles.add(existing);
		}
	} catch {}

	try {
		activeWatchedPath = normalized;
		opts.log(`CDN WATCH FOLDER ACTIVE: ${normalized}`);
		activeFolderWatcher = fs.watch(normalized, (_eventType, filename) => {
			if (!filename) return;
			const ext = path.extname(filename).toLowerCase();
			const mime = MIME_BY_EXT[ext];
			if (!mime) return;

			if (knownFiles.has(filename)) return;

			const existingTimer = fileDebounceMap.get(filename);
			if (existingTimer) clearTimeout(existingTimer);

			const timer = setTimeout(() => {
				fileDebounceMap.delete(filename);
				const fullPath = path.join(normalized, filename);
				try {
					if (!fs.existsSync(fullPath)) return;
					const fileStat = fs.statSync(fullPath);
					if (!fileStat.isFile() || fileStat.size <= 0 || fileStat.size > 15 * 1024 * 1024) return;
					knownFiles.add(filename);

					const raw = fs.readFileSync(fullPath);
					const dataUrl = `data:${mime};base64,${raw.toString('base64')}`;
					const win = opts.getWin();
					if (win && !win.isDestroyed()) {
						win.webContents.send('capture:ready', {
							dataUrl,
							filename,
							sourceType: 'watch-folder',
							timestamp: Date.now(),
						});
						opts.log(`CDN WATCH FOLDER DISPATCHED: ${filename} (${fileStat.size} bytes)`);
					}
				} catch {}
			}, 700);

			fileDebounceMap.set(filename, timer);
		});
	} catch (err) {
		opts.log(`WARNING: Failed to watch folder ${normalized}: ${(err as Error)?.message || err}`);
	}
}

/* -------------------------------------------------------------------------- */
/* 5. Live Webhook Relay History & Broadcast for Overlay Monitor Inspector    */
/* -------------------------------------------------------------------------- */

const webhookRelayHistory: LocalWebhookRelayResult['delivery'][] = [];

export function recordAndBroadcastWebhookDelivery(result: LocalWebhookRelayResult): LocalWebhookRelayResult {
	if (result?.delivery) {
		webhookRelayHistory.unshift(result.delivery);
		if (webhookRelayHistory.length > 25) {
			webhookRelayHistory.length = 25;
		}
		for (const bw of BrowserWindow.getAllWindows()) {
			if (!bw.isDestroyed()) {
				try {
					bw.webContents.send('webhook:delivery', result.delivery);
				} catch {}
			}
		}
	}
	return result;
}

export function getWebhookRelayHistory(): LocalWebhookRelayResult['delivery'][] {
	return [...webhookRelayHistory];
}
