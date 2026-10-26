/** @format */

import { BrowserWindow, app, clipboard, desktopCapturer, dialog, nativeImage, powerMonitor, screen, shell, systemPreferences } from 'electron';
import Store from 'electron-store';
import { ChildProcess, execFile, spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { Metadata } from './metadata.js';
import { setRpcIdleOverride } from './rpc.js';

const MIME_BY_EXT: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.json': 'application/json',
	'.txt': 'text/plain',
};

/* -------------------------------------------------------------------------- */
/* #2: Local Bot Process Runner & Crash Monitor                               */
/* -------------------------------------------------------------------------- */

export interface LocalBotRunnerConfig {
	botId: string;
	name: string;
	cwd: string;
	command: string;
}

export interface LocalBotApiRequestLog {
	id: string;
	method: string;
	url: string;
	path: string;
	status: number;
	statusText: string;
	ok: boolean;
	latencyMs: number;
	malformed: boolean;
	detail?: string;
	timestamp: string;
}

export interface LocalBotRunnerState extends LocalBotRunnerConfig {
	running: boolean;
	pid: number | null;
	startedAt: number | null;
	lastExitCode: number | null;
	logs: string[];
	apiLogs: LocalBotApiRequestLog[];
}

interface ActiveBotProcess {
	proc: ChildProcess;
	pid: number | null;
	startedAt: number;
	stoppedManually: boolean;
	lastExitCode: number | null;
	logs: string[];
	apiLogs: LocalBotApiRequestLog[];
}

const activeBotProcesses = new Map<string, ActiveBotProcess>();
const MAX_BOT_LOG_LINES = 80;
const MAX_BOT_API_LOGS = 40;
const API_LOG_PREFIX = '__XERNERX_API_LOG__:';

function ensureBotNetHookModuleUrl(): string | null {
	try {
		const compiledHookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'botNetHook.js');
		const hookPath = path.join(os.tmpdir(), 'xernerx-bot-net-hook.mjs');
		const source = fs.readFileSync(compiledHookPath, 'utf8');
		fs.writeFileSync(hookPath, source, 'utf8');
		return pathToFileURL(hookPath).href;
	} catch {
		return null;
	}
}

function stripAnsi(raw: string): string {
	return raw.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function broadcastBotRunnerStates(store: Store) {
	const states = getLocalBotRunnersState(store);
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			try {
				bw.webContents.send('botRunner:updated', states);
			} catch {}
		}
	}
}

export function getStoredBotRunnerConfigs(store: Store): Record<string, LocalBotRunnerConfig> {
	const raw = store.get('localBotRunners');
	if (!raw || typeof raw !== 'object') return {};
	return raw as Record<string, LocalBotRunnerConfig>;
}

export function getLocalBotRunnersState(store: Store): LocalBotRunnerState[] {
	const configs = getStoredBotRunnerConfigs(store);
	return Object.values(configs).map((cfg) => {
		const runtime = activeBotProcesses.get(cfg.botId);
		return {
			...cfg,
			running: Boolean(runtime && !runtime.proc.killed && runtime.proc.exitCode === null),
			pid: runtime?.pid ?? null,
			startedAt: runtime?.startedAt ?? null,
			lastExitCode: runtime?.lastExitCode ?? null,
			logs: runtime ? [...runtime.logs] : [],
			apiLogs: runtime ? [...runtime.apiLogs] : [],
		};
	});
}

export async function selectLocalBotDirectory(win: BrowserWindow | undefined): Promise<string | null> {
	try {
		const res = win && !win.isDestroyed() ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] }) : await dialog.showOpenDialog({ properties: ['openDirectory'] });
		if (res.canceled || !res.filePaths?.[0]) return null;
		return res.filePaths[0];
	} catch {
		return null;
	}
}

