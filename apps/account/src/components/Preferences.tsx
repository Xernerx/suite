/** @format */
'use client';

import { Bell, Code2, Columns2, Command, Download, Gift, Globe, Keyboard, LayoutGrid, LayoutTemplate, Lock, PanelLeftClose, RotateCcw, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import { Button, Check, Selector, Toggle } from '@xernerx/ui';
import { headerSubdomainsCatalog } from '@xernerx/lib';
import { DesktopPreferencesSection } from './DesktopPreferencesSection';
import { isCosmeticUnlocked, UI_ICON_STYLE_UNLOCK_MAP, WINDOW_CONTROL_UNLOCK_MAP } from './cosmeticUnlocks';
import {
	DEFAULT_HEADER_SUBDOMAINS,
	useDictionary,
	useEnvironment,
	usePermissions,
	usePlatform,
	useTheme,
	useToast,
	useUser,
	type HeaderSubdomainId,
	type UIIconStyle,
	type UIPreferences,
	type WindowControlsStyle,
} from '@xernerx/providers';

type BooleanPreferenceKey = Exclude<
	keyof UIPreferences,
	'headerSubdomains' | 'alignment' | 'dotMatrixStage' | 'dotMatrixType' | 'dotMatrixRenderStyle' | 'dotMatrixAnimation' | 'windowControls' | 'uiIconStyle'
>;

const HEADER_ITEMS: Array<{ key: BooleanPreferenceKey; icon: any }> = [
	{ key: 'showHeaderCommandPalette', icon: Command },
	{ key: 'showHeaderNotifications', icon: Bell },
	{ key: 'showHeaderDownload', icon: Download },
	{ key: 'showHeaderAppDrawer', icon: LayoutGrid },
];

const WORKSPACE_ITEMS: Array<{ key: BooleanPreferenceKey; icon: any }> = [
	{ key: 'showShortcutHints', icon: Keyboard },
	{ key: 'showDiscordCollectibles', icon: Sparkles },
	{ key: 'showGiftBadge', icon: Gift },
	{ key: 'reducedMotion', icon: Zap },
	{ key: 'defaultSidebarCollapsed', icon: PanelLeftClose },
	{ key: 'developerMode', icon: Code2 },
];

export default function Preferences() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { preferences, setPreference, resetPreferences } = useTheme();
	const { user } = useUser();
	const { hasPermission } = usePermissions();
	const hasAdminAccess = hasPermission('access');
	const { type } = usePlatform();
	const { toast } = useToast();

	const isApplication = type === 'application';
	const visibleHeaderItems = HEADER_ITEMS.filter((item) => !(isApplication && item.key === 'showHeaderDownload'));
	const activeSubdomains: HeaderSubdomainId[] = Array.isArray(preferences.headerSubdomains) ? preferences.headerSubdomains : DEFAULT_HEADER_SUBDOMAINS;

	const handleToggleSubdomain = (subId: HeaderSubdomainId) => {
		const exists = activeSubdomains.includes(subId);
		const next = exists ? activeSubdomains.filter((id) => id !== subId) : [...activeSubdomains, subId];
		setPreference('headerSubdomains', next);
		toast({
			type: 'success',
			title: t('account.preferences.toast.updated'),
		});
	};

	const handleTogglePreference = (key: BooleanPreferenceKey, val: boolean | React.ChangeEvent<HTMLInputElement>) => {
		const checked = typeof val === 'boolean' ? val : val.target.checked;
		setPreference(key, checked);
		toast({
			type: 'success',
			title: t('account.preferences.toast.updated'),
		});
	};

	const handleAlignmentChange = (val: string) => {
		const next = (val === 'left' || val === 'right' ? val : 'system') as UIPreferences['alignment'];
		setPreference('alignment', next);
		toast({
			type: 'success',
			title: t('account.preferences.toast.updated'),
		});
	};

	const handleResetAll = () => {
		resetPreferences();
		toast({
			type: 'success',
			title: t('account.preferences.toast.reset'),
		});
	};

	const alignmentOptions = [
		{ value: 'system', label: t('account.preferences.items.alignment.options.system') },
		{ value: 'left', label: t('account.preferences.items.alignment.options.left') },
		{ value: 'right', label: t('account.preferences.items.alignment.options.right') },
	];

	const renderLockableLabel = (text: string, locked: boolean) => (
		<div className="flex items-center justify-between gap-2 w-full">
			<span>{text}</span>
			{locked && <Lock size={12} className="text-(--accent) shrink-0 opacity-80" />}
		</div>
	);

	const windowControlsOptions = (['system', 'windows', 'macos', 'xernerx', 'capsule', 'squircle', 'minimal'] as const).map((value) => {
		const unlocked = isCosmeticUnlocked(user, hasAdminAccess, WINDOW_CONTROL_UNLOCK_MAP[value]);
		return {
			value,
			label: renderLockableLabel(t(`account.preferences.desktopItems.windowControls.options.${value}`), !unlocked),
		};
	});

	const uiIconStyleOptions = (['standard', 'duotone', 'bold', 'precision'] as const).map((value) => {
		const unlocked = isCosmeticUnlocked(user, hasAdminAccess, UI_ICON_STYLE_UNLOCK_MAP[value]);
		return {
			value,
			label: renderLockableLabel(t(`account.preferences.uiIconStyle.${value}`), !unlocked),
		};
	});

	const handleWindowControlsSelect = (val: string) => {
		const next = (val || 'system') as WindowControlsStyle;
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
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	const handleUiIconStyleSelect = (val: string) => {
		const next = (val || 'standard') as UIIconStyle;
		const reqUnlock = UI_ICON_STYLE_UNLOCK_MAP[next];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			toast({
				type: 'info',
				title: t('account.appearance.dotMatrix.lockedToastTitle'),
				description: t('account.preferences.uiIconStyleLockedDesc'),
				action: {
					label: t('account.appearance.dotMatrix.openCreditStore'),
					onClick: () => {
						window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
					},
				},
			});
			return;
		}
		setPreference('uiIconStyle', next);
		toast({ type: 'success', title: t('account.preferences.toast.updated') });
	};

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<SlidersHorizontal className="text-(--accent)" size={32} />
						{t('account.preferences.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.preferences.description')}</p>
				</div>

				<Button variant="secondary" onClick={handleResetAll} className="flex items-center gap-2 shrink-0">
					<RotateCcw size={15} />
					{t('account.preferences.resetDefaults')}
				</Button>
			</div>

			{/* 1. Header & Navigation Bar Section */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				<div className="bg-(--background)/50 border-b border-(--border)/10 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.preferences.sections.header')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('account.preferences.sections.headerDesc')}</p>
				</div>

				<div className="flex flex-col">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex items-start gap-3.5 max-w-2xl">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
								<LayoutTemplate size={18} />
							</div>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
								<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.windowControls.title')}</h3>
								<p className="text-xs text-(--text-muted)">{t('account.preferences.items.headerControlsStyle.description')}</p>
							</div>
						</div>
						<div className="w-full sm:w-64 shrink-0">
							<Selector value={preferences.windowControls || 'system'} options={windowControlsOptions} onChange={handleWindowControlsSelect} items />
						</div>
					</div>

					<div className="flex flex-col border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex items-start gap-3.5 max-w-2xl">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
								<Globe size={18} />
							</div>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
								<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.items.headerSubdomains.title')}</h3>
								<p className="text-xs text-(--text-muted)">{t('account.preferences.items.headerSubdomains.description')}</p>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
							{headerSubdomainsCatalog
								.filter((sub) => !sub.adminOnly || hasPermission(sub.requiredPermission || 'access'))
								.map((sub) => {
									const SubIcon = sub.icon;
									const isPinned = activeSubdomains.includes(sub.id);
									return (
										<div
											key={sub.id}
											onClick={() => handleToggleSubdomain(sub.id)}
											className={`flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer select-none ${
												isPinned
													? 'bg-(--accent)/12 border-(--accent)/40 text-(--text) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
													: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:border-(--accent)/30 hover:text-(--text)'
											}`}
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<div
													className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${
														isPinned ? 'bg-(--accent)/20 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/40 border-(--border)/10 text-(--text-muted)'
													}`}
												>
													<SubIcon size={15} />
												</div>
												<div className="flex flex-col min-w-0">
													<span className="text-xs font-bold text-(--text) truncate">{t(sub.label)}</span>
													<span className="text-[10px] font-mono text-(--text-muted) truncate">{sub.host}</span>
												</div>
											</div>
											<div onClick={(e) => e.stopPropagation()}>
												<Check checked={isPinned} onCheckedChange={() => handleToggleSubdomain(sub.id)} size="sm" />
											</div>
										</div>
									);
								})}
						</div>
					</div>

					{visibleHeaderItems.map(({ key, icon: Icon }) => (
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
									<h3 className="text-base font-semibold text-(--text)">{t(`account.preferences.items.${key}.title`)}</h3>
									<p className="text-xs text-(--text-muted)">{t(`account.preferences.items.${key}.description`)}</p>
								</div>
							</div>
							<Toggle checked={Boolean(preferences[key])} onChange={(val) => handleTogglePreference(key, val)} suppressHydrationWarning />
						</div>
					))}
				</div>
			</div>

			{/* 2. Workspace, Profile & Motion Section */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				<div className="bg-(--background)/50 border-b border-(--border)/10 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.preferences.sections.workspace')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('account.preferences.sections.workspaceDesc')}</p>
				</div>

				<div className="flex flex-col">
					{/* Global Workspace & Sidebar Alignment Selector */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex items-start gap-3.5 max-w-2xl">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
								<Columns2 size={18} />
							</div>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
								<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.items.alignment.title')}</h3>
								<p className="text-xs text-(--text-muted)">{t('account.preferences.items.alignment.description')}</p>
							</div>
						</div>
						<div className="w-full sm:w-64 shrink-0">
							<Selector value={preferences.alignment || 'system'} options={alignmentOptions} onChange={handleAlignmentChange} items={false} />
						</div>
					</div>

					{/* Suite UI Icon Pack Style Selector */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex items-start gap-3.5 max-w-2xl">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
								<Sparkles size={18} />
							</div>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
								<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.uiIconStyle.title')}</h3>
								<p className="text-xs text-(--text-muted)">{t('account.preferences.uiIconStyle.description')}</p>
							</div>
						</div>
						<div className="w-full sm:w-64 shrink-0">
							<Selector value={preferences.uiIconStyle || 'standard'} options={uiIconStyleOptions} onChange={handleUiIconStyleSelect} items />
						</div>
					</div>

					{WORKSPACE_ITEMS.map(({ key, icon: Icon }) => (
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
									<h3 className="text-base font-semibold text-(--text)">{t(`account.preferences.items.${key}.title`)}</h3>
									<p className="text-xs text-(--text-muted)">{t(`account.preferences.items.${key}.description`)}</p>
								</div>
							</div>
							<Toggle checked={Boolean(preferences[key])} onChange={(val) => handleTogglePreference(key, val)} suppressHydrationWarning />
						</div>
					))}
				</div>
			</div>

			{/* 3. Desktop Client Section */}
			{isApplication && <DesktopPreferencesSection />}
		</div>
	);
}
