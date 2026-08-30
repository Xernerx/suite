/** @format */

const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('../package.json');

const fs = require('fs');
const path = require('path');

let buffer;
try {
	buffer = fs.readFileSync(path.join(process.resourcesPath, 'metadata.json'));
} catch {
	buffer = fs.readFileSync(path.join(process.cwd(), 'metadata.json'));
}

const metadata = JSON.parse(buffer.toString());

contextBridge.exposeInMainWorld('electron', {
	minimize: () => ipcRenderer.send('window:minimize'),
	maximize: () => ipcRenderer.send('window:maximize'),
	close: () => ipcRenderer.send('window:close'),
	isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
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
