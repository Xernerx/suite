/** @format */

import { BrowserWindow, globalShortcut, nativeImage, screen, session, shell } from 'electron';
import Store from 'electron-store';

export interface DesktopAccountProfile {
	slot: string;
	id?: string;
	username?: string;
	globalName?: string;
	avatar?: string;
	lastActive: number;
}

export interface OverlayRuntimeState {
	ghostMode: boolean;
	opacity: number;
}

let overlayWin: BrowserWindow | null = null;
let overlayGhostMode = false;
let overlayOpacity = 1;
let overlayHoveringInteractive = false;

function broadcastOverlayState() {
	const state: OverlayRuntimeState = {
		ghostMode: overlayGhostMode,
		opacity: overlayOpacity,
	};
	for (const bw of BrowserWindow.getAllWindows()) {
		if (!bw.isDestroyed()) {
			bw.webContents.send('overlay:state', state);
		}
	}
}

export function getOverlayState(): OverlayRuntimeState {
	return {
		ghostMode: overlayGhostMode,
		opacity: overlayOpacity,
	};
}

export function setOverlayGhostMode(enabled: boolean): OverlayRuntimeState {
	overlayGhostMode = Boolean(enabled);
	if (overlayWin && !overlayWin.isDestroyed()) {
		try {
			if (overlayGhostMode && !overlayHoveringInteractive) {
				overlayWin.setIgnoreMouseEvents(true, { forward: true });
			} else {
				overlayWin.setIgnoreMouseEvents(false);
			}
		} catch {}
	}
	broadcastOverlayState();
	return getOverlayState();
}

export function setOverlayInteractiveHover(hovering: boolean): OverlayRuntimeState {
	overlayHoveringInteractive = Boolean(hovering);
	if (overlayWin && !overlayWin.isDestroyed()) {
		try {
			if (overlayGhostMode && !overlayHoveringInteractive) {
				overlayWin.setIgnoreMouseEvents(true, { forward: true });
			} else {
				overlayWin.setIgnoreMouseEvents(false);
			}
		} catch {}
	}
	return getOverlayState();
}

export function setOverlayOpacity(opacity: number): OverlayRuntimeState {
	const clamped = Math.max(0.3, Math.min(1, Number(opacity) || 1));
	overlayOpacity = Math.round(clamped * 100) / 100;
	if (overlayWin && !overlayWin.isDestroyed()) {
		try {
			overlayWin.setOpacity(overlayOpacity);
		} catch {}
	}
	broadcastOverlayState();
	return getOverlayState();
}

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

