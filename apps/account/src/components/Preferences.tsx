/** @format */
'use client';

import { Bell, Code2, Columns2, Command, Download, Gift, Keyboard, LayoutGrid, PanelLeftClose, RotateCcw, SlidersHorizontal, Sparkles, Store, Zap } from 'lucide-react';
import { Button, Selector, Toggle } from '@xernerx/ui';
import { DesktopPreferencesSection } from './DesktopPreferencesSection';
import { useDictionary, usePlatform, useTheme, useToast, type UIPreferences } from '@xernerx/providers';

type BooleanPreferenceKey = Exclude<keyof UIPreferences, 'alignment' | 'dotMatrixStage' | 'dotMatrixType' | 'dotMatrixAnimation'>;

const HEADER_ITEMS: Array<{ key: BooleanPreferenceKey; icon: any }> = [
	{ key: 'showHeaderStore', icon: Store },
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
	const { preferences, setPreference, resetPreferences } = useTheme();
	const { type } = usePlatform();
	const { toast } = useToast();

	const isApplication = type === 'application';
	const visibleHeaderItems = HEADER_ITEMS.filter((item) => !(isApplication && item.key === 'showHeaderDownload'));

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

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
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