export function configureLocalBotRunner(store: Store, payload: { botId: string; name?: string; cwd?: string; command?: string; remove?: boolean }): LocalBotRunnerState[] {
	const botId = String(payload?.botId || '').trim();
	if (!botId) return getLocalBotRunnersState(store);

	const configs = { ...getStoredBotRunnerConfigs(store) };
	if (payload.remove) {
		stopLocalBot(store, botId);
		delete configs[botId];
	} else {
		const existing = configs[botId];
		const cwd = typeof payload.cwd === 'string' ? payload.cwd.trim() : existing?.cwd || '';
		if (cwd) {
			configs[botId] = {
				botId,
				name: (payload.name || existing?.name || `Bot ${botId}`).trim(),
				cwd,
				command: (payload.command || existing?.command || 'pnpm dev').trim() || 'pnpm dev',
			};
		}
	}

	store.set('localBotRunners', configs);
	broadcastBotRunnerStates(store);
	return getLocalBotRunnersState(store);
}

export function startLocalBot(
	store: Store,
	botId: string,
	opts: {
		log: (msg: string) => void;
		onCrash: (info: { botId: string; name: string; exitCode: number; lastLine: string }) => void;
	}
): { ok: boolean; error?: string; states: LocalBotRunnerState[] } {
	const configs = getStoredBotRunnerConfigs(store);
	const cfg = configs[botId];
	if (!cfg || !cfg.cwd || !fs.existsSync(cfg.cwd)) {
		return { ok: false, error: 'Local bot directory not found', states: getLocalBotRunnersState(store) };
	}

	const existing = activeBotProcesses.get(botId);
	if (existing && existing.proc.exitCode === null && !existing.proc.killed) {
		return { ok: true, states: getLocalBotRunnersState(store) };
	}

	try {
		const hookModuleUrl = ensureBotNetHookModuleUrl();
		const baseNodeOpts = (process.env.NODE_OPTIONS || '').replace(/--(?:import|require)\s+"[^"]*xernerx-bot-net-hook\.(?:mjs|cjs)"/g, '').trim();
		const nextNodeOpts = hookModuleUrl ? `${baseNodeOpts} --import "${hookModuleUrl}"`.trim() : baseNodeOpts;

		const proc = spawn(cfg.command || 'pnpm dev', {
			cwd: cfg.cwd,
			shell: true,
			windowsHide: true,
			env: {
				...process.env,
				NODE_OPTIONS: nextNodeOpts,
				FORCE_COLOR: '0',
			},
		});

		const runtime: ActiveBotProcess = {
			proc,
			pid: proc.pid ?? null,
			startedAt: Date.now(),
			stoppedManually: false,
			lastExitCode: null,
			logs: [`[${new Date().toLocaleTimeString()}] $ ${cfg.command} (cwd: ${cfg.cwd})`],
			apiLogs: [],
		};
		activeBotProcesses.set(botId, runtime);

		const appendLogs = (chunk: Buffer, prefix = '') => {
			const lines = stripAnsi(chunk.toString('utf8'))
				.split(/\r?\n/)
				.map((l) => l.trimEnd())
				.filter(Boolean);
			if (lines.length === 0) return;
			for (const line of lines) {
				const hookIdx = line.indexOf(API_LOG_PREFIX);
				if (hookIdx !== -1) {
					const rawJson = line.slice(hookIdx + API_LOG_PREFIX.length).trim();
					try {
						const parsed = JSON.parse(rawJson) as LocalBotApiRequestLog;
						if (parsed && parsed.path) {
							runtime.apiLogs.unshift(parsed);
							if (runtime.apiLogs.length > MAX_BOT_API_LOGS) {
								runtime.apiLogs.length = MAX_BOT_API_LOGS;
							}
							const statusLabel = parsed.status ? `${parsed.status} ${parsed.statusText}` : parsed.statusText;
							const detailPart = parsed.detail ? ` — ${parsed.detail}` : '';
							runtime.logs.push(`[API] ${parsed.method} ${parsed.path} -> ${statusLabel} (${parsed.latencyMs}ms)${detailPart}`);
							continue;
						}
					} catch {}
				}
				runtime.logs.push(prefix ? `${prefix} ${line}` : line);
			}
			if (runtime.logs.length > MAX_BOT_LOG_LINES) {
				runtime.logs.splice(0, runtime.logs.length - MAX_BOT_LOG_LINES);
			}
			broadcastBotRunnerStates(store);
		};

		proc.stdout?.on('data', (chunk: Buffer) => appendLogs(chunk));
		proc.stderr?.on('data', (chunk: Buffer) => appendLogs(chunk, '[stderr]'));

		proc.on('exit', (code) => {
			const exitCode = typeof code === 'number' ? code : 0;
			runtime.lastExitCode = exitCode;
			runtime.pid = null;
			runtime.logs.push(`[${new Date().toLocaleTimeString()}] Process exited with code ${exitCode}`);
			if (runtime.logs.length > MAX_BOT_LOG_LINES) {
				runtime.logs.splice(0, runtime.logs.length - MAX_BOT_LOG_LINES);
			}
			broadcastBotRunnerStates(store);

			if (!runtime.stoppedManually && exitCode !== 0) {
				const lastLine = runtime.logs[runtime.logs.length - 2] || `Exited with code ${exitCode}`;
				opts.log(`BOT RUNNER CRASH: ${cfg.name} (${botId}) exited with code ${exitCode}`);
				opts.onCrash({
					botId,
					name: cfg.name,
					exitCode,
					lastLine,
				});
			}
		});

		opts.log(`BOT RUNNER STARTED: ${cfg.name} (${botId}) PID=${proc.pid}`);
		broadcastBotRunnerStates(store);
		return { ok: true, states: getLocalBotRunnersState(store) };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to spawn local bot process', states: getLocalBotRunnersState(store) };
	}
}

