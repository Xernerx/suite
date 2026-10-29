/** @format */

import { type BrowserWindow, app, shell } from 'electron';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface DesktopUpdateCheckResult {
	outdated: boolean;
	currentVersion: string;
	latestVersion: string | null;
	tagName: string | null;
	publishedAt: string | null;
	channel: 'stable' | 'canary';
	downloadUrl: string | null;
	fileName: string | null;
	size: number | null;
}

export interface DesktopUpdateProgress {
	status: 'checking' | 'downloading' | 'installing' | 'up-to-date' | 'error';
	progress: number;
	downloadedBytes?: number;
	totalBytes?: number;
	version?: string | null;
	message?: string;
	error?: string;
}

interface UpdaterContext {
	getWin: () => BrowserWindow | undefined;
	sendStatus: (message: string) => void;
	sendError: (message: string) => void;
	log: (message: string) => void;
	prepareQuit: () => void;
}

let cachedUpdateInfo: DesktopUpdateCheckResult | null = null;
let activeInstallPromise: Promise<boolean> | null = null;

function cleanVersionString(raw: string | null | undefined): string {
	if (!raw) return '';
	return raw
		.trim()
		.replace(/^desktop@/i, '')
		.replace(/^v/i, '');
}

export function isRemoteVersionNewer(currentRaw: string, remoteRaw: string | null | undefined): boolean {
	const current = cleanVersionString(currentRaw);
	const remote = cleanVersionString(remoteRaw);
	if (!current || !remote || current === remote) return false;

	const [currentBase, currentPre = ''] = current.split('-', 2);
	const [remoteBase, remotePre = ''] = remote.split('-', 2);

	const currentParts = currentBase.split('.').map((n) => parseInt(n, 10) || 0);
	const remoteParts = remoteBase.split('.').map((n) => parseInt(n, 10) || 0);

	const maxLen = Math.max(currentParts.length, remoteParts.length, 3);
	for (let i = 0; i < maxLen; i++) {
		const c = currentParts[i] ?? 0;
		const r = remoteParts[i] ?? 0;
		if (r > c) return true;
		if (r < c) return false;
	}

	// Base versions are identical (e.g. 2.2.1 vs 2.2.1)
	// If current is a prerelease (e.g. 2.2.1-canary.abc) and remote is stable (2.2.1), remote is newer
	if (currentPre && !remotePre) return true;
	// If current is stable and remote is prerelease of same base, not newer
	if (!currentPre && remotePre) return false;

	// Both have prerelease tags on the same base version (e.g. rolling canary commits)
	if (currentPre && remotePre && currentPre !== remotePre) {
		// Only treat rolling canary hash change as newer if remote actually includes a commit hash (e.g. canary.7c210b8)
		if (/^canary\.[a-f0-9]{5,}$/i.test(remotePre)) {
			return true;
		}
	}

	return false;
}

function getCandidateApiBases(channel: 'stable' | 'canary'): string[] {
	const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || '';
	const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);
	const candidates: string[] = [];

	if (!app.isPackaged) {
		if (domain && !isIp && domain !== 'localhost' && domain !== '127.0.0.1') {
			candidates.push(`https://api.dev.${domain}`);
		} else {
			candidates.push(`http://${domain || '127.0.0.1'}:4001`);
		}
	}

	if (channel === 'canary') {
		candidates.push('https://api.canary.xernerx.com');
	}
	candidates.push('https://api.xernerx.com');

	return Array.from(new Set(candidates));
}

export async function checkDesktopRelease(log?: (msg: string) => void): Promise<DesktopUpdateCheckResult> {
	const currentVersion = cleanVersionString(app.getVersion());
	const channel: 'stable' | 'canary' = currentVersion.includes('canary') ? 'canary' : 'stable';
	const bases = getCandidateApiBases(channel);

	for (const base of bases) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);
			const res = await fetch(`${base}/secure/downloads/app?channel=${channel}`, {
				signal: controller.signal,
				headers: { Accept: 'application/json' },
			});
			clearTimeout(timeout);

			if (!res.ok) continue;

			const data = (await res.json()) as {
				version?: string | null;
				tagName?: string | null;
				publishedAt?: string | null;
				windows?: { name: string; url?: string; browser_download_url?: string; size?: number } | null;
				macos?: { name: string; url?: string; browser_download_url?: string; size?: number } | null;
				linux?: { name: string; url?: string; browser_download_url?: string; size?: number } | null;
			};

			const asset = process.platform === 'win32' ? data.windows : process.platform === 'darwin' ? data.macos : data.linux;
			const resolvedDownloadUrl = asset?.url || asset?.browser_download_url || null;

			// Fallback version extraction from asset filename if API route didn't return `version`
			let latestVersion = cleanVersionString(data.version);
			if (!latestVersion && asset?.name) {
				const match = asset.name.match(/Xernerx[\s_-]*App-(.+?)-setup\.(?:exe|dmg|AppImage)$/i);
				if (match?.[1]) latestVersion = cleanVersionString(match[1]);
			}
			if (!latestVersion && data.tagName && data.tagName !== 'canary') {
				latestVersion = cleanVersionString(data.tagName);
			}

			const outdated = isRemoteVersionNewer(currentVersion, latestVersion);
			const result: DesktopUpdateCheckResult = {
				outdated,
				currentVersion,
				latestVersion: latestVersion || null,
				tagName: data.tagName || null,
				publishedAt: data.publishedAt || null,
				channel,
				downloadUrl: resolvedDownloadUrl,
				fileName: asset?.name || null,
				size: typeof asset?.size === 'number' ? asset.size : null,
			};

			cachedUpdateInfo = result;
			log?.(`UPDATE CHECK (${base}): current=${currentVersion} latest=${latestVersion || 'unknown'} outdated=${outdated}`);
			return result;
		} catch (err) {
			log?.(`UPDATE CHECK FAILED (${base}): ${(err as Error).message}`);
		}
	}

	return (
		cachedUpdateInfo || {
			outdated: false,
			currentVersion,
			latestVersion: null,
			tagName: null,
			publishedAt: null,
			channel,
			downloadUrl: null,
			fileName: null,
			size: null,
		}
	);
}

