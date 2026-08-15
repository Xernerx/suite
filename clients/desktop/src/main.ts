/** @format */

import { BrowserWindow, app, ipcMain, screen } from 'electron';

import Store from 'electron-store';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const store = new Store();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconPath = path.join(__dirname, '../public/icon.ico');

const isCanary = app.getVersion().includes('canary');
const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || '';
const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);

const WEB_URL = app.isPackaged
	? isCanary
		? 'https://app.canary.xernerx.com'
		: 'https://app.xernerx.com'
	: domain && !isIp && domain !== 'localhost' && domain !== '127.0.0.1'
		? `https://app.dev.${domain}`
		: `http://${domain || '127.0.0.1'}:4004`;
let win: BrowserWindow;
let splash: BrowserWindow | null = null;

/* --------------------------------------------- */
/* Metadata                                      */
/* --------------------------------------------- */

type Metadata = {
	debug?: boolean;
	hardwareAcceleration?: boolean;
	startMinimized?: boolean;
	startMaximized?: boolean;
	startOnBoot?: boolean;
};

export function getMetadata(): Metadata {
	try {
		const file = app.isPackaged ? path.join(process.resourcesPath, 'metadata.json') : path.join(process.cwd(), 'metadata.json');

		log(`LOADING: ${file}`);

		if (fs.existsSync(file)) {
			return JSON.parse(fs.readFileSync(file, 'utf-8'));
		}
	} catch {
		log(`WARNING: Failed to load metadata.json`);
	}

	return {
		debug: true,
		hardwareAcceleration: true,
		startMinimized: false,
		startMaximized: false,
		startOnBoot: false,
	};
}

const meta = getMetadata();
const DEBUG = meta.debug === true;

/* --------------------------------------------- */
/* System config                                 */
/* --------------------------------------------- */

if (meta.hardwareAcceleration === false) {
	app.disableHardwareAcceleration();
}

if (meta.startOnBoot) {
	app.setLoginItemSettings({ openAtLogin: true });
}

/* --------------------------------------------- */
/* Logging                                       */
/* --------------------------------------------- */

function log(message: string) {
	try {
		const file = path.join(app.getPath('desktop'), 'xernerx-debug.log');
		fs.appendFileSync(file, `[${new Date().toISOString()}] ${message}\n`);
	} catch {}
}

/* --------------------------------------------- */
/* Messaging                                     */
/* --------------------------------------------- */

function sendError(message: string) {
	log(`ERROR: ${message}`);

	if (splash && !splash.isDestroyed()) {
		splash.webContents.send('startup:error', message);
	}
}

function sendStatus(message: string) {
	log(`STATUS: ${message}`);

	// Startup messages belong to splash
	if (splash && !splash.isDestroyed()) {
		splash.webContents.send('startup:status', message);
	}
}

/* --------------------------------------------- */
/* Bounds                                        */
/* --------------------------------------------- */

function getSafeBounds(bounds?: Electron.Rectangle): Electron.Rectangle {
	const { workArea } = screen.getPrimaryDisplay();

	if (!bounds) {
		return {
			x: workArea.x + 100,
			y: workArea.y + 100,
			width: 1200,
			height: 800,
		};
	}

	const off = bounds.x + bounds.width < workArea.x || bounds.y + bounds.height < workArea.y || bounds.x > workArea.x + workArea.width || bounds.y > workArea.y + workArea.height;

	return off
		? {
				x: workArea.x + 100,
				y: workArea.y + 100,
				width: 1200,
				height: 800,
			}
		: bounds;
}

function getDisplayFromBounds(bounds: Electron.Rectangle) {
	const displays = screen.getAllDisplays();

	for (const display of displays) {
		const area = display.workArea;

		const inside = bounds.x >= area.x && bounds.y >= area.y && bounds.x < area.x + area.width && bounds.y < area.y + area.height;

		if (inside) return display;
	}

	return screen.getPrimaryDisplay();
}

/* --------------------------------------------- */
/* Splash                                        */
/* --------------------------------------------- */

function createSplash(bounds: Electron.Rectangle) {
	const display = getDisplayFromBounds(bounds);

	const width = 500;
	const height = 350;

	splash = new BrowserWindow({
		width,
		height,
		center: true,
		roundedCorners: true,
		frame: false,
		transparent: true,
		resizable: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		backgroundColor: '#00000000',

		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
	});

	splash.loadFile(path.join(__dirname, '../pages/loading.html'));
}

/* --------------------------------------------- */
/* Backend wait                                  */
/* --------------------------------------------- */

