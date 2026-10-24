/** @format */
'use client';

import { ArrowRight, CheckCircle2, Download, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { Button, Modal } from '@xernerx/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';

export interface DesktopUpdateState {
	checking: boolean;
	outdated: boolean;
	currentVersion: string;
	latestVersion: string;
	channel: 'stable' | 'canary';
	downloadUrl: string | null;
}

function getElectron(): any {
	if (typeof window === 'undefined') return undefined;
	return (window as any).electron;
}

function cleanVer(raw: string | null | undefined): string {
	if (!raw) return '';
	return raw
		.trim()
		.replace(/^desktop@/i, '')
		.replace(/^v/i, '');
}

function isRemoteNewer(currentRaw: string, remoteRaw: string | null | undefined): boolean {
	const current = cleanVer(currentRaw);
	const remote = cleanVer(remoteRaw);
	if (!current || !remote || current === remote) return false;

	const [currentBase, currentPre = ''] = current.split('-', 2);
	const [remoteBase, remotePre = ''] = remote.split('-', 2);

	const cParts = currentBase.split('.').map((n) => parseInt(n, 10) || 0);
	const rParts = remoteBase.split('.').map((n) => parseInt(n, 10) || 0);

	const len = Math.max(cParts.length, rParts.length, 3);
	for (let i = 0; i < len; i++) {
		const c = cParts[i] ?? 0;
		const r = rParts[i] ?? 0;
		if (r > c) return true;
		if (r < c) return false;
	}

	if (currentPre && !remotePre) return true;
	if (!currentPre && remotePre) return false;
	if (currentPre && remotePre && currentPre !== remotePre && /^canary\.[a-f0-9]{5,}$/i.test(remotePre)) {
		return true;
	}

	return false;
}

function emitDesktopUpdateState(state: DesktopUpdateState) {
	if (typeof window === 'undefined') return;
	(window as any).__xernerxDesktopUpdateState = state;
	window.dispatchEvent(new CustomEvent('xernerx:desktop-update-state', { detail: state }));
}

export function VersionTracker() {
	const { data: session } = useSession();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const hasChecked = useRef(false);

	const [desktopUpdate, setDesktopUpdate] = useState<DesktopUpdateState | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [installing, setInstalling] = useState(false);
	const [installStatus, setInstallStatus] = useState<'idle' | 'downloading' | 'installing' | 'error'>('idle');
	const [progress, setProgress] = useState(0);

	// 1. Web App Changelog Version Tracker
	useEffect(() => {
		if (!isReady || !session?.user || hasChecked.current) return;
		hasChecked.current = true;

		const checkVersion = async () => {
			try {
				const hostname = window.location.hostname;
				let appName = hostname.split('.')[0];

				if (appName === 'dev' || appName === 'canary' || appName === 'www' || appName === 'xernerx' || hostname === 'localhost' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
					appName = 'www';
				}

				const res = await fetch('/api/version');
				if (!res.ok) return;

				const data = await res.json();
				if (!data.version) return;

				const currentVersion = data.version;
				const user = session.user as any;
				const lastSeenMap = user.lastSeenVersions || {};
				const lastSeenVersion = lastSeenMap[appName];

				if (lastSeenVersion && lastSeenVersion !== currentVersion) {
					toast({
						title: t('components.versionTracker.title'),
						description: t('components.versionTracker.description', {
							app: appName.charAt(0).toUpperCase() + appName.slice(1),
							version: currentVersion,
						}),
						action: {
							label: t('components.versionTracker.viewChangelog'),
							onClick: () => {
								window.location.href = getEnvUrl('https://info.xernerx.com/changelog');
							},
						},
						duration: 10000,
					});
				}

				if (lastSeenVersion !== currentVersion) {
					const updateRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify({
							[`lastSeenVersions.${appName}`]: currentVersion,
						}),
					});

					if (updateRes.ok) {
						if (!user.lastSeenVersions) user.lastSeenVersions = {};
						user.lastSeenVersions[appName] = currentVersion;
					}
				}
			} catch (error) {
				console.error('Failed to check version:', error);
			}
		};

		checkVersion();
	}, [isReady, session, getEnvUrl, toast, t]);

	// 2. Desktop App Outdated Checker & Header Updater Trigger
	const checkDesktopAppVersion = useCallback(
		async (manualTrigger = false) => {
			const electron = getElectron();
			const currentVersion = cleanVer(electron?.version);
			if (!currentVersion) return;

			const channel: 'stable' | 'canary' = currentVersion.includes('canary') ? 'canary' : 'stable';
			const checkingState: DesktopUpdateState = {
				checking: true,
				outdated: desktopUpdate?.outdated ?? false,
				currentVersion,
				latestVersion: desktopUpdate?.latestVersion || currentVersion,
				channel,
				downloadUrl: desktopUpdate?.downloadUrl ?? null,
			};
			setDesktopUpdate(checkingState);
			emitDesktopUpdateState(checkingState);

			try {
				let resolved: DesktopUpdateState | null = null;

				if (typeof electron?.checkForUpdate === 'function') {
					const ipcRes = await electron.checkForUpdate();
					if (ipcRes && ipcRes.latestVersion) {
						resolved = {
							checking: false,
							outdated: Boolean(ipcRes.outdated),
							currentVersion: cleanVer(ipcRes.currentVersion || currentVersion),
							latestVersion: cleanVer(ipcRes.latestVersion),
							channel: ipcRes.channel || channel,
							downloadUrl: ipcRes.downloadUrl || null,
						};
					}
				}

				// Fallback for older installed desktop binaries that don't yet expose `checkForUpdate`
				if (!resolved) {
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/downloads/app?channel=${channel}`));
					if (res.ok) {
						const data = await res.json();
						const ua = navigator.userAgent.toLowerCase();
						const asset = ua.includes('mac') ? data.macos : ua.includes('linux') ? data.linux : data.windows;
						let latestVersion = cleanVer(data.version);
						if (!latestVersion && asset?.name) {
							const match = String(asset.name).match(/Xernerx[\s_-]*App-(.+?)-setup\.(?:exe|dmg|AppImage)$/i);
							if (match?.[1]) latestVersion = cleanVer(match[1]);
						}
						if (latestVersion) {
							resolved = {
								checking: false,
								outdated: isRemoteNewer(currentVersion, latestVersion),
								currentVersion,
								latestVersion,
								channel,
								downloadUrl: asset?.url || null,
							};
						}
					}
				}

				const finalState: DesktopUpdateState = resolved || {
					checking: false,
					outdated: false,
					currentVersion,
					latestVersion: currentVersion,
					channel,
					downloadUrl: null,
				};

				setDesktopUpdate(finalState);
				emitDesktopUpdateState(finalState);

				if (finalState.outdated) {
					const dismissedKey = `xernerx_dismissed_desktop_update_${currentVersion}`;
					const dismissedTarget = sessionStorage.getItem(dismissedKey);
					if (manualTrigger || dismissedTarget !== finalState.latestVersion) {
						setModalOpen(true);
					}
				} else if (manualTrigger) {
					setModalOpen(true);
				}
			} catch (err) {
				console.error('Failed to check desktop client version:', err);
				const fallbackState: DesktopUpdateState = {
					checking: false,
					outdated: desktopUpdate?.outdated ?? false,
					currentVersion,
					latestVersion: desktopUpdate?.latestVersion || currentVersion,
					channel,
					downloadUrl: desktopUpdate?.downloadUrl ?? null,
				};
				setDesktopUpdate(fallbackState);
				emitDesktopUpdateState(fallbackState);
			}
		},
		[getEnvUrl, desktopUpdate?.outdated, desktopUpdate?.latestVersion, desktopUpdate?.downloadUrl]
	);

	useEffect(() => {
		const electron = getElectron();
		if (!isReady || !electron?.version) return;

		const unsubscribeProgress = electron.onUpdateProgress?.((payload: any) => {
			if (payload.status === 'downloading' || payload.status === 'checking') {
				setInstalling(true);
				setInstallStatus('downloading');
				setProgress(payload.progress || 1);
			} else if (payload.status === 'installing') {
				setInstalling(true);
				setInstallStatus('installing');
				setProgress(100);
			} else if (payload.status === 'error') {
				setInstalling(false);
				setInstallStatus('error');
			}
		});

		const handleOpenUpdater = () => {
			setModalOpen(true);
			void checkDesktopAppVersion(true);
		};

		window.addEventListener('xernerx:open-desktop-updater', handleOpenUpdater);

		void checkDesktopAppVersion(false);
		const interval = setInterval(
			() => {
				void checkDesktopAppVersion(false);
			},
			30 * 60 * 1000
		);

		return () => {
			clearInterval(interval);
			window.removeEventListener('xernerx:open-desktop-updater', handleOpenUpdater);
			unsubscribeProgress?.();
		};
	}, [isReady]);

	const handleInstallUpdate = async () => {
		if (!desktopUpdate) return;
		const electron = getElectron();

		if (typeof electron?.installUpdate === 'function') {
			setInstalling(true);
			setInstallStatus('downloading');
			setProgress(1);
			const ok = await electron.installUpdate();
			if (!ok) {
				setInstalling(false);
				setInstallStatus('error');
				const fallbackUrl = desktopUpdate.downloadUrl || getEnvUrl('https://www.xernerx.com/download');
				toast({
					title: t('components.versionTracker.desktopOutdated.title'),
					description: t('components.versionTracker.desktopOutdated.errorFallback', { error: 'Download interrupted' }),
					type: 'error',
				});
				if (electron?.openExternal) {
					await electron.openExternal(fallbackUrl);
				} else {
					window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
				}
			}
			return;
		}

		// Fallback for older desktop binaries without `installUpdate` IPC
		const targetUrl = desktopUpdate.downloadUrl || getEnvUrl('https://www.xernerx.com/download');
		if (electron?.openExternal) {
			await electron.openExternal(targetUrl);
		} else {
			window.open(targetUrl, '_blank', 'noopener,noreferrer');
		}
		setModalOpen(false);
	};

	const handleDownloadManual = async () => {
		const electron = getElectron();
		const targetUrl = getEnvUrl('https://www.xernerx.com/download');
		if (electron?.openExternal) {
			await electron.openExternal(targetUrl);
		} else {
			window.open(targetUrl, '_blank', 'noopener,noreferrer');
		}
	};

	const handleRemindLater = () => {
		if (desktopUpdate?.outdated) {
			sessionStorage.setItem(`xernerx_dismissed_desktop_update_${desktopUpdate.currentVersion}`, desktopUpdate.latestVersion);
		}
		setModalOpen(false);
	};

	if (!desktopUpdate || !modalOpen) return null;

	const isOutdated = desktopUpdate.outdated;
	const isChecking = desktopUpdate.checking;

	return (
		<Modal
			open={modalOpen}
			onOpenChange={(open) => !installing && setModalOpen(open)}
			title={isOutdated ? t('components.versionTracker.desktopOutdated.title') : t('components.versionTracker.desktopOutdated.modalTitleUpToDate')}
			maxWidth="max-w-lg"
		>
			<div className="space-y-5">
				<div
					className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
						isChecking
							? 'bg-(--accent)/10 border-(--accent)/30 text-(--accent)'
							: isOutdated
								? 'bg-(--accent-orange)/10 border-(--accent-orange)/30 text-(--accent-orange)'
								: 'bg-(--accent-green)/10 border-(--accent-green)/30 text-(--accent-green)'
					}`}
				>
					{isChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isOutdated ? <Sparkles className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
					<span>
						{isChecking
							? t('components.versionTracker.desktopOutdated.checkingBadge')
							: isOutdated
								? t('components.versionTracker.desktopOutdated.badge')
								: t('components.versionTracker.desktopOutdated.upToDateBadge')}
					</span>
				</div>

				<p className="text-sm text-(--text-muted) leading-relaxed">
					{isOutdated
						? t('components.versionTracker.desktopOutdated.description', {
								current: desktopUpdate.currentVersion,
								latest: desktopUpdate.latestVersion,
							})
						: t('components.versionTracker.desktopOutdated.upToDateDescription', {
								current: desktopUpdate.currentVersion,
							})}
				</p>

				<div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10">
					<div className="space-y-1">
						<span className="text-[11px] font-medium text-(--text-muted) block">{t('components.versionTracker.desktopOutdated.currentLabel')}</span>
						<span className="text-sm font-bold text-(--text) font-mono">v{desktopUpdate.currentVersion}</span>
					</div>
					<div className="space-y-1">
						<span className="text-[11px] font-medium text-(--text-muted) block">{t('components.versionTracker.desktopOutdated.latestLabel')}</span>
						<span className={`text-sm font-bold font-mono flex items-center gap-1 ${isOutdated ? 'text-(--accent)' : 'text-(--accent-green)'}`}>
							v{desktopUpdate.latestVersion}
							{isOutdated && <ArrowRight className="w-3.5 h-3.5" />}
						</span>
					</div>
					<div className="space-y-1">
						<span className="text-[11px] font-medium text-(--text-muted) block">{t('components.versionTracker.desktopOutdated.channelLabel')}</span>
						<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) border border-(--accent)/20 inline-block">
							{desktopUpdate.channel === 'canary' ? t('components.versionTracker.desktopOutdated.channelCanary') : t('components.versionTracker.desktopOutdated.channelStable')}
						</span>
					</div>
				</div>

				{installing && (
					<div className="space-y-2 p-3.5 rounded-2xl bg-(--background)/50 border border-(--accent)/30">
						<div className="flex items-center justify-between text-xs font-bold text-(--text)">
							<span className="flex items-center gap-2">
								<RefreshCw className="w-3.5 h-3.5 text-(--accent) animate-spin" />
								{installStatus === 'installing' ? t('components.versionTracker.desktopOutdated.installing') : t('components.versionTracker.desktopOutdated.downloading', { progress })}
							</span>
							<span className="text-(--accent) font-mono">{progress}%</span>
						</div>
						<div className="w-full h-2 rounded-full bg-(--foreground)/40 overflow-hidden">
							<div className="h-full bg-(--accent) rounded-full transition-all duration-200" style={{ width: `${Math.max(4, progress)}%` }} />
						</div>
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-2 pt-2">
					<Button variant="secondary" onClick={handleRemindLater} disabled={installing}>
						{isOutdated ? t('components.versionTracker.desktopOutdated.remindLater') : t('components.versionTracker.desktopOutdated.close')}
					</Button>

					<div className="flex items-center gap-2">
						<Button variant="secondary" onClick={handleDownloadManual} disabled={installing} className="gap-1.5">
							<ExternalLink className="w-4 h-4" />
							{t('components.versionTracker.desktopOutdated.downloadManual')}
						</Button>

						{isOutdated ? (
							<Button variant="primary" onClick={handleInstallUpdate} disabled={installing} className="gap-1.5">
								<Download className="w-4 h-4" />
								{installing
									? installStatus === 'installing'
										? t('components.versionTracker.desktopOutdated.installing')
										: t('components.versionTracker.desktopOutdated.downloading', { progress })
									: t('components.versionTracker.desktopOutdated.updateNow')}
							</Button>
						) : (
							<Button variant="primary" onClick={() => void checkDesktopAppVersion(true)} disabled={isChecking} className="gap-1.5">
								<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
								{isChecking ? t('components.versionTracker.desktopOutdated.checkingNow') : t('components.versionTracker.desktopOutdated.checkAgain')}
							</Button>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}
