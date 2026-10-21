/** @format */

import { BrowserWindow, Menu, Tray, app, globalShortcut } from 'electron';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx';

export type Metadata = {
	debug?: boolean;
	hardwareAcceleration?: boolean;
	startMinimized?: boolean;
	startMaximized?: boolean;
	startOnBoot?: boolean;
	alwaysOnTop?: boolean;
	minimizeOnClose?: boolean;
	globalHotkey?: boolean;
	openExternalInBrowser?: boolean;
	discordRpc?: boolean;
	windowControls?: WindowControlsStyle;
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
	openExternalInBrowser: true,
	discordRpc: true,
	windowControls: 'system',
};

export function getMetadataFilePath(): string {
	return app.isPackaged ? path.join(process.resourcesPath, 'metadata.json') : path.join(process.cwd(), 'metadata.json');
}

export function loadMetadata(store: Store, log: (msg: string) => void): Metadata {
	let fileData: Partial<Metadata> = {};
	try {
		const file = getMetadataFilePath();
		log(`LOADING: ${file}`);
		if (fs.existsSync(file)) {
			fileData = JSON.parse(fs.readFileSync(file, 'utf-8'));
		}
	} catch {
		log(`WARNING: Failed to load metadata.json`);
	}

	const overrides = (store.get('metadataOverrides') as Partial<Metadata> | undefined) || {};
	return {
		...DEFAULT_METADATA,
		...overrides,
		...fileData,
	};
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
			fs.watchFile(metaFile, { interval: 1000 }, () => {
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

export function createSystemTray(iconPath: string, webUrl: string, getWin: () => BrowserWindow | undefined, onToggleOverlay: () => void, onQuit: () => void): Tray | null {
	try {
		if (!fs.existsSync(iconPath)) return null;
		const tray = new Tray(iconPath);
		tray.setToolTip('Xernerx App');
		const contextMenu = Menu.buildFromTemplate([
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
				label: 'Live Overlay Monitor',
				click: () => onToggleOverlay(),
			},
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
					win.loadURL(`${webUrl}/portal`).catch(() => {});
				},
			},
			{ type: 'separator' },
			{
				label: 'Restart App',
				click: () => {
					app.relaunch();
					app.exit(0);
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
		tray.setContextMenu(contextMenu);
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
