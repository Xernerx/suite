/** @format */

const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('../package.json');

const fs = require('fs');
const path = require('path');

let metadata = {
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

try {
	let buffer;
	try {
		buffer = fs.readFileSync(path.join(process.resourcesPath, 'metadata.json'));
	} catch {
		buffer = fs.readFileSync(path.join(process.cwd(), 'metadata.json'));
	}
	metadata = { ...metadata, ...JSON.parse(buffer.toString()) };
} catch {}

ipcRenderer.on('metadata:updated', (_: any, updated: any) => {
	if (updated && typeof updated === 'object') {
		metadata = { ...metadata, ...updated };
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: metadata }));
		}
	}
});

contextBridge.exposeInMainWorld('electron', {
	minimize: () => ipcRenderer.send('window:minimize'),
	maximize: () => ipcRenderer.send('window:maximize'),
	close: () => ipcRenderer.send('window:close'),
	isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
	getMetadata: () => ipcRenderer.invoke('metadata:get'),
	updateMetadata: (patch: Record<string, any>) => ipcRenderer.invoke('metadata:set', patch),
	clearCache: () => ipcRenderer.invoke('app:clearCache'),
	getLogs: () => ipcRenderer.invoke('app:getLogs'),
	openLogs: () => ipcRenderer.invoke('app:openLogs'),
	openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
	notify: (payload: { title: string; body?: string }) => ipcRenderer.send('app:notify', payload),
	setActivity: (activity: { details?: string; state?: string }) => ipcRenderer.send('rpc:setActivity', activity),
	toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
	navigateMain: (targetPath: string) => ipcRenderer.send('overlay:navigateMain', targetPath),
	getAccounts: () => ipcRenderer.invoke('accounts:get'),
	syncAccountProfile: (profile: { id?: string; username?: string; globalName?: string; avatar?: string }) => ipcRenderer.invoke('accounts:sync', profile),
	switchAccount: (slot: string) => ipcRenderer.invoke('accounts:switch', slot),
	removeAccount: (slot: string) => ipcRenderer.invoke('accounts:remove', slot),
	restart: () => ipcRenderer.send('app:restart'),
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
	metadata,
});