export function stopLocalBot(store: Store, botId: string): LocalBotRunnerState[] {
	const runtime = activeBotProcesses.get(botId);
	if (runtime) {
		runtime.stoppedManually = true;
		const pid = runtime.proc.pid;
		try {
			if (process.platform === 'win32' && pid) {
				execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => {});
			} else {
				runtime.proc.kill('SIGTERM');
			}
		} catch {}
	}
	broadcastBotRunnerStates(store);
	return getLocalBotRunnersState(store);
}

export function stopAllLocalBots() {
	for (const runtime of activeBotProcesses.values()) {
		runtime.stoppedManually = true;
		const pid = runtime.proc.pid;
		try {
			if (process.platform === 'win32' && pid) {
				execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => {});
			} else {
				runtime.proc.kill('SIGTERM');
			}
		} catch {}
	}
}

export async function probeBotRunnerApiEndpoint(store: Store, payload: { botId: string; url: string; method?: string }): Promise<{ entry: LocalBotApiRequestLog; states: LocalBotRunnerState[] }> {
	const botId = String(payload?.botId || 'local-bot').trim();
	const rawUrl = String(payload?.url || '').trim();
	const method = String(payload?.method || 'GET').toUpperCase();

	let pathStr = rawUrl;
	try {
		const parsed = new URL(rawUrl);
		pathStr = (parsed.pathname || '/') + (parsed.search || '');
	} catch {}
	const malformed = /(?:\/|=)(?:undefined|null|nan)(?:\/|$|\?|&)/i.test(pathStr);

	const start = Date.now();
	let entry: LocalBotApiRequestLog;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 6000);
		const res = await fetch(rawUrl, {
			method,
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		});
		clearTimeout(timeout);
		const latencyMs = Math.max(1, Date.now() - start);
		let detail: string | undefined;
		try {
			const text = await res.text();
			if (text) {
				try {
					const json = JSON.parse(text);
					detail = json.error || json.message || (res.ok ? `id: ${json.id || 'ok'}` : text.slice(0, 120));
				} catch {
					if (!res.ok) detail = text.slice(0, 120);
				}
			}
		} catch {}

		entry = {
			id: `probe-${start.toString(36)}`,
			method,
			url: rawUrl,
			path: pathStr,
			status: res.status,
			statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
			ok: res.ok,
			latencyMs,
			malformed,
			detail,
			timestamp: new Date().toISOString(),
		};
	} catch (err: any) {
		const latencyMs = Math.max(1, Date.now() - start);
		entry = {
			id: `probe-${start.toString(36)}`,
			method,
			url: rawUrl,
			path: pathStr,
			status: 0,
			statusText: 'Network Error',
			ok: false,
			latencyMs,
			malformed,
			detail: err?.message || 'Request failed',
			timestamp: new Date().toISOString(),
		};
	}

	let runtime = activeBotProcesses.get(botId);
	if (!runtime) {
		const configs = getStoredBotRunnerConfigs(store);
		if (!configs[botId]) {
			configs[botId] = {
				botId,
				name: `Bot ${botId}`,
				cwd: process.cwd(),
				command: 'pnpm dev',
			};
			store.set('localBotRunners', configs);
		}
		runtime = {
			proc: { killed: true, exitCode: 0 } as any,
			pid: null,
			startedAt: Date.now(),
			stoppedManually: true,
			lastExitCode: 0,
			logs: [],
			apiLogs: [],
		};
		activeBotProcesses.set(botId, runtime);
	}

	runtime.apiLogs.unshift(entry);
	if (runtime.apiLogs.length > MAX_BOT_API_LOGS) {
		runtime.apiLogs.length = MAX_BOT_API_LOGS;
	}
	const detailPart = entry.detail ? ` — ${entry.detail}` : '';
	runtime.logs.push(`[API] ${entry.method} ${entry.path} -> ${entry.status} ${entry.statusText} (${entry.latencyMs}ms)${detailPart}`);
	if (runtime.logs.length > MAX_BOT_LOG_LINES) {
		runtime.logs.splice(0, runtime.logs.length - MAX_BOT_LOG_LINES);
	}

	broadcastBotRunnerStates(store);
	return { entry, states: getLocalBotRunnersState(store) };
}