function buildFallbackAndErrorGuardScript(state: { httpStatus: number; loadError: string; targetUrl: string }): string {
	const serializedState = JSON.stringify(state);
	return `
(() => {
	const navState = ${serializedState};
	const root = document.documentElement;
	if (!root) return;
	root.classList.add('is-electron');
	if (!document.body) return;

	const hasXernerxHeader = Boolean(document.querySelector('header a[aria-label="Xernerx Studios"]')) || window.location.pathname.startsWith('/overlay');
	const titleText = String(document.title || '');
	const bodyText = String(document.body?.innerText || '').slice(0, 6000);
	const combinedText = titleText + '\\n' + bodyText;
	const hasCfWrapper = Boolean(document.querySelector('#cf-error-details, #cf-wrapper, .cf-error-overview'));

	let errorInfo = null;
	const codeFromState = Number(navState.httpStatus) || 0;

	if (
		codeFromState === 530 ||
		codeFromState === 1033 ||
		/Error\\s*1033/i.test(combinedText) ||
		/Argo\\s*Tunnel\\s*error/i.test(combinedText) ||
		/Cloudflare\\s*Tunnel\\s*error/i.test(combinedText)
	) {
		errorInfo = {
			code: '1033',
			statusLabel: 'Error 1033 · Cloudflare Tunnel Unreachable',
			headline: 'Cloudflare Tunnel Error (1033)',
			detail: 'The Cloudflare tunnel to Xernerx is currently unreachable or restarting. Please wait a moment and click Refresh to reconnect.',
			isDanger: true,
		};
	} else if (
		codeFromState === 500 ||
		(!hasXernerxHeader && (
			/\\b500\\s*Internal\\s*Server\\s*Error\\b/i.test(combinedText) ||
			/^500\\b/i.test(titleText.trim()) ||
			/Internal\\s*Server\\s*Error/i.test(titleText) ||
			/Application error: a (client|server)-side exception has occurred/i.test(combinedText)
		))
	) {
		errorInfo = {
			code: '500',
			statusLabel: 'Error 500 · Internal Server Error',
			headline: 'Internal Server Error (500)',
			detail: 'The server encountered an unexpected error while processing your request. Click Refresh to try again.',
			isDanger: true,
		};
	} else if (
		codeFromState >= 500 ||
		(!hasXernerxHeader && (
			hasCfWrapper ||
			/\\b50[234]\\s*(Bad Gateway|Service Temporarily Unavailable|Service Unavailable|Gateway Time-?out)/i.test(combinedText) ||
			/\\b52[0-9]\\s*(Web server|Connection timed out|Origin is unreachable|A timeout occurred)/i.test(combinedText)
		))
	) {
		const matchedCode = combinedText.match(/\\b(50[0-9]|52[0-9]|530)\\b/);
		const resolvedCode = String(codeFromState >= 500 ? codeFromState : matchedCode ? matchedCode[1] : 500);
		errorInfo = {
			code: resolvedCode,
			statusLabel: 'Error ' + resolvedCode + ' · Server Temporarily Unavailable',
			headline: 'Server Unavailable (' + resolvedCode + ')',
			detail: 'The Xernerx upstream server or gateway is temporarily unreachable or restarting. Click Refresh to retry.',
			isDanger: true,
		};
	} else if (navState.loadError || window.location.protocol === 'chrome-error:') {
		const reason = navState.loadError || 'ERR_CONNECTION_FAILED';
		errorInfo = {
			code: 'OFFLINE',
			statusLabel: 'Connection Error · ' + reason,
			headline: 'Unable to Reach Server',
			detail: 'Could not establish a connection to the Xernerx server (' + reason + '). Check your connection or click Refresh to retry.',
			isDanger: false,
		};
	}

	const existingBar = document.getElementById('xernerx-electron-fallback-header');
	const existingOverlay = document.getElementById('xernerx-electron-error-overlay');

	if (hasXernerxHeader && !errorInfo) {
		if (existingBar) existingBar.remove();
		if (existingOverlay) existingOverlay.remove();
		return;
	}

	const runWinCmd = (cmd) => {
		try {
			if (cmd === 'minimize' && window.electron?.minimize) return window.electron.minimize();
			if (cmd === 'maximize' && window.electron?.maximize) return window.electron.maximize();
			if (cmd === 'close' && window.electron?.close) return window.electron.close();
			if (cmd === 'reload' && window.electron?.reload) return window.electron.reload(true);
		} catch {}
		console.debug('__xernerx_win_cmd__:' + cmd);
	};

	if (!document.getElementById('xernerx-electron-fallback-styles')) {
		const style = document.createElement('style');
		style.id = 'xernerx-electron-fallback-styles';
		style.textContent = \`
			@keyframes xxSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
			@keyframes xxPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
			#xernerx-electron-fallback-header button:hover { background: rgba(255, 255, 255, 0.08) !important; color: #ffffff !important; }
			#xernerx-electron-fallback-header #xx-close:hover { background: rgba(239, 68, 68, 0.22) !important; color: #f87171 !important; }
			#xernerx-electron-fallback-header #xx-refresh:hover { background: rgba(139, 124, 246, 0.24) !important; border-color: rgba(139, 124, 246, 0.5) !important; }
			#xernerx-electron-error-overlay #xx-card-refresh:hover { filter: brightness(1.1); transform: translateY(-1px); }
		\`;
		(document.head || root).appendChild(style);
	}

	const bar = existingBar || document.createElement('div');
	bar.id = 'xernerx-electron-fallback-header';
	bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:50px;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:rgba(9,9,11,0.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.08);color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;font-weight:700;-webkit-app-region:drag;app-region:drag;user-select:none;box-sizing:border-box;';

	const dotColor = errorInfo ? (errorInfo.isDanger ? '#f87171' : '#fbbf24') : '#8b7cf6';
	const statusText = errorInfo ? errorInfo.statusLabel : (titleText || window.location.hostname || 'Xernerx');

	bar.innerHTML = \`
		<div style="display:flex;align-items:center;gap:10px;min-width:0;overflow:hidden;">
			<span style="color:#8b7cf6;font-weight:800;letter-spacing:0.06em;font-size:12px;flex-shrink:0;">XERNERX</span>
			<span style="width:1px;height:14px;background:rgba(255,255,255,0.12);flex-shrink:0;"></span>
			<span style="display:inline-flex;align-items:center;gap:7px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);min-width:0;">
				<span id="xx-status-dot" style="width:7px;height:7px;border-radius:999px;background:\${dotColor};box-shadow:0 0 8px \${dotColor};animation:xxPulse 2s infinite;flex-shrink:0;"></span>
				<span id="xx-status-text" style="font-weight:600;font-size:12px;color:#e4e4e7;max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
			</span>
		</div>
		<div style="display:flex;align-items:center;gap:6px;-webkit-app-region:no-drag;app-region:no-drag;flex-shrink:0;">
			<button id="xx-refresh" type="button" title="Refresh (Ctrl+R)" style="display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:rgba(139,124,246,0.14);border:1px solid rgba(139,124,246,0.35);color:#f4f4f5;cursor:pointer;font-size:12px;font-weight:700;transition:all 0.15s ease;">
				<svg id="xx-refresh-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
				<span id="xx-refresh-label">Refresh</span>
			</button>
			<button id="xx-min" type="button" title="Minimize" style="width:30px;height:30px;border-radius:999px;background:transparent;border:none;color:#a1a1aa;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:16px;line-height:1;transition:all 0.15s ease;">&#8722;</button>
			<button id="xx-max" type="button" title="Maximize" style="width:30px;height:30px;border-radius:999px;background:transparent;border:none;color:#a1a1aa;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;transition:all 0.15s ease;">&#9633;</button>
			<button id="xx-close" type="button" title="Close" style="width:30px;height:30px;border-radius:999px;background:transparent;border:none;color:#a1a1aa;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:18px;line-height:1;transition:all 0.15s ease;">&times;</button>
		</div>
	\`;

	if (!existingBar) {
		document.body.style.paddingTop = '50px';
		document.body.appendChild(bar);
	}
	const statusTextNode = bar.querySelector('#xx-status-text');
	if (statusTextNode) statusTextNode.textContent = statusText;

	const triggerRefresh = () => {
		const statusNode = document.getElementById('xx-status-text');
		if (statusNode) statusNode.textContent = 'Refreshing connection...';
		const iconNode = document.getElementById('xx-refresh-icon');
		if (iconNode) iconNode.style.animation = 'xxSpin 0.8s linear infinite';
		const cardBtnLabel = document.getElementById('xx-card-refresh-label');
		if (cardBtnLabel) cardBtnLabel.textContent = 'Refreshing...';
		const cardIcon = document.getElementById('xx-card-refresh-icon');
		if (cardIcon) cardIcon.style.animation = 'xxSpin 0.8s linear infinite';
		runWinCmd('reload');
	};

	bar.querySelector('#xx-refresh')?.addEventListener('click', triggerRefresh);
	bar.querySelector('#xx-min')?.addEventListener('click', () => runWinCmd('minimize'));
	bar.querySelector('#xx-max')?.addEventListener('click', () => runWinCmd('maximize'));
	bar.querySelector('#xx-close')?.addEventListener('click', () => runWinCmd('close'));

	if (errorInfo) {
		const overlay = existingOverlay || document.createElement('div');
		overlay.id = 'xernerx-electron-error-overlay';
		overlay.style.cssText = 'position:fixed;inset:50px 0 0 0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 0%, rgba(139,124,246,0.14), rgba(9,9,11,0.98) 65%), #09090b;color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;user-select:none;box-sizing:border-box;';

		const badgeBg = errorInfo.isDanger ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)';
		const badgeBorder = errorInfo.isDanger ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)';
		const badgeText = errorInfo.isDanger ? '#f87171' : '#fbbf24';
		const displayUrl = navState.targetUrl || window.location.href || '';

		overlay.innerHTML = \`
			<div style="width:100%;max-width:460px;padding:32px 28px;border-radius:24px;background:rgba(24,24,27,0.75);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139,124,246,0.12);display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
				<div style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border-radius:999px;background:\${badgeBg};border:1px solid \${badgeBorder};color:\${badgeText};font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
					<span style="width:6px;height:6px;border-radius:999px;background:\${badgeText};"></span>
					<span>STATUS · \${errorInfo.code}</span>
				</div>
				<h1 id="xx-err-headline" style="margin:2px 0 0 0;font-size:22px;font-weight:800;color:#fafafa;letter-spacing:-0.01em;"></h1>
				<p id="xx-err-detail" style="margin:0;font-size:13.5px;line-height:1.55;color:#a1a1aa;max-width:390px;"></p>
				<div id="xx-err-url" style="margin-top:2px;padding:6px 12px;border-radius:12px;background:rgba(9,9,11,0.65);border:1px solid rgba(255,255,255,0.06);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;color:#71717a;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
				<div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
					<button id="xx-card-refresh" type="button" style="display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 20px;border-radius:16px;background:#8b7cf6;border:1px solid rgba(255,255,255,0.15);color:#ffffff;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(139,124,246,0.35);transition:all 0.15s ease;">
						<svg id="xx-card-refresh-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
						<span id="xx-card-refresh-label">Refresh Now</span>
					</button>
				</div>
				<span style="font-size:11px;color:#52525b;margin-top:2px;">Tip: Press Ctrl + R or F5 anytime to retry</span>
			</div>
		\`;

		if (!existingOverlay) {
			document.body.appendChild(overlay);
		}
		const hNode = overlay.querySelector('#xx-err-headline');
		if (hNode) hNode.textContent = errorInfo.headline;
		const dNode = overlay.querySelector('#xx-err-detail');
		if (dNode) dNode.textContent = errorInfo.detail;
		const uNode = overlay.querySelector('#xx-err-url');
		if (uNode) {
			if (displayUrl && !displayUrl.startsWith('chrome-error:')) {
				uNode.textContent = displayUrl;
			} else {
				uNode.style.display = 'none';
			}
		}
		overlay.querySelector('#xx-card-refresh')?.addEventListener('click', triggerRefresh);
	} else if (existingOverlay) {
		existingOverlay.remove();
	}
})();
`;
}

