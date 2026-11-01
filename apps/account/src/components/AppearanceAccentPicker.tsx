/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Lock, RefreshCw, Sparkles } from 'lucide-react';
import { Badge, Button, Confirm, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, usePermissions, usePlatform, useToast, useUser } from '@xernerx/providers';
import { DESKTOP_ICON_UNLOCK_MAP, isCosmeticUnlocked } from './cosmeticUnlocks';
import { DEFAULT_DESKTOP_METADATA, DESKTOP_APP_ICON_OPTIONS, normalizeDesktopMetadata, type DesktopAppIcon, type DesktopMetadata } from './desktopPreferencesConfig';

export interface PresetColorOption {
	key: string;
	value: string;
	desktopIcon?: DesktopAppIcon;
	desktopIconSrc?: string;
}

export const PRESET_COLORS: readonly PresetColorOption[] = [
	{ key: 'purple', value: '#8b7cf6', desktopIcon: 'default', desktopIconSrc: '/icon.png' },
	{ key: 'violet', value: '#7c3aed' },
	{ key: 'indigo', value: '#6366f1' },
	{ key: 'cobalt', value: '#2563eb' },
	{ key: 'blue', value: '#3b82f6', desktopIcon: 'blue', desktopIconSrc: '/icon-blue.png' },
	{ key: 'sky', value: '#38bdf8' },
	{ key: 'cyan', value: '#06b6d4', desktopIcon: 'cyan', desktopIconSrc: '/icon-cyan.png' },
	{ key: 'mint', value: '#2dd4bf' },
	{ key: 'emerald', value: '#10b981', desktopIcon: 'green', desktopIconSrc: '/icon-green.png' },
	{ key: 'green', value: '#a4b795' },
	{ key: 'neon', value: '#39ff14' },
	{ key: 'lime', value: '#acc813' },
	{ key: 'yellow', value: '#eab308' },
	{ key: 'gold', value: '#f59e0b', desktopIcon: 'gold', desktopIconSrc: '/icon-gold.png' },
	{ key: 'orange', value: '#f97316', desktopIcon: 'orange', desktopIconSrc: '/icon-orange.png' },
	{ key: 'peach', value: '#fdba74' },
	{ key: 'coral', value: '#fb7185' },
	{ key: 'crimson', value: '#ef4444', desktopIcon: 'red', desktopIconSrc: '/icon-red.png' },
	{ key: 'berry', value: '#e11d48' },
	{ key: 'pink', value: '#ec4899', desktopIcon: 'pink', desktopIconSrc: '/icon-pink.png' },
	{ key: 'magenta', value: '#d946ef' },
	{ key: 'lavender', value: '#c084fc' },
	{ key: 'slate', value: '#64748b' },
	{ key: 'charcoal', value: '#27272a' },
	{ key: 'white', value: '#ffffff', desktopIcon: 'white', desktopIconSrc: '/icon-white.png' },
	{ key: 'black', value: '#09090b', desktopIcon: 'black', desktopIconSrc: '/icon-black.png' },
];

interface AppearanceAccentPickerProps {
	selectedColor: string;
	syncFromDiscord: boolean;
	onSelectColor: (hex: string) => void;
}