/* -------------------------------------------------------------------------- */
/* #3: Idle / Screen-Lock Privacy Shield & AFK Presence                       */
/* -------------------------------------------------------------------------- */

export interface DesktopIdleState {
	isIdle: boolean;
	idleSeconds: number;
	screenLocked: boolean;
	shieldActive: boolean;
}

let isScreenLocked = false;
let isShieldLocked = false;
let lastIdleFlag = false;
let idleTimer: NodeJS.Timeout | null = null;
const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

export function getIdleState(): DesktopIdleState {
	let idleSeconds = 0;
	try {
		idleSeconds = typeof powerMonitor.getSystemIdleTime === 'function' ? powerMonitor.getSystemIdleTime() : 0;
	} catch {}
	const isIdle = isScreenLocked || idleSeconds >= IDLE_THRESHOLD_SECONDS;
	return {
		isIdle,
		idleSeconds,
		screenLocked: isScreenLocked,
		shieldActive: isShieldLocked,
	};
}

function broadcastIdleState() {
	const state = getIdleState();
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			try {
				bw.webContents.send('idle:updated', state);
			} catch {}
		}
	}
}

export function unlockIdlePrivacyShield(): DesktopIdleState {
	isShieldLocked = false;
	broadcastIdleState();
	return getIdleState();
}

export function lockIdlePrivacyShield(): DesktopIdleState {
	isShieldLocked = true;
	broadcastIdleState();
	return getIdleState();
}

export function initIdleAndLockMonitor(getMeta: () => Metadata, log: (msg: string) => void) {
	if (idleTimer) clearInterval(idleTimer);

	try {
		powerMonitor.on('lock-screen', () => {
			isScreenLocked = true;
			const meta = getMeta();
			if (meta.idlePrivacyShield) {
				isShieldLocked = true;
			}
			if (meta.idleAfkRpc !== false && meta.discordRpc !== false) {
				setRpcIdleOverride(true);
			}
			log('IDLE: OS screen locked');
			broadcastIdleState();
		});

		powerMonitor.on('unlock-screen', () => {
			isScreenLocked = false;
			if (getMeta().idleAfkRpc !== false) {
				setRpcIdleOverride(false);
			}
			log('IDLE: OS screen unlocked');
			broadcastIdleState();
		});
	} catch {}

	idleTimer = setInterval(() => {
		const meta = getMeta();
		let idleSeconds = 0;
		try {
			idleSeconds = typeof powerMonitor.getSystemIdleTime === 'function' ? powerMonitor.getSystemIdleTime() : 0;
		} catch {}

		const nowIdle = isScreenLocked || idleSeconds >= IDLE_THRESHOLD_SECONDS;
		const prevShield = isShieldLocked;

		if (nowIdle && meta.idlePrivacyShield && !isShieldLocked) {
			isShieldLocked = true;
		}

		if (nowIdle !== lastIdleFlag || isShieldLocked !== prevShield) {
			lastIdleFlag = nowIdle;
			if (meta.idleAfkRpc !== false && meta.discordRpc !== false) {
				setRpcIdleOverride(nowIdle);
			}
			broadcastIdleState();
		}
	}, 15000);
}