export function configureFramelessWindow(
	targetWin: BrowserWindow,
	opts: {
		preloadPath: string;
		iconPath: string;
		getPartition: () => string;
		shouldOpenExternal: () => boolean;
	}
) {
	let lastAttemptedUrl = '';
	let lastHttpStatus = 0;
	let lastLoadError = '';

	const reloadTargetWindow = (ignoreCache = false) => {
		if (targetWin.isDestroyed()) return;
		const currentUrl = targetWin.webContents.getURL();
		if ((!currentUrl || currentUrl.startsWith('chrome-error://')) && lastAttemptedUrl) {
			lastLoadError = '';
			targetWin.loadURL(lastAttemptedUrl).catch(() => {});
			return;
		}
		if (ignoreCache) {
			targetWin.webContents.reloadIgnoringCache();
		} else {
			targetWin.webContents.reload();
		}
	};

	const injectGuard = () => {
		if (targetWin.isDestroyed()) return;
		const currentUrl = targetWin.webContents.getURL();
		if (currentUrl.startsWith('file://') || currentUrl.startsWith('devtools://')) return;
		const script = buildFallbackAndErrorGuardScript({
			httpStatus: lastHttpStatus,
			loadError: lastLoadError,
			targetUrl: lastAttemptedUrl || currentUrl,
		});
		targetWin.webContents.executeJavaScript(script).catch(() => {});
	};

	try {
		targetWin.setMenuBarVisibility(false);
		targetWin.removeMenu();
		targetWin.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
			if (permission === 'notifications') return callback(true);
			callback(true);
		});
		targetWin.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
			if (permission === 'notifications') return true;
			return true;
		});
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
					backgroundThrottling: true,
					spellcheck: false,
					partition: opts.getPartition(),
				},
			},
		};
	});

	targetWin.webContents.on('before-input-event', (event, input) => {
		if (input.type !== 'keyDown') return;
		const key = input.key.toLowerCase();
		if (((input.control || input.meta) && !input.alt && key === 'r') || input.key === 'F5') {
			event.preventDefault();
			reloadTargetWindow(Boolean(input.shift));
		}
	});

	targetWin.webContents.on('console-message', (_event, _level, message) => {
		if (typeof message !== 'string' || !message.startsWith('__xernerx_win_cmd__:')) return;
		const cmd = message.slice('__xernerx_win_cmd__:'.length);
		if (targetWin.isDestroyed()) return;
		if (cmd === 'minimize') targetWin.minimize();
		else if (cmd === 'maximize') {
			if (targetWin.isMaximized()) targetWin.unmaximize();
			else targetWin.maximize();
		} else if (cmd === 'close') targetWin.close();
		else if (cmd === 'reload') reloadTargetWindow(true);
	});

	targetWin.webContents.on('did-start-navigation', (_event, url, isInPlace, isMainFrame) => {
		if (!isMainFrame || isInPlace) return;
		if (url && /^https?:\/\//i.test(url)) {
			lastAttemptedUrl = url;
			lastHttpStatus = 0;
			lastLoadError = '';
		}
	});

	targetWin.webContents.on('did-navigate', (_event, url, httpResponseCode) => {
		if (url && /^https?:\/\//i.test(url)) {
			lastAttemptedUrl = url;
		}
		lastHttpStatus = Number(httpResponseCode) || 0;
		injectGuard();
	});

	targetWin.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
		if (!isMainFrame || errorCode === -3) return;
		if (validatedURL && /^https?:\/\//i.test(validatedURL)) {
			lastAttemptedUrl = validatedURL;
		}
		lastLoadError = errorDescription || `ERR_${Math.abs(errorCode)}`;
		injectGuard();
		setTimeout(injectGuard, 150);
	});

	targetWin.webContents.on('dom-ready', () => {
		injectGuard();
	});

	targetWin.webContents.on('did-finish-load', () => {
		injectGuard();
	});
}

