/** @format */

'use client';

import { Confirm } from '@xernerx/ui';
import { DesktopAccountSwitcher } from './DesktopAccountSwitcher';
import { DesktopLogsModal } from './DesktopLogsModal';
import { isCosmeticUnlocked, WINDOW_CONTROL_UNLOCK_MAP } from './cosmeticUnlocks';
import {
	type BooleanDesktopKey,
	DEFAULT_DESKTOP_METADATA,
	type DesktopAppIcon,
	type DesktopMetadata,
	normalizeDesktopMetadata,
	RESTART_REQUIRED_KEYS,
	type StartupLocation,
	VALID_STARTUP_LOCATIONS,
	type WindowControlsStyle,
} from './desktopPreferencesConfig';
import { DesktopPreferencesToolbar } from './desktop/DesktopPreferencesToolbar';
import { DesktopPreferencesBody } from './desktop/DesktopPreferencesBody';
import { navigation } from '@xernerx/lib';
import { useDictionary, useEnvironment, useNotifications, usePermissions, useTheme, useToast, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';

export { DEFAULT_DESKTOP_METADATA, type DesktopAppIcon, type DesktopMetadata, type StartupLocation, type WindowControlsStyle } from './desktopPreferencesConfig';

export function DesktopPreferencesSection() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { notifyNative } = useNotifications();
	const { hasPermission } = usePermissions();
	const { user } = useUser();
	const { preferences, setPreference } = useTheme();
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
		const next = (val as WindowControlsStyle) || 'system';
		const reqUnlock = WINDOW_CONTROL_UNLOCK_MAP[next];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			toast({
				type: 'info',
				title: t('account.appearance.dotMatrix.lockedToastTitle'),
				description: t('account.preferences.windowControlsLockedDesc'),
				action: {
					label: t('account.appearance.dotMatrix.openCreditStore'),
					onClick: () => {
						window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
					},
				},
			});
			return;
		}
		setPreference('windowControls', next);
		await persistDesktopMetadata({ ...desktopMeta, windowControls: next });
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	const handleAppIconChange = async (nextIcon: DesktopAppIcon) => {
		const target = nextIcon || 'default';
		const changed = target !== desktopMeta.appIcon;
		await persistDesktopMetadata({ ...desktopMeta, appIcon: target });
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
		if (changed) {
			setNeedsRestart(true);
			setRestartConfirmOpen(true);
		}
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
			const requiresRestart = RESTART_REQUIRED_KEYS.some((k) => Boolean(nextMeta[k]) !== Boolean(previousMeta[k])) || nextMeta.appIcon !== previousMeta.appIcon;
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

	const windowControlsOptions = (['system', 'windows', 'macos', 'xernerx', 'capsule', 'squircle', 'minimal'] as const).map((value) => {
		const unlocked = isCosmeticUnlocked(user, hasAdminAccess, WINDOW_CONTROL_UNLOCK_MAP[value]);
		return {
			value,
			label: unlocked ? t(`account.preferences.desktopItems.windowControls.options.${value}`) : `${t(`account.preferences.desktopItems.windowControls.options.${value}`)} 🔒`,
		};
	});

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
			.filter((item) => {
				const locKey = item.label.split('.').pop();
				return !item.adminOnly || hasPermission(item.requiredPermission || 'access') || desktopMeta.startupLocation === locKey;
			})
			.map((item) => ({ value: (item.label.split('.').pop() || 'dashboard') as StartupLocation, label: t(item.label) })),
	];

	return (
		<>
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				<DesktopPreferencesToolbar
					desktopMeta={desktopMeta}
					broadcasterName={broadcasterName}
					onBatteryPower={onBatteryPower}
					developerMode={Boolean(preferences.developerMode)}
					capturing={capturing}
					clearingCache={clearingCache}
					isJsonMode={isJsonMode}
					needsRestart={needsRestart}
					onQuickCapture={handleQuickCapture}
					onTestNotification={handleTestNotification}
					onLaunchOverlay={handleLaunchOverlay}
					onOpenLogs={() => setLogsModalOpen(true)}
					onClearCache={handleClearDesktopCache}
					onToggleEditorMode={handleToggleEditorMode}
					onRestartDesktopApp={handleRestartDesktopApp}
				/>

				<DesktopPreferencesBody
					isJsonMode={isJsonMode}
					jsonText={jsonText}
					jsonError={jsonError}
					onJsonChange={(nextText) => {
						jsonDirtyRef.current = true;
						setJsonText(nextText);
						if (jsonError) setJsonError(null);
					}}
					onFormatJson={handleFormatJson}
					onSaveJson={() => void handleSaveJson()}
					desktopMeta={desktopMeta}
					startupLocationOptions={startupLocationOptions}
					windowControlsOptions={windowControlsOptions}
					onStartupLocationChange={handleStartupLocationChange}
					onWindowControlsChange={handleWindowControlsChange}
					onAppIconChange={handleAppIconChange}
					onSelectWatchFolder={handleSelectWatchFolder}
					onClearWatchFolder={handleClearWatchFolder}
					onToggleDesktopFlag={handleToggleDesktopFlag}
				/>

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