/* -------------------------------------------------------------------------- */
/* #4: Native Drag-Out from CDN to Desktop / Discord (webContents.startDrag)  */
/* -------------------------------------------------------------------------- */

const preparedDragFiles = new Map<string, string>();

function getDragTempDir(): string {
	const dir = path.join(os.tmpdir(), 'xernerx-cdn-drag');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
}

function pruneOldDragTempFiles() {
	try {
		const dir = getDragTempDir();
		const now = Date.now();
		for (const name of fs.readdirSync(dir)) {
			const full = path.join(dir, name);
			try {
				const st = fs.statSync(full);
				if (now - st.mtimeMs > 10 * 60 * 1000) {
					fs.unlinkSync(full);
				}
			} catch {}
		}
	} catch {}
}

function sanitizeDragFilename(rawFilename: string, rawUrl: string): string {
	const base = path.basename(rawFilename || 'xernerx-asset.png').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
	if (path.extname(base)) return base;
	try {
		const urlExt = path.extname(new URL(rawUrl).pathname);
		if (urlExt) return `${base}${urlExt}`;
	} catch {}
	return `${base}.png`;
}

export async function prepareCdnDragFile(payload: { url: string; filename: string }): Promise<string | null> {
	if (!payload?.url) return null;
	const existing = preparedDragFiles.get(payload.url);
	if (existing && fs.existsSync(existing)) return existing;

	pruneOldDragTempFiles();
	try {
		const safeName = sanitizeDragFilename(payload.filename, payload.url);
		const hash = crypto.createHash('md5').update(payload.url).digest('hex').slice(0, 6);
		const targetPath = path.join(getDragTempDir(), `${hash}-${safeName}`);
		if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
			preparedDragFiles.set(payload.url, targetPath);
			return targetPath;
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 8000);
		const res = await fetch(payload.url, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) return null;

		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.length === 0 || buf.length > 25 * 1024 * 1024) return null;
		fs.writeFileSync(targetPath, buf);
		preparedDragFiles.set(payload.url, targetPath);
		return targetPath;
	} catch {
		return null;
	}
}

export function startNativeCdnDrag(webContents: Electron.WebContents, payload: { url: string; filename?: string; iconPath: string }): boolean {
	const filePath = preparedDragFiles.get(payload?.url || '');
	if (!filePath || !fs.existsSync(filePath)) return false;

	try {
		let dragIcon = nativeImage.createFromPath(filePath);
		if (!dragIcon.isEmpty()) {
			dragIcon = dragIcon.resize({ width: 64, height: 64 });
		} else if (fs.existsSync(payload.iconPath)) {
			dragIcon = nativeImage.createFromPath(payload.iconPath).resize({ width: 48, height: 48 });
		}
		webContents.startDrag({
			file: filePath,
			icon: dragIcon,
		});
		return true;
	} catch {
		return false;
	}
}

/* -------------------------------------------------------------------------- */
/* #5: Native OS Context Menu ("Upload to Xernerx CDN")                       */
/* -------------------------------------------------------------------------- */

const REG_KEY_PATH = 'HKCU\\Software\\Classes\\*\\shell\\XernerxCDN';