export function toggleOverlayWindow(opts: { webUrl: string; preloadPath: string; iconPath: string; partition: string; shouldOpenExternal?: () => boolean }): boolean {
	if (overlayWin && !overlayWin.isDestroyed()) {
		overlayWin.close();
		overlayWin = null;
		try {
			globalShortcut.unregister('Alt+Shift+O');
		} catch {}
		return false;
	}

	const { workArea } = screen.getPrimaryDisplay();
	const width = 400;
	const height = 560;
	const appIcon = nativeImage.createFromPath(opts.iconPath);

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
		icon: appIcon.isEmpty() ? opts.iconPath : appIcon,
		webPreferences: {
			preload: opts.preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			backgroundThrottling: true,
			spellcheck: false,
			partition: opts.partition,
		},
	});

	try {
		if (!appIcon.isEmpty()) overlayWin.setIcon(appIcon);
		overlayWin.setOpacity(overlayOpacity);
		if (overlayGhostMode) {
			overlayWin.setIgnoreMouseEvents(true, { forward: true });
		}
	} catch {}

	configureFramelessWindow(overlayWin, {
		preloadPath: opts.preloadPath,
		iconPath: opts.iconPath,
		getPartition: () => opts.partition,
		shouldOpenExternal: opts.shouldOpenExternal || (() => true),
	});

	overlayWin.setAlwaysOnTop(true, 'floating');
	overlayWin.loadURL(`${opts.webUrl}/overlay`).catch(() => {});

	try {
		globalShortcut.unregister('Alt+Shift+O');
		globalShortcut.register('Alt+Shift+O', () => {
			setOverlayGhostMode(!overlayGhostMode);
		});
	} catch {}

	overlayWin.on('closed', () => {
		overlayWin = null;
		overlayHoveringInteractive = false;
		try {
			globalShortcut.unregister('Alt+Shift+O');
		} catch {}
	});

	return true;
}

