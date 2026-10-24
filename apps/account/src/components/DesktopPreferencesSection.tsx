/** @format */

'use client';

import { BellRing, Camera, Code2, Compass, FileText, FolderSync, Layers, LayoutTemplate, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { Badge, Button, Confirm, Input, Selector, Toggle } from '@xernerx/ui';
import { DesktopAccountSwitcher } from './DesktopAccountSwitcher';
import { DesktopLogsModal } from './DesktopLogsModal';
import {
	type BooleanDesktopKey,
	DEFAULT_DESKTOP_METADATA,
	DESKTOP_ITEMS,
	type DesktopMetadata,
	normalizeDesktopMetadata,
	RESTART_REQUIRED_KEYS,
	type StartupLocation,
	VALID_STARTUP_LOCATIONS,
	type WindowControlsStyle,
} from './desktopPreferencesConfig';
import { navigation } from '@xernerx/lib';
import { useDictionary, useEnvironment, useNotifications, usePermissions, useTheme, useToast } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';

export { DEFAULT_DESKTOP_METADATA, type DesktopMetadata, type StartupLocation, type WindowControlsStyle } from './desktopPreferencesConfig';

export function DesktopPreferencesSection() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { notifyNative } = useNotifications();
	const { hasPermission } = usePermissions();
	const { preferences } = useTheme();
	const { toast } = useToast();
	const hasAdminAccess = hasPermission('access');

	const [desktopMeta, setDesktopMeta] = useState<DesktopMetadata>(DEFAULT_DESKTOP_METADATA);
	const [isJsonMode, setIsJsonMode] = useState(false);
	const [jsonText, setJsonText] = useState(() => JSON.stringify(DEFAULT_DESKTOP_METADATA, null, 4));
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [needsRestart, setNeedsRestart] = useState(false);
	const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
	const [logsModalOpen, setLogsModalOpen] = useState(false);
	const [clearingCache, setClearingCache] = useState(false);
	const [capturing, setCapturing] = useState(false);
	const [broadcasterName, setBroadcasterName] = useState<string | null>(null);
	const [onBatteryPower, setOnBatteryPower] = useState(false);

	const metaRef = useRef<DesktopMetadata>(DEFAULT_DESKTOP_METADATA);
	const inFlightSaveRef = useRef<Promise<DesktopMetadata> | null>(null);
	const jsonDirtyRef = useRef(false);

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		const applyIncomingMeta = (incoming: any) => {
			if (!incoming || typeof incoming !== 'object') return;
			const merged = normalizeDesktopMetadata(incoming);
			metaRef.current = merged;
			setDesktopMeta(merged);
			if (!jsonDirtyRef.current) setJsonText(JSON.stringify(merged, null, 4));
		};

		if (bridge?.metadata && typeof bridge.metadata === 'object') applyIncomingMeta(bridge.metadata);
		bridge
			?.getMetadata?.()
			.then(applyIncomingMeta)
			.catch(() => {});
		bridge
			?.getStreamerState?.()
			?.then?.((st: any) => st && setBroadcasterName(st.broadcasterName || null))
			?.catch?.(() => {});
		bridge
			?.getPowerState?.()
			?.then?.((st: any) => st && setOnBatteryPower(Boolean(st.onBattery)))
			?.catch?.(() => {});

		const unsubStreamer = bridge?.onStreamerStateChange?.((st: any) => st && setBroadcasterName(st.broadcasterName || null));
		const unsubPower = bridge?.onPowerStateChange?.((st: any) => st && setOnBatteryPower(Boolean(st.onBattery)));
		const handleMetaUpdate = (e: Event) => applyIncomingMeta((e as CustomEvent)?.detail);
		const unsubscribe = bridge?.onMetadataUpdated?.(applyIncomingMeta);

		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => {
			window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
			unsubscribe?.();
			unsubStreamer?.();
			unsubPower?.();
		};
	}, []);

	const persistDesktopMetadata = async (nextMeta: DesktopMetadata): Promise<DesktopMetadata> => {
		const normalized = normalizeDesktopMetadata(nextMeta);
		metaRef.current = normalized;
		setDesktopMeta(normalized);
		setJsonText(JSON.stringify(normalized, null, 4));
		jsonDirtyRef.current = false;

		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.updateMetadata) {
			const saveTask = Promise.resolve(bridge.updateMetadata(normalized))
				.then((saved: any) => {
					const resolved = saved && typeof saved === 'object' ? normalizeDesktopMetadata(saved) : normalized;
					metaRef.current = resolved;
					setDesktopMeta(resolved);
					if (!jsonDirtyRef.current) setJsonText(JSON.stringify(resolved, null, 4));
					if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: resolved }));
					return resolved;
				})
				.catch(() => normalized);

			inFlightSaveRef.current = saveTask;
			try {
				return await saveTask;
			} finally {
				if (inFlightSaveRef.current === saveTask) inFlightSaveRef.current = null;
			}
		}

		if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: normalized }));
		return normalized;
	};

	const handleWindowControlsChange = async (val: string) => {
		await persistDesktopMetadata({ ...desktopMeta, windowControls: (val as WindowControlsStyle) || 'system' });
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	const handleStartupLocationChange = async (val: string) => {
		const location = VALID_STARTUP_LOCATIONS.includes(val as StartupLocation) ? (val as StartupLocation) : 'dashboard';
		await persistDesktopMetadata({ ...desktopMeta, startupLocation: location });
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	const handleToggleDesktopFlag = async (key: BooleanDesktopKey, requiresRestart: boolean, val: boolean | React.ChangeEvent<HTMLInputElement>) => {
		const checked = typeof val === 'boolean' ? val : val.target.checked;
		await persistDesktopMetadata({ ...desktopMeta, [key]: checked });
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
		if (requiresRestart) {
			setNeedsRestart(true);
			setRestartConfirmOpen(true);
		}
	};

	const handleFormatJson = () => {
		try {
			setJsonText(JSON.stringify(JSON.parse(jsonText), null, 4));
			setJsonError(null);
		} catch {
			setJsonError(t('account.preferences.desktop.invalidJson'));
		}
	};

	const handleSaveJson = async (): Promise<boolean> => {
		try {
			const parsed = JSON.parse(jsonText);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				setJsonError(t('account.preferences.desktop.invalidJson'));
				return false;
			}
			setJsonError(null);
			const previousMeta = metaRef.current;
			const nextMeta = normalizeDesktopMetadata(parsed);
			const requiresRestart = RESTART_REQUIRED_KEYS.some((k) => Boolean(nextMeta[k]) !== Boolean(previousMeta[k]));
			await persistDesktopMetadata(nextMeta);
			toast({ type: 'success', title: t('account.preferences.desktop.jsonSaved') });
			if (requiresRestart) {
				setNeedsRestart(true);
				setRestartConfirmOpen(true);
			}
			return true;
		} catch {
			setJsonError(t('account.preferences.desktop.invalidJson'));
			toast({ type: 'error', title: t('account.preferences.desktop.invalidJson') });
			return false;
		}
	};

	const handleToggleEditorMode = async () => {
		if (!isJsonMode) {
			setJsonText(JSON.stringify(metaRef.current, null, 4));
			setJsonError(null);
			jsonDirtyRef.current = false;
			setIsJsonMode(true);
			return;
		}
		if (jsonDirtyRef.current && !(await handleSaveJson())) return;
		setIsJsonMode(false);
	};

	const handleClearDesktopCache = async () => {
		setClearingCache(true);
		try {
			if (typeof window !== 'undefined' && 'caches' in window) {
				const keys = await window.caches.keys();
				await Promise.all(keys.map((k) => window.caches.delete(k)));
			}
			window.sessionStorage.clear();
			await (window as any).electron?.clearCache?.();
		} catch {}
		toast({ type: 'success', title: t('account.preferences.desktop.cacheCleared') });
		setTimeout(() => (setClearingCache(false), window.location.reload()), 750);
	};

	const handleLaunchOverlay = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.toggleOverlay) await bridge.toggleOverlay();
		else window.open(getEnvUrl('https://app.xernerx.com/overlay'), 'xernerx-overlay', 'width=380,height=520,menubar=no,toolbar=no,location=no,status=no');
	};

	const handleQuickCapture = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.quickCapture) return;
		setCapturing(true);
		try {
			await bridge.quickCapture('screen');
		} finally {
			setCapturing(false);
		}
	};

	const handleTestNotification = async () => {
		await notifyNative({ title: t('account.preferences.desktop.testNotificationTitle'), body: t('account.preferences.desktop.testNotificationBody'), force: true });
		toast({ type: 'success', title: t('account.preferences.desktop.testNotificationSent') });
	};

	const handleRestartDesktopApp = async () => {
		let finalMeta = metaRef.current;
		if (isJsonMode && jsonDirtyRef.current) {
			try {
				const parsed = JSON.parse(jsonText);
				if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return setJsonError(t('account.preferences.desktop.invalidJson'));
				finalMeta = normalizeDesktopMetadata(parsed);
			} catch {
				setJsonError(t('account.preferences.desktop.invalidJson'));
				return toast({ type: 'error', title: t('account.preferences.desktop.invalidJson') });
			}
		}
		setRestartConfirmOpen(false);
		try {
			if (inFlightSaveRef.current) await inFlightSaveRef.current;
			finalMeta = await persistDesktopMetadata(finalMeta);
		} catch {}
		await (window as any).electron?.restart?.(finalMeta);
	};

	const windowControlsOptions = (['system', 'windows', 'macos', 'xernerx'] as const).map((value) => ({
		value,
		label: t(`account.preferences.desktopItems.windowControls.options.${value}`),
	}));

	const handleSelectWatchFolder = async () => {
		const updated = await (window as any).electron?.selectWatchFolder?.();
		if (updated && typeof updated === 'object') {
			const normalized = normalizeDesktopMetadata(updated);
			metaRef.current = normalized;
			setDesktopMeta(normalized);
			toast({ type: 'success', title: t('account.preferences.toast.updated') });
		}
	};

	const handleClearWatchFolder = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.clearWatchFolder) {
			const updated = await bridge.clearWatchFolder();
			if (updated && typeof updated === 'object') {
				const normalized = normalizeDesktopMetadata(updated);
				metaRef.current = normalized;
				setDesktopMeta(normalized);
			}
		} else {
			await persistDesktopMetadata({ ...metaRef.current, cdnWatchFolder: '' });
		}
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	const startupLocationOptions = [
		{ value: 'last', label: t('account.preferences.desktopItems.startupLocation.lastVisited') },
		...navigation
			.filter((item) => !item.adminOnly || hasAdminAccess || desktopMeta.startupLocation === 'admin')
			.map((item) => ({ value: (item.label.split('.').pop() || 'dashboard') as StartupLocation, label: t(item.label) })),
	];

	return (
		<>
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				<div
					className="bg-(--background)/50 border-b border-(--border)/10 flex flex-col sm:flex-row sm:items-center justify-between"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.preferences.sections.desktop')}
							</h2>
							{desktopMeta.streamerMode && (
								<Badge variant="accent" size="sm">
									{broadcasterName ? `${t('account.preferences.desktop.streamerActive')} (${broadcasterName})` : t('account.preferences.desktop.streamerProtected')}
								</Badge>
							)}
							{onBatteryPower && desktopMeta.batterySaver && (
								<Badge variant="muted" size="sm">
									{t('account.preferences.desktop.batterySaverActive')}
								</Badge>
							)}
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.sections.desktopDesc')}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						<Button variant="secondary" size="sm" onClick={handleQuickCapture} disabled={capturing} className="flex items-center gap-1.5">
							<Camera size={14} /> {t('account.preferences.desktop.quickCapture')}
						</Button>
						<Button variant="secondary" size="sm" onClick={handleTestNotification} className="flex items-center gap-1.5">
							<BellRing size={14} /> {t('account.preferences.desktop.testNotification')}
						</Button>
						{preferences.developerMode && (
							<Button variant="secondary" size="sm" onClick={handleLaunchOverlay} className="flex items-center gap-1.5">
								<Layers size={14} /> {t('account.preferences.desktop.launchOverlay')}
							</Button>
						)}
						<Button variant="secondary" size="sm" onClick={() => setLogsModalOpen(true)} className="flex items-center gap-1.5">
							<FileText size={14} /> {t('account.preferences.desktop.openLogs')}
						</Button>
						<Button variant="secondary" size="sm" onClick={handleClearDesktopCache} disabled={clearingCache} className="flex items-center gap-1.5">
							{clearingCache ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} {t('account.preferences.desktop.clearCache')}
						</Button>
						<Button variant={isJsonMode ? 'primary' : 'secondary'} size="sm" onClick={handleToggleEditorMode} className="flex items-center gap-1.5">
							<Code2 size={14} /> {isJsonMode ? t('account.preferences.desktop.visualEditor') : t('account.preferences.desktop.editJson')}
						</Button>
					</div>
				</div>

				{needsRestart && (
					<div
						className="flex flex-col sm:flex-row sm:items-center justify-between bg-(--accent)/10 border-b border-(--accent)/25"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
					>
						<div className="flex items-center gap-3">
							<RefreshCw size={18} className="text-(--accent) shrink-0 animate-spin" />
							<div className="flex flex-col">
								<span className="text-sm font-bold text-(--text)">{t('account.preferences.desktop.restartBannerTitle')}</span>
								<span className="text-xs text-(--text-muted)">{t('account.preferences.desktop.restartBannerDesc')}</span>
							</div>
						</div>
						<Button variant="primary" size="sm" onClick={handleRestartDesktopApp} className="flex items-center gap-2 shrink-0">
							<RefreshCw size={14} /> {t('account.preferences.desktop.restartNow')}
						</Button>
					</div>
				)}

				{isJsonMode ? (
					<div className="flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<Input
							variant="textarea"
							rows={14}
							value={jsonText}
							onChange={(e) => {
								jsonDirtyRef.current = true;
								setJsonText(e.target.value);
								if (jsonError) setJsonError(null);
							}}
							onKeyDown={(e) => {
								if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
									e.preventDefault();
									handleSaveJson();
								}
							}}
							className="font-mono text-xs leading-relaxed"
						/>
						{jsonError && <p className="text-xs font-medium text-(--accent-red)">{jsonError}</p>}
						<div className="flex items-center justify-end gap-2">
							<Button variant="secondary" size="sm" onClick={handleFormatJson} className="flex items-center gap-1.5">
								<Code2 size={14} />
								{t('account.preferences.desktop.formatJson')}
							</Button>
							<Button variant="primary" size="sm" onClick={() => void handleSaveJson()} className="flex items-center gap-1.5">
								<Save size={14} />
								{t('account.preferences.desktop.saveJson')}
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
							<div className="flex items-start gap-3.5 max-w-2xl">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
									<Compass size={18} />
								</div>
								<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
									<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.startupLocation.title')}</h3>
									<p className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.startupLocation.description')}</p>
								</div>
							</div>
							<div className="w-full sm:w-64 shrink-0">
								<Selector value={desktopMeta.startupLocation || 'dashboard'} options={startupLocationOptions} onChange={handleStartupLocationChange} items={false} />
							</div>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
							<div className="flex items-start gap-3.5 max-w-2xl">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
									<LayoutTemplate size={18} />
								</div>
								<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
									<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.windowControls.title')}</h3>
									<p className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.windowControls.description')}</p>
								</div>
							</div>
							<div className="w-full sm:w-64 shrink-0">
								<Selector value={desktopMeta.windowControls || 'system'} options={windowControlsOptions} onChange={handleWindowControlsChange} items={false} />
							</div>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
							<div className="flex items-start gap-3.5 max-w-2xl">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
									<FolderSync size={18} />
								</div>
								<div className="flex flex-col min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
									<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktop.watchFolderTitle')}</h3>
									<p className="text-xs text-(--text-muted)">{t('account.preferences.desktop.watchFolderDesc')}</p>
									<span className="mt-1 inline-flex items-center rounded-xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-1 font-mono text-[11px] text-(--text-muted) truncate max-w-md">
										{desktopMeta.cdnWatchFolder || t('account.preferences.desktop.watchFolderEmpty')}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Button variant="secondary" size="sm" onClick={handleSelectWatchFolder} className="flex items-center gap-1.5">
									<FolderSync size={14} />
									{t('account.preferences.desktop.watchFolderSelect')}
								</Button>
								{desktopMeta.cdnWatchFolder && (
									<Button variant="ghost" size="sm" onClick={handleClearWatchFolder} className="flex items-center gap-1 text-(--text-muted) hover:text-(--accent-red)">
										<X size={14} />
										{t('account.preferences.desktop.watchFolderClear')}
									</Button>
								)}
							</div>
						</div>

						{DESKTOP_ITEMS.map(({ key, icon: Icon, requiresRestart }) => (
							<div
								key={key}
								className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-start gap-3.5 max-w-2xl">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
										<Icon size={18} />
									</div>
									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-base font-semibold text-(--text)">{t(`account.preferences.desktopItems.${key}.title`)}</h3>
											{requiresRestart && (
												<Badge variant="muted" size="sm">
													{t('account.preferences.desktop.restartBannerTitle')}
												</Badge>
											)}
										</div>
										<p className="text-xs text-(--text-muted)">{t(`account.preferences.desktopItems.${key}.description`)}</p>
									</div>
								</div>
								<Toggle checked={desktopMeta[key]} onChange={(val) => handleToggleDesktopFlag(key, requiresRestart, val)} suppressHydrationWarning />
							</div>
						))}
					</div>
				)}

				<DesktopAccountSwitcher />
			</div>

			<DesktopLogsModal open={logsModalOpen} onOpenChange={setLogsModalOpen} desktopMeta={desktopMeta} />

			<Confirm
				open={restartConfirmOpen}
				onOpenChange={setRestartConfirmOpen}
				title={t('account.preferences.desktop.restartModalTitle')}
				description={t('account.preferences.desktop.restartModalDesc')}
				confirmText={t('account.preferences.desktop.restartNow')}
				cancelText={t('account.preferences.desktop.restartLater')}
				variant="primary"
				onConfirm={handleRestartDesktopApp}
			/>
		</>
	);
}