export function syncExplorerContextMenu(enabled: boolean, iconPath: string, log: (msg: string) => void) {
	if (process.platform !== 'win32') return;

	if (!enabled) {
		execFile('reg.exe', ['delete', REG_KEY_PATH, '/f'], { windowsHide: true }, () => {});
		return;
	}

	const appRoot = path.resolve(path.dirname(iconPath), '..');
	const cmdValue = app.isPackaged ? `"${process.execPath}" --upload="%1"` : `"${process.execPath}" "${appRoot}" --upload="%1"`;
	const resolvedIcon = fs.existsSync(iconPath) ? iconPath : process.execPath;

	execFile('reg.exe', ['add', REG_KEY_PATH, '/ve', '/d', 'Upload to Xernerx CDN', '/f'], { windowsHide: true }, (err) => {
		if (err) {
			log(`WARNING: Failed to register Explorer context menu: ${err.message}`);
			return;
		}
		execFile('reg.exe', ['add', REG_KEY_PATH, '/v', 'Icon', '/d', `"${resolvedIcon}"`, '/f'], { windowsHide: true }, () => {});
		execFile('reg.exe', ['add', `${REG_KEY_PATH}\\command`, '/ve', '/d', cmdValue, '/f'], { windowsHide: true }, () => {});
		log('EXPLORER CONTEXT MENU REGISTERED: Upload to Xernerx CDN');
	});
}

export function extractUploadArgFile(commandLine: string[]): string | null {
	const arg = commandLine.find((a) => a.startsWith('--upload='));
	if (!arg) return null;
	const rawPath = arg
		.slice('--upload='.length)
		.replace(/^['"]|['"]$/g, '')
		.trim();
	if (!rawPath || !fs.existsSync(rawPath)) return null;
	return rawPath;
}

export function dispatchLocalFileToCdnUpload(filePath: string, opts: { getWin: () => BrowserWindow | undefined; log: (msg: string) => void }): boolean {
	try {
		if (!fs.existsSync(filePath)) return false;
		const st = fs.statSync(filePath);
		if (!st.isFile() || st.size <= 0 || st.size > 20 * 1024 * 1024) return false;

		const ext = path.extname(filePath).toLowerCase();
		const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
		const raw = fs.readFileSync(filePath);
		const dataUrl = `data:${mime};base64,${raw.toString('base64')}`;
		const filename = path.basename(filePath);

		const win = opts.getWin();
		if (win && !win.isDestroyed()) {
			win.webContents.send('capture:ready', {
				dataUrl,
				filename,
				sourceType: 'watch-folder',
				timestamp: Date.now(),
			});
			opts.log(`EXPLORER UPLOAD DISPATCHED: ${filename} (${st.size} bytes)`);
			return true;
		}
	} catch {}
	return false;
}

/* -------------------------------------------------------------------------- */
/* #6: Custom Window Snap / Docked Companion Sidebar Mode                     */
/* -------------------------------------------------------------------------- */

export type DockedSide = 'left' | 'right' | null;

let currentDockedSide: DockedSide = null;
let preDockBounds: Electron.Rectangle | null = null;

export function getWindowDockedState(): { docked: boolean; side: DockedSide } {
	return {
		docked: currentDockedSide !== null,
		side: currentDockedSide,
	};
}

function broadcastDockedState() {
	const state = getWindowDockedState();
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			try {
				bw.webContents.send('window:dockedState', state);
			} catch {}
		}
	}
}

export function setWindowDockedMode(win: BrowserWindow | undefined, targetSide?: DockedSide): { docked: boolean; side: DockedSide } {
	if (!win || win.isDestroyed()) return getWindowDockedState();

	const nextSide: DockedSide = targetSide !== undefined ? targetSide : currentDockedSide === null ? 'right' : currentDockedSide === 'right' ? 'left' : null;

	if (nextSide === null) {
		currentDockedSide = null;
		if (preDockBounds) {
			try {
				win.setBounds(preDockBounds, true);
			} catch {}
			preDockBounds = null;
		}
		broadcastDockedState();
		return getWindowDockedState();
	}

	if (currentDockedSide === null) {
		try {
			if (win.isMaximized()) win.unmaximize();
			preDockBounds = win.getBounds();
		} catch {}
	}

	currentDockedSide = nextSide;
	try {
		const winBounds = win.getBounds();
		const display = screen.getDisplayMatching(winBounds) || screen.getPrimaryDisplay();
		const { workArea } = display;
		const dockWidth = Math.min(460, Math.max(400, Math.round(workArea.width * 0.26)));
		const x = nextSide === 'left' ? workArea.x : workArea.x + workArea.width - dockWidth;
		if (win.isMaximized()) win.unmaximize();
		win.setBounds(
			{
				x,
				y: workArea.y,
				width: dockWidth,
				height: workArea.height,
			},
			true
		);
		win.show();
	} catch {}

	broadcastDockedState();
	return getWindowDockedState();
}