export function openCompanionWindow(opts: { targetUrl: string; preloadPath: string; iconPath: string; partition: string; streamerMode?: boolean; shouldOpenExternal?: () => boolean }): BrowserWindow {
	const { workArea } = screen.getPrimaryDisplay();
	const width = Math.min(1160, workArea.width - 80);
	const height = Math.min(780, workArea.height - 80);
	const offset = (BrowserWindow.getAllWindows().length % 5) * 28;
	const appIcon = nativeImage.createFromPath(opts.iconPath);

	const companionWin = new BrowserWindow({
		width,
		height,
		x: workArea.x + 80 + offset,
		y: workArea.y + 60 + offset,
		roundedCorners: true,
		frame: false,
		transparent: false,
		resizable: true,
		autoHideMenuBar: true,
		backgroundColor: '#09090b',
		icon: appIcon.isEmpty() ? opts.iconPath : appIcon,
		webPreferences: {
			preload: opts.preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			backgroundThrottling: true,
			spellcheck: false,
			partition: opts.partition,
		},
	});

	try {
		if (!appIcon.isEmpty()) companionWin.setIcon(appIcon);
		companionWin.setContentProtection(Boolean(opts.streamerMode));
	} catch {}

	configureFramelessWindow(companionWin, {
		preloadPath: opts.preloadPath,
		iconPath: opts.iconPath,
		getPartition: () => opts.partition,
		shouldOpenExternal: opts.shouldOpenExternal || (() => true),
	});

	companionWin.loadURL(opts.targetUrl).catch(() => {});
	companionWin.show();
	companionWin.focus();
	return companionWin;
}
