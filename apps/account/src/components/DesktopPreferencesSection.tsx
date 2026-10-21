/** @format */

'use client';

import { Code2, Cpu, ExternalLink, FileText, Gamepad2, Keyboard, Layers, LayoutTemplate, Maximize2, Minimize2, Monitor, Pin, Power, RefreshCw, Save, Terminal, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Input, Selector, Toggle } from '@xernerx/ui';
import { DesktopAccountSwitcher } from './DesktopAccountSwitcher';
import { DesktopLogsModal } from './DesktopLogsModal';
import { useDictionary, useEnvironment, useTheme, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx';

export interface DesktopMetadata {
	hardwareAcceleration: boolean;
	debug: boolean;
	startOnBoot: boolean;
	startMaximized: boolean;
	startMinimized: boolean;
	alwaysOnTop: boolean;
	minimizeOnClose: boolean;
	globalHotkey: boolean;
	openExternalInBrowser: boolean;
	discordRpc: boolean;
	windowControls: WindowControlsStyle;
}

export const DEFAULT_DESKTOP_METADATA: DesktopMetadata = {
	hardwareAcceleration: true,
	debug: false,
	startOnBoot: false,
	startMaximized: false,
	startMinimized: false,
	alwaysOnTop: false,
	minimizeOnClose: false,
	globalHotkey: true,
	openExternalInBrowser: true,
	discordRpc: true,
	windowControls: 'system',
};

type BooleanDesktopKey = Exclude<keyof DesktopMetadata, 'windowControls'>;

const RESTART_REQUIRED_KEYS: Array<BooleanDesktopKey> = ['hardwareAcceleration', 'debug', 'startMaximized', 'startMinimized'];

const DESKTOP_ITEMS: Array<{ key: BooleanDesktopKey; icon: any; requiresRestart: boolean }> = [
	{ key: 'discordRpc', icon: Gamepad2, requiresRestart: false },
	{ key: 'hardwareAcceleration', icon: Cpu, requiresRestart: true },
	{ key: 'debug', icon: Terminal, requiresRestart: true },
	{ key: 'startOnBoot', icon: Power, requiresRestart: false },
	{ key: 'startMaximized', icon: Maximize2, requiresRestart: true },
	{ key: 'startMinimized', icon: Minimize2, requiresRestart: true },
	{ key: 'alwaysOnTop', icon: Pin, requiresRestart: false },
	{ key: 'minimizeOnClose', icon: Monitor, requiresRestart: false },
	{ key: 'globalHotkey', icon: Keyboard, requiresRestart: false },
	{ key: 'openExternalInBrowser', icon: ExternalLink, requiresRestart: false },
];

export function DesktopPreferencesSection() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { preferences } = useTheme();
	const { toast } = useToast();

	const [desktopMeta, setDesktopMeta] = useState<DesktopMetadata>(DEFAULT_DESKTOP_METADATA);
	const [isJsonMode, setIsJsonMode] = useState(false);
	const [jsonText, setJsonText] = useState(() => JSON.stringify(DEFAULT_DESKTOP_METADATA, null, 4));
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [needsRestart, setNeedsRestart] = useState(false);
	const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
	const [logsModalOpen, setLogsModalOpen] = useState(false);
	const [clearingCache, setClearingCache] = useState(false);

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;

		if (bridge?.getMetadata) {
			bridge
				.getMetadata()
				.then((meta: any) => {
					if (meta && typeof meta === 'object') {
						const merged = { ...DEFAULT_DESKTOP_METADATA, ...meta };
						setDesktopMeta(merged);
						setJsonText(JSON.stringify(merged, null, 4));
					}
				})
				.catch(() => {});
		} else if (bridge?.metadata && typeof bridge.metadata === 'object') {
			const merged = { ...DEFAULT_DESKTOP_METADATA, ...bridge.metadata };
			setDesktopMeta(merged);
			setJsonText(JSON.stringify(merged, null, 4));
		}

		const handleMetaUpdate = (e: Event) => {
			const detail = (e as CustomEvent)?.detail;
			if (detail && typeof detail === 'object') {
				const merged = { ...DEFAULT_DESKTOP_METADATA, ...detail };
				setDesktopMeta(merged);
				setJsonText(JSON.stringify(merged, null, 4));
			}
		};
		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
	}, []);

	const handleWindowControlsChange = async (val: string) => {
		const style = (val as WindowControlsStyle) || 'system';
		const nextMeta: DesktopMetadata = { ...desktopMeta, windowControls: style };
		setDesktopMeta(nextMeta);
		setJsonText(JSON.stringify(nextMeta, null, 4));

		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.updateMetadata) {
			try {
				await bridge.updateMetadata({ windowControls: style });
			} catch {}
		}
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: nextMeta }));
		}

		toast({
			type: 'success',
			title: t('account.preferences.toast.updated'),
		});
	};

	const handleToggleDesktopFlag = async (key: BooleanDesktopKey, requiresRestart: boolean, val: boolean | React.ChangeEvent<HTMLInputElement>) => {
		const checked = typeof val === 'boolean' ? val : val.target.checked;
		const nextMeta = { ...desktopMeta, [key]: checked };
		setDesktopMeta(nextMeta);
		setJsonText(JSON.stringify(nextMeta, null, 4));

		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.updateMetadata) {
			try {
				await bridge.updateMetadata({ [key]: checked });
			} catch {}
		}

		toast({
			type: 'success',
			title: t('account.preferences.toast.updated'),
		});

		if (requiresRestart) {
			setNeedsRestart(true);
			setRestartConfirmOpen(true);
		}
	};

	const handleFormatJson = () => {
		try {
			const parsed = JSON.parse(jsonText);
			setJsonText(JSON.stringify(parsed, null, 4));
			setJsonError(null);
		} catch {
			setJsonError(t('account.preferences.desktop.invalidJson'));
		}
	};

	const handleSaveJson = async () => {
		try {
			const parsed = JSON.parse(jsonText);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				setJsonError(t('account.preferences.desktop.invalidJson'));
				return;
			}
			setJsonError(null);

			const nextMeta: DesktopMetadata = {
				...DEFAULT_DESKTOP_METADATA,
				...parsed,
			};

			const requiresRestart = RESTART_REQUIRED_KEYS.some((k) => Boolean(nextMeta[k]) !== Boolean(desktopMeta[k]));

			setDesktopMeta(nextMeta);
			setJsonText(JSON.stringify(nextMeta, null, 4));

			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			if (bridge?.updateMetadata) {
				await bridge.updateMetadata(nextMeta);
			}
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: nextMeta }));
			}

			toast({
				type: 'success',
				title: t('account.preferences.desktop.jsonSaved'),
			});

			if (requiresRestart) {
				setNeedsRestart(true);
				setRestartConfirmOpen(true);
			}
		} catch {
			setJsonError(t('account.preferences.desktop.invalidJson'));
			toast({
				type: 'error',
				title: t('account.preferences.desktop.invalidJson'),
			});
		}
	};

	const handleClearDesktopCache = async () => {
		setClearingCache(true);
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		try {
			if (typeof window !== 'undefined' && 'caches' in window) {
				const keys = await window.caches.keys();
				await Promise.all(keys.map((k) => window.caches.delete(k)));
			}
			try {
				window.sessionStorage.clear();
			} catch {}
			await bridge?.clearCache?.();
		} catch {}
		toast({
			type: 'success',
			title: t('account.preferences.desktop.cacheCleared'),
		});
		setTimeout(() => {
			setClearingCache(false);
			window.location.reload();
		}, 750);
	};

	const handleLaunchOverlay = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.toggleOverlay) {
			await bridge.toggleOverlay();
		} else {
			window.open(getEnvUrl('https://app.xernerx.com/overlay'), 'xernerx-overlay', 'width=380,height=520,menubar=no,toolbar=no,location=no,status=no');
		}
	};

	const handleRestartDesktopApp = () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		setRestartConfirmOpen(false);
		bridge?.restart?.();
	};

	const windowControlsOptions = [
		{ value: 'system', label: t('account.preferences.desktopItems.windowControls.options.system') },
		{ value: 'windows', label: t('account.preferences.desktopItems.windowControls.options.windows') },
		{ value: 'macos', label: t('account.preferences.desktopItems.windowControls.options.macos') },
		{ value: 'xernerx', label: t('account.preferences.desktopItems.windowControls.options.xernerx') },
	];

	return (
		<>
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				<div
					className="bg-(--background)/50 border-b border-(--border)/10 flex flex-col sm:flex-row sm:items-center justify-between"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.preferences.sections.desktop')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.sections.desktopDesc')}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						{preferences.developerMode && (
							<Button variant="secondary" size="sm" onClick={handleLaunchOverlay} className="flex items-center gap-1.5">
								<Layers size={14} />
								{t('account.preferences.desktop.launchOverlay')}
							</Button>
						)}
						<Button variant="secondary" size="sm" onClick={() => setLogsModalOpen(true)} className="flex items-center gap-1.5">
							<FileText size={14} />
							{t('account.preferences.desktop.openLogs')}
						</Button>
						<Button variant="secondary" size="sm" onClick={handleClearDesktopCache} disabled={clearingCache} className="flex items-center gap-1.5">
							{clearingCache ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
							{t('account.preferences.desktop.clearCache')}
						</Button>
						<Button
							variant={isJsonMode ? 'primary' : 'secondary'}
							size="sm"
							onClick={() => {
								if (!isJsonMode) {
									setJsonText(JSON.stringify(desktopMeta, null, 4));
									setJsonError(null);
								}
								setIsJsonMode((prev) => !prev);
							}}
							className="flex items-center gap-1.5"
						>
							<Code2 size={14} />
							{isJsonMode ? t('account.preferences.desktop.visualEditor') : t('account.preferences.desktop.editJson')}
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
							<RefreshCw size={14} />
							{t('account.preferences.desktop.restartNow')}
						</Button>
					</div>
				)}

				{isJsonMode ? (
					<div className="flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<Input
							variant="textarea"
							rows={12}
							value={jsonText}
							onChange={(e) => {
								setJsonText(e.target.value);
								if (jsonError) setJsonError(null);
							}}
							className="font-mono text-xs leading-relaxed"
						/>

						{jsonError && <p className="text-xs font-medium text-(--accent-red)">{jsonError}</p>}

						<div className="flex items-center justify-end gap-2">
							<Button variant="secondary" size="sm" onClick={handleFormatJson} className="flex items-center gap-1.5">
								<Code2 size={14} />
								{t('account.preferences.desktop.formatJson')}
							</Button>
							<Button variant="primary" size="sm" onClick={handleSaveJson} className="flex items-center gap-1.5">
								<Save size={14} />
								{t('account.preferences.desktop.saveJson')}
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col">
						{/* Window Controls Style Selector */}
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