/* -------------------------------------------------------------------------- */
/* #7: One-Click "Open in IDE / Terminal / Explorer" Actions                  */
/* -------------------------------------------------------------------------- */

export type LocalBotOpenTarget = 'vscode' | 'cursor' | 'terminal' | 'explorer';

export async function openLocalBotPathInTarget(cwd: string, target: LocalBotOpenTarget): Promise<{ ok: boolean; error?: string }> {
	const dir = String(cwd || '').trim();
	if (!dir || !fs.existsSync(dir)) {
		return { ok: false, error: 'Directory not found on disk' };
	}

	try {
		if (target === 'explorer') {
			const errStr = await shell.openPath(dir);
			return errStr ? { ok: false, error: errStr } : { ok: true };
		}

		if (target === 'vscode' || target === 'cursor') {
			const bin = target === 'cursor' ? 'cursor' : 'code';
			const child = spawn(`${bin} "${dir}"`, {
				cwd: dir,
				shell: true,
				detached: true,
				windowsHide: true,
				stdio: 'ignore',
			});
			child.unref();
			return { ok: true };
		}

		if (target === 'terminal') {
			if (process.platform === 'win32') {
				const wtPath = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'wt.exe');
				if (wtPath && fs.existsSync(wtPath)) {
					const child = spawn(wtPath, ['-d', dir], {
						cwd: dir,
						detached: true,
						windowsHide: false,
						stdio: 'ignore',
					});
					child.unref();
				} else {
					const escaped = dir.replace(/'/g, "''");
					const child = spawn('cmd.exe', ['/c', 'start', '""', 'powershell.exe', '-NoExit', '-Command', `Set-Location -LiteralPath '${escaped}'`], {
						cwd: dir,
						detached: true,
						windowsHide: false,
						stdio: 'ignore',
					});
					child.unref();
				}
				return { ok: true };
			}
			if (process.platform === 'darwin') {
				const child = spawn('open', ['-a', 'Terminal', dir], { detached: true, stdio: 'ignore' });
				child.unref();
				return { ok: true };
			}
			const child = spawn('x-terminal-emulator', ['--working-directory', dir], { detached: true, stdio: 'ignore' });
			child.unref();
			return { ok: true };
		}

		return { ok: false, error: 'Unsupported target' };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to launch application' };
	}
}

/* -------------------------------------------------------------------------- */
/* #8: Global Instant Snip-to-CDN (Screen & Window Source Picker)             */
/* -------------------------------------------------------------------------- */

export interface DesktopCaptureSourceInfo {
	id: string;
	name: string;
	type: 'screen' | 'window';
	thumbnailDataUrl: string;
}

export async function listDesktopCaptureSources(): Promise<DesktopCaptureSourceInfo[]> {
	try {
		const sources = await desktopCapturer.getSources({
			types: ['screen', 'window'],
			thumbnailSize: { width: 360, height: 202 },
		});
		return sources
			.filter((s) => s.thumbnail && !s.thumbnail.isEmpty() && s.name && !s.name.toLowerCase().includes('xernerx quick overlay'))
			.slice(0, 12)
			.map((s) => ({
				id: s.id,
				name: s.name,
				type: s.id.startsWith('screen:') ? 'screen' : 'window',
				thumbnailDataUrl: s.thumbnail.toDataURL(),
			}));
	} catch {
		return [];
	}
}