export function AppearanceAccentPicker({ selectedColor, syncFromDiscord, onSelectColor }: AppearanceAccentPickerProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { hasPermission } = usePermissions();
	const { type } = usePlatform();
	const { toast } = useToast();
	const hasAdminAccess = hasPermission('access');

	const [hasElectronBridge, setHasElectronBridge] = useState(false);
	const [desktopMeta, setDesktopMeta] = useState<DesktopMetadata>(DEFAULT_DESKTOP_METADATA);
	const [pendingDesktopColor, setPendingDesktopColor] = useState<PresetColorOption | null>(null);
	const [updatingIcon, setUpdatingIcon] = useState(false);
	const [needsRestart, setNeedsRestart] = useState(false);
	const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
	const metaRef = useRef<DesktopMetadata>(DEFAULT_DESKTOP_METADATA);

	const isDesktop = type === 'application' || hasElectronBridge;

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge) setHasElectronBridge(true);

		const applyIncomingMeta = (incoming: any) => {
			if (!incoming || typeof incoming !== 'object') return;
			const merged = normalizeDesktopMetadata(incoming);
			metaRef.current = merged;
			setDesktopMeta(merged);
		};

		if (bridge?.metadata && typeof bridge.metadata === 'object') {
			applyIncomingMeta(bridge.metadata);
		}
		bridge
			?.getMetadata?.()
			?.then?.(applyIncomingMeta)
			?.catch?.(() => {});

		const handleMetaUpdate = (e: Event) => applyIncomingMeta((e as CustomEvent)?.detail);
		const unsubscribe = bridge?.onMetadataUpdated?.(applyIncomingMeta);

		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => {
			window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
			unsubscribe?.();
		};
	}, []);

	const handleColorCardClick = (color: PresetColorOption) => {
		onSelectColor(color.value);

		if (isDesktop && color.desktopIcon && desktopMeta.appIcon !== color.desktopIcon) {
			const reqUnlock = DESKTOP_ICON_UNLOCK_MAP[color.desktopIcon];
			if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
				toast({
					type: 'info',
					title: t('account.appearance.dotMatrix.lockedToastTitle'),
					description: t('account.preferences.desktopIconLockedDesc'),
					action: {
						label: t('account.appearance.dotMatrix.openCreditStore'),
						onClick: () => {
							window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
						},
					},
				});
				return;
			}
			setPendingDesktopColor(color);
		}
	};

	const handleConfirmDesktopIcon = async () => {
		if (!pendingDesktopColor?.desktopIcon) {
			setPendingDesktopColor(null);
			return;
		}

		const targetIcon = pendingDesktopColor.desktopIcon;
		setUpdatingIcon(true);

		try {
			const nextMeta = normalizeDesktopMetadata({
				...metaRef.current,
				appIcon: targetIcon,
			});
			metaRef.current = nextMeta;
			setDesktopMeta(nextMeta);

			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			if (bridge?.updateMetadata) {
				const saved = await Promise.resolve(bridge.updateMetadata(nextMeta)).catch(() => nextMeta);
				const resolved = saved && typeof saved === 'object' ? normalizeDesktopMetadata(saved) : nextMeta;
				metaRef.current = resolved;
				setDesktopMeta(resolved);
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: resolved }));
				}
			} else if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: nextMeta }));
			}

			toast({
				type: 'success',
				title: t('account.appearance.desktopIconPrompt.toastSuccess', {
					icon: t(`account.preferences.desktopItems.appIcon.options.${targetIcon}`),
				}),
			});
			setNeedsRestart(true);
			setRestartConfirmOpen(true);
		} finally {
			setUpdatingIcon(false);
			setPendingDesktopColor(null);
		}
	};

	const handleRestartDesktopApp = async () => {
		setRestartConfirmOpen(false);
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		try {
			if (bridge?.updateMetadata) {
				await Promise.resolve(bridge.updateMetadata(metaRef.current)).catch(() => {});
			}
		} catch {}
		await bridge?.restart?.(metaRef.current);
	};

	const currentIconOption = DESKTOP_APP_ICON_OPTIONS.find((opt) => opt.value === desktopMeta.appIcon) || DESKTOP_APP_ICON_OPTIONS[0];
	const pendingIconKey = pendingDesktopColor?.desktopIcon || 'default';
	const pendingColorLabel = pendingDesktopColor ? t(`account.appearance.colors.${pendingDesktopColor.key}`) : '';
	const pendingIconLabel = t(`account.preferences.desktopItems.appIcon.options.${pendingIconKey}`);

	return (
		<>
			<div
				className={`flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-opacity ${
					syncFromDiscord ? 'opacity-50 pointer-events-none' : 'opacity-100'
				}`}
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-wrap items-center justify-between" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.accentColor.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.accentColor.description')}</p>
					</div>
					{isDesktop && (
						<Badge variant="accent" size="sm" className="flex items-center gap-1.5">
							<img
								src={currentIconOption.previewSrc}
								alt={t(`account.preferences.desktopItems.appIcon.options.${currentIconOption.value}`)}
								className="h-3.5 w-3.5 object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
								draggable={false}
							/>
							<span>
								{t('account.appearance.desktopIconPrompt.badge')}: {t(`account.preferences.desktopItems.appIcon.options.${currentIconOption.value}`)}
							</span>
						</Badge>
					)}
				</div>

				{isDesktop && needsRestart && (
					<div
						className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-(--accent)/10 border border-(--accent)/25"
						style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center gap-3">
							<RefreshCw size={16} className="text-(--accent) shrink-0 animate-spin" />
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('account.preferences.desktop.restartBannerTitle')}</span>
								<span className="text-xs text-(--text-muted)">{t('account.preferences.desktop.restartBannerDesc')}</span>
							</div>
						</div>
						<Button variant="primary" size="sm" onClick={handleRestartDesktopApp} className="flex items-center gap-2 shrink-0">
							<RefreshCw size={14} /> {t('account.preferences.desktop.restartNow')}
						</Button>
					</div>
				)}

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pt-2" style={{ gap: 'var(--ui-gap)' }}>
					{PRESET_COLORS.map((color) => {
						const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
						const label = t(`account.appearance.colors.${color.key}`);
						const hasMatchingDesktopIcon = Boolean(isDesktop && color.desktopIcon && color.desktopIconSrc);
						const isActiveDesktopIcon = Boolean(hasMatchingDesktopIcon && desktopMeta.appIcon === color.desktopIcon);
						const matchingIconName = color.desktopIcon ? t(`account.preferences.desktopItems.appIcon.options.${color.desktopIcon}`) : '';

						return (
							<button
								key={color.value}
								type="button"
								onClick={() => handleColorCardClick(color)}
								title={hasMatchingDesktopIcon ? t('account.appearance.desktopIconPrompt.cardHint', { icon: matchingIconName }) : label}
								className={`group flex items-center justify-between rounded-2xl border transition-all text-left cursor-pointer ${
									isSelected ? 'border-(--accent) bg-(--accent)/15 shadow-xs' : 'border-(--border)/10 hover:border-(--border)/40'
								}`}
								style={{
									padding: 'calc(var(--ui-gap) * 0.75)',
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<div className="flex items-center min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
									<div className="h-8 w-8 rounded-full shadow-inner shrink-0 border border-(--border)/25" style={{ backgroundColor: color.value }} />
									<span className="text-xs font-medium text-(--text) truncate">{label}</span>
								</div>

								{hasMatchingDesktopIcon && color.desktopIconSrc && (
									<div
										className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border p-1.5 transition-all ${
											isActiveDesktopIcon
												? 'bg-(--accent)/15 border-(--accent)/45 shadow-[0_0_12px_color-mix(in_srgb,var(--accent-readable,var(--accent))_20%,transparent)]'
												: 'bg-(--background)/60 border-(--border)/10 group-hover:border-(--border)/25'
										}`}
									>
										<img
											src={color.desktopIconSrc}
											alt={matchingIconName}
											className="h-full w-full object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
											draggable={false}
										/>
										{isActiveDesktopIcon ? (
											<span
												title={t('account.appearance.desktopIconPrompt.activeBadge')}
												className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast) border border-(--border)/20"
											>
												<Check size={8} strokeWidth={3} />
											</span>
										) : color.desktopIcon && !isCosmeticUnlocked(user, hasAdminAccess, DESKTOP_ICON_UNLOCK_MAP[color.desktopIcon]) ? (
											<span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-(--foreground) text-(--accent) border border-(--accent)/35">
												<Lock size={8} strokeWidth={2.5} />
											</span>
										) : null}
									</div>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<Modal
				open={Boolean(pendingDesktopColor)}
				onOpenChange={(open) => {
					if (!open && !updatingIcon) setPendingDesktopColor(null);
				}}
				title={t('account.appearance.desktopIconPrompt.title')}
				description={t('account.appearance.desktopIconPrompt.description', {
					color: pendingColorLabel,
					icon: pendingIconLabel,
				})}
				maxWidth="max-w-md"
			>
				{pendingDesktopColor && (
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex items-center justify-center gap-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 p-4">
							<div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--background)/80 border border-(--border)/10 p-2.5 shadow-sm">
									<img
										src={currentIconOption.previewSrc}
										alt={t(`account.preferences.desktopItems.appIcon.options.${currentIconOption.value}`)}
										className="h-full w-full object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
										draggable={false}
									/>
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('account.appearance.desktopIconPrompt.currentLabel')}</span>
								<span className="text-xs font-semibold text-(--text) truncate max-w-full">{t(`account.preferences.desktopItems.appIcon.options.${currentIconOption.value}`)}</span>
							</div>

							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--accent)/15 border border-(--accent)/30 text-(--accent)">
								<ArrowRight size={16} />
							</div>

							<div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
								<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/45 p-2.5 shadow-[0_0_20px_color-mix(in_srgb,var(--accent-readable,var(--accent))_22%,transparent)]">
									<img
										src={pendingDesktopColor.desktopIconSrc || '/icon.png'}
										alt={pendingIconLabel}
										className="h-full w-full object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
										draggable={false}
									/>
									<span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast) border border-(--border)/20">
										<Sparkles size={9} />
									</span>
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">{t('account.appearance.desktopIconPrompt.matchingLabel')}</span>
								<span className="text-xs font-bold text-(--text) truncate max-w-full">{pendingIconLabel}</span>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2">
							<Button variant="secondary" onClick={() => setPendingDesktopColor(null)} disabled={updatingIcon}>
								{t('account.appearance.desktopIconPrompt.skip')}
							</Button>
							<Button variant="primary" onClick={handleConfirmDesktopIcon} disabled={updatingIcon} className="flex items-center gap-1.5">
								<Sparkles size={14} />
								{t('account.appearance.desktopIconPrompt.confirm')}
							</Button>
						</div>
					</div>
				)}
			</Modal>

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