async function waitForServer() {
	sendStatus('Connecting...');

	let attempt = 0;

	while (true) {
		attempt++;

		try {
			const res = await fetch(`${WEB_URL}/api/status`);

			if (res.ok) {
				sendStatus('Ready');
				return;
			}

			const delay = Math.min(attempt * attempt, 180);

			for (let s = delay; s > 0; s--) {
				sendStatus(`Retrying in ${s}s`);
				await new Promise((r) => setTimeout(r, 1000));
			}
		} catch (e) {
			sendError((e as Error).message);
			return;
		}
	}
}

/* --------------------------------------------- */
/* Updater                                       */
/* --------------------------------------------- */

async function runUpdater() {
	if (DEBUG) return;

	sendStatus('Checking for updates…');

	const { autoUpdater } = (await import('electron-updater')).default;

	try {
		autoUpdater.autoDownload = true;

		autoUpdater.on('update-available', () => {
			sendStatus('Downloading update…');
		});

		autoUpdater.on('update-not-available', () => {
			sendStatus('No updates found');
		});

		autoUpdater.on('update-downloaded', () => {
			sendStatus('Installing update…');
			setTimeout(() => autoUpdater.quitAndInstall(), 1000);
		});

		await autoUpdater.checkForUpdates();
	} catch (error) {
		sendError((error as Error).message);
	}
}

/* --------------------------------------------- */
/* Window                                        */
/* --------------------------------------------- */

function createMainWindow(bounds: Electron.Rectangle) {
	win = new BrowserWindow({
		width: bounds.width,
		height: bounds.height,
		x: bounds.x,
		y: bounds.y,
		roundedCorners: true,
		frame: false,
		transparent: false,
		resizable: true,
		backgroundColor: '#00000000',
		icon: iconPath,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			partition: 'persist:xernerx',
		},
	});

	const wasMaximized = store.get('windowMaximized');

	if (meta.startMaximized || wasMaximized) {
		win.maximize();
	}

	function saveBounds() {
		if (!win || win.isDestroyed()) return;

		if (win.isMinimized()) return;

		if (win.isMaximized()) {
			store.set('windowMaximized', true);
			return;
		}

		store.set('windowMaximized', false);
		store.set('windowBounds', win.getBounds());
	}

	win.on('resize', saveBounds);
	win.on('move', saveBounds);
	win.on('close', saveBounds);

	let crashCount = 0;

	win.webContents.on('render-process-gone', (_, details) => {
		log(`CRASH: ${JSON.stringify(details)}`);

		if (++crashCount > 3) return;

		setTimeout(() => {
			win.reload();
		}, 1000);
	});

	if (DEBUG) {
		win.webContents.on('did-finish-load', () => {
			log(`LOADED: ${win.webContents.getURL()}`);
		});

		win.webContents.on('will-redirect', (_, url) => {
			log(`REDIRECT: ${url}`);
		});
	}

	if (app.isPackaged && !DEBUG) {
		win.webContents.on('before-input-event', (event, input) => {
			if (input.key === 'F12') event.preventDefault();

			if (input.control && input.shift && input.key.toLowerCase() === 'i') {
				event.preventDefault();
			}
		});

		win.webContents.on('context-menu', (e) => e.preventDefault());
	}

	ipcMain.on('window:minimize', () => win.minimize());

	ipcMain.on('window:maximize', () => {
		if (win.isMaximized()) win.unmaximize();
		else win.maximize();
	});

	ipcMain.on('window:close', () => win.close());

	ipcMain.handle('window:isMaximized', () => win.isMaximized());
}

async function createWindow() {
	let bounds = store.get('windowBounds') as Electron.Rectangle | undefined;

	bounds = getSafeBounds(bounds);

	// Only splash exists initially
	createSplash(bounds);

	await new Promise<void>((resolve) => {
		if (!splash) return resolve();

		splash.webContents.once('did-finish-load', () => resolve());
	});

	try {
		await runUpdater();
		await waitForServer();

		sendStatus('Launching...');

		// Create actual app only now
		createMainWindow(bounds);

		await win.loadURL(WEB_URL + '/dashboard');

		if (!meta.startMinimized) {
			win.show();
			win.focus();
		}

		if (DEBUG) {
			setTimeout(() => {
				win.webContents.openDevTools({
					mode: 'detach',
				});
			}, 1000);
		}
	} catch (error) {
		sendError((error as Error).message);
	} finally {
		if (splash && !splash.isDestroyed()) {
			splash.destroy();
			splash = null;
		}
	}
}

/* --------------------------------------------- */
/* App start                                     */
/* --------------------------------------------- */

app.whenReady().then(() => {
	app.setAppUserModelId('com.xernerx.app');
	createWindow();
});