export async function captureDesktopSourceAndDispatch(
	sourceId: string | undefined,
	opts: {
		getWin: () => BrowserWindow | undefined;
		log: (msg: string) => void;
	}
): Promise<{ ok: boolean; filename?: string; dataUrl?: string }> {
	try {
		const sources = await desktopCapturer.getSources({
			types: ['screen', 'window'],
			thumbnailSize: { width: 1920, height: 1080 },
		});
		const target = (sourceId ? sources.find((s) => s.id === sourceId) : sources[0]) || sources[0];
		if (!target || !target.thumbnail || target.thumbnail.isEmpty()) {
			return { ok: false };
		}

		const dataUrl = target.thumbnail.toDataURL();
		try {
			(clipboard as any).writeImage(target.thumbnail);
		} catch {}

		const timestamp = Date.now();
		const filename = `xernerx-snip-${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.png`;
		const win = opts.getWin();
		if (win && !win.isDestroyed()) {
			win.webContents.send('capture:ready', {
				dataUrl,
				filename,
				sourceType: 'screen',
				timestamp,
			});
		}
		opts.log(`SNIP-TO-CDN: Captured source "${target.name}" (${filename})`);
		return { ok: true, filename, dataUrl };
	} catch {
		return { ok: false };
	}
}

/* -------------------------------------------------------------------------- */
/* #9: Native Windows Hello / Touch ID Verification                           */
/* -------------------------------------------------------------------------- */

export interface BiometricVerifyResult {
	verified: boolean;
	method: 'touch-id' | 'windows-hello' | 'fallback';
	canceled?: boolean;
	unavailable?: boolean;
	error?: string;
}

export async function verifyOsBiometrics(reason = 'Verify your identity for Xernerx Desktop'): Promise<BiometricVerifyResult> {
	const cleanReason = String(reason || 'Verify your identity for Xernerx Desktop')
		.replace(/[\r\n"']/g, ' ')
		.slice(0, 120);

	if (process.platform === 'darwin') {
		try {
			if (typeof systemPreferences.canPromptTouchID === 'function' && systemPreferences.canPromptTouchID()) {
				await systemPreferences.promptTouchID(cleanReason);
				return { verified: true, method: 'touch-id' };
			}
			return { verified: true, method: 'fallback', unavailable: true };
		} catch (err: any) {
			return {
				verified: false,
				method: 'touch-id',
				canceled: true,
				error: err?.message || 'Touch ID verification canceled',
			};
		}
	}

	if (process.platform === 'win32') {
		return new Promise((resolve) => {
			const psScript = `
$ErrorActionPreference = 'Stop'
try {
	$null = [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType = WindowsRuntime]
	Add-Type -AssemblyName System.Runtime.WindowsRuntime
	$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
		$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1'
	})[0]
	function Await-WinRt($op, $resultType) {
		$asTask = $asTaskGeneric.MakeGenericMethod($resultType)
		$task = $asTask.Invoke($null, @($op))
		$task.Wait(-1) | Out-Null
		return $task.Result
	}
	$avail = Await-WinRt ([Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()) ([Windows.Security.Credentials.UI.UserConsentVerifierAvailability])
	if ($avail.ToString() -ne 'Available') {
		Write-Output "UNAVAILABLE:$($avail.ToString())"
		exit 0
	}
	$res = Await-WinRt ([Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('${cleanReason}')) ([Windows.Security.Credentials.UI.UserConsentVerificationResult])
	Write-Output "RESULT:$($res.ToString())"
} catch {
	Write-Output "ERROR:$($_.Exception.Message)"
}
`;
			execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', psScript], { timeout: 45000, windowsHide: true }, (err, stdout) => {
				const out = String(stdout || '').trim();
				if (err || !out || out.startsWith('UNAVAILABLE:') || out.startsWith('ERROR:')) {
					resolve({ verified: true, method: 'fallback', unavailable: true });
					return;
				}
				if (out.includes('RESULT:Verified')) {
					resolve({ verified: true, method: 'windows-hello' });
					return;
				}
				if (out.includes('RESULT:DeviceNotPresent') || out.includes('RESULT:NotConfiguredForUser') || out.includes('RESULT:DisabledByPolicy')) {
					resolve({ verified: true, method: 'fallback', unavailable: true });
					return;
				}
				resolve({
					verified: false,
					method: 'windows-hello',
					canceled: true,
					error: 'Windows Hello verification canceled',
				});
			});
		});
	}

	return { verified: true, method: 'fallback', unavailable: true };
}