function broadcastUpdateProgress(ctx: UpdaterContext, payload: DesktopUpdateProgress) {
	if (payload.message) {
		ctx.sendStatus(payload.message);
	}
	const win = ctx.getWin();
	if (win && !win.isDestroyed()) {
		try {
			win.webContents.send('update:progress', payload);
			if (payload.status === 'downloading') {
				win.setProgressBar(Math.max(0.02, Math.min(0.99, (payload.progress || 1) / 100)));
			} else if (payload.status === 'installing') {
				win.setProgressBar(1, { mode: 'indeterminate' });
			} else if (payload.status === 'error') {
				win.setProgressBar(1, { mode: 'error' });
				setTimeout(() => {
					if (!win.isDestroyed()) win.setProgressBar(-1);
				}, 3000);
			} else if (payload.status === 'up-to-date') {
				win.setProgressBar(-1);
			}
		} catch {}
	}
}

export async function downloadAndInstallUpdate(ctx: UpdaterContext, targetInfo?: DesktopUpdateCheckResult): Promise<boolean> {
	if (activeInstallPromise) return activeInstallPromise;

	activeInstallPromise = (async () => {
		try {
			broadcastUpdateProgress(ctx, {
				status: 'checking',
				progress: 0,
				message: 'Checking for updates…',
			});

			const info = targetInfo?.downloadUrl ? targetInfo : await checkDesktopRelease(ctx.log);
			if (!info.downloadUrl) {
				broadcastUpdateProgress(ctx, {
					status: 'error',
					progress: 0,
					error: 'No installer package found for your operating system.',
				});
				return false;
			}

			const safeFileName = (
				info.fileName || `Xernerx-App-${info.latestVersion || 'latest'}-setup.${process.platform === 'win32' ? 'exe' : process.platform === 'darwin' ? 'dmg' : 'AppImage'}`
			).replace(/[^a-zA-Z0-9._ -]/g, '_');
			const tempPath = path.join(app.getPath('temp'), safeFileName);

			broadcastUpdateProgress(ctx, {
				status: 'downloading',
				progress: 1,
				version: info.latestVersion,
				message: `Downloading update ${info.latestVersion ? `v${info.latestVersion} ` : ''}(1%)…`,
			});

			const res = await fetch(info.downloadUrl);
			if (!res.ok || !res.body) {
				throw new Error(`Download failed with HTTP ${res.status}`);
			}

			const totalBytes = Number(res.headers.get('content-length')) || info.size || 0;
			let downloadedBytes = 0;
			let lastReportedPercent = 1;

			const fileStream = fs.createWriteStream(tempPath);
			const reader = res.body.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					downloadedBytes += value.byteLength;
					fileStream.write(Buffer.from(value));
					if (totalBytes > 0) {
						const pct = Math.min(99, Math.max(1, Math.round((downloadedBytes / totalBytes) * 100)));
						if (pct !== lastReportedPercent) {
							lastReportedPercent = pct;
							broadcastUpdateProgress(ctx, {
								status: 'downloading',
								progress: pct,
								downloadedBytes,
								totalBytes,
								version: info.latestVersion,
								message: `Downloading update ${info.latestVersion ? `v${info.latestVersion} ` : ''}(${pct}%)…`,
							});
						}
					}
				}
			}

			await new Promise<void>((resolve, reject) => {
				fileStream.end(() => resolve());
				fileStream.on('error', reject);
			});

			broadcastUpdateProgress(ctx, {
				status: 'installing',
				progress: 100,
				downloadedBytes,
				totalBytes: totalBytes || downloadedBytes,
				version: info.latestVersion,
				message: 'Installing update & restarting…',
			});

			ctx.log(`UPDATE DOWNLOADED: ${tempPath} (${downloadedBytes} bytes)`);
			ctx.prepareQuit();

			await new Promise((r) => setTimeout(r, 600));

			if (process.platform === 'win32') {
				const child = spawn(tempPath, ['--updated'], {
					detached: true,
					stdio: 'ignore',
				});
				child.unref();
				app.exit(0);
			} else if (process.platform === 'darwin') {
				await shell.openPath(tempPath);
				app.exit(0);
			} else {
				try {
					fs.chmodSync(tempPath, 0o755);
				} catch {}
				await shell.openPath(tempPath);
				app.exit(0);
			}

			return true;
		} catch (error) {
			const message = (error as Error).message || 'Failed to download update';
			ctx.sendError(message);
			broadcastUpdateProgress(ctx, {
				status: 'error',
				progress: 0,
				error: message,
			});
			return false;
		} finally {
			activeInstallPromise = null;
		}
	})();

	return activeInstallPromise;
}

export async function runStartupUpdater(ctx: UpdaterContext, isDebug: boolean): Promise<void> {
	if (isDebug) return;
	// Warm the release check cache in the background without blocking app startup;
	// when the window finishes loading, VersionTracker prompts the user if outdated.
	void checkDesktopRelease(ctx.log).catch((error) => {
		ctx.log(`STARTUP UPDATE CHECK INFO: ${(error as Error).message}`);
	});
}
