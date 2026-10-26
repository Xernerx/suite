/** @format */
'use client';

import { EyeOff, Laptop, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useShortcuts, useTheme, useToast, type DotMatrixAnimation, type DotMatrixStage, type DotMatrixType } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { DotMatrixSettingsCard } from './DotMatrixSettingsCard';
import { AppearanceScalingCards } from './AppearanceScalingCards';

const PRESET_COLORS = [
	{ key: 'purple', value: '#8b7cf6' },
	{ key: 'violet', value: '#7c3aed' },
	{ key: 'indigo', value: '#6366f1' },
	{ key: 'cobalt', value: '#2563eb' },
	{ key: 'blue', value: '#3b82f6' },
	{ key: 'sky', value: '#38bdf8' },
	{ key: 'cyan', value: '#06b6d4' },
	{ key: 'mint', value: '#2dd4bf' },
	{ key: 'emerald', value: '#10b981' },
	{ key: 'green', value: '#a4b795' },
	{ key: 'neon', value: '#39ff14' },
	{ key: 'lime', value: '#acc813' },
	{ key: 'yellow', value: '#eab308' },
	{ key: 'gold', value: '#f59e0b' },
	{ key: 'orange', value: '#f97316' },
	{ key: 'peach', value: '#fdba74' },
	{ key: 'coral', value: '#fb7185' },
	{ key: 'crimson', value: '#ef4444' },
	{ key: 'berry', value: '#e11d48' },
	{ key: 'pink', value: '#ec4899' },
	{ key: 'magenta', value: '#d946ef' },
	{ key: 'lavender', value: '#c084fc' },
	{ key: 'slate', value: '#64748b' },
	{ key: 'charcoal', value: '#27272a' },
] as const;

function setThemeVar(name: string, value: string) {
	if (typeof document === 'undefined') return;
	document.documentElement.style.setProperty(name, value);
	if (document.body) {
		document.body.style.setProperty(name, value);
	}
}

function getPref(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
		if (match) return match[2];
	} catch {}
	try {
		return localStorage.getItem(key);
	} catch {}
	return null;
}

function setPref(key: string, value: string) {
	if (typeof window === 'undefined') return;
	try {
		const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
		if (window.location.hostname.endsWith(domain)) {
			document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			document.cookie = `${key}=${value}; domain=.${domain}; path=/; max-age=31536000; SameSite=Lax`;
		} else {
			document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
		}
	} catch {}
	try {
		localStorage.setItem(key, value);
	} catch {}
}

export default function Appearance() {
	const { data: session } = useSession();

	const { getEnvUrl } = useEnvironment();
	const { setTheme, setAccent, uiPreferences, setPreference } = useTheme();
	const { isContentHidden: isUiHidden, setContentHidden: setIsUiHidden, toggleContentHidden } = useShortcuts();
	const { toast } = useToast();
	const { t } = useDictionary();

	const dotMatrixStage: DotMatrixStage = uiPreferences?.dotMatrixStage || 'default';
	const dotMatrixType: DotMatrixType = uiPreferences?.dotMatrixType || (dotMatrixStage === 'orbit' ? 'orbit' : dotMatrixStage === 'blank' ? 'blank' : 'default');
	const dotMatrixAnimation: DotMatrixAnimation = uiPreferences?.dotMatrixAnimation || (dotMatrixStage === 'ripple' ? 'always' : 'animate');

	const [clientSync, setClientSync] = useState<boolean>(() => {
		return getPref('clientSync') === 'true';
	});
	const [syncFromDiscord, setSyncFromDiscord] = useState<boolean>(() => {
		return getPref('syncFromDiscord') !== 'false';
	});

	const [selectedColor, setSelectedColor] = useState<string>('#8b7cf6');
	const [selectedTheme, setSelectedTheme] = useState<string>('system');

	const [uiZoom, setUiZoom] = useState<number>(100);
	const [uiGap, setUiGap] = useState<string>('16');
	const [pageWidth, setPageWidth] = useState<string>('default');
	const [textScale, setTextScale] = useState<number>(14);

	const PAGE_WIDTH_MAP: Record<string, string> = {
		compact: '80rem',
		default: '96rem',
		wide: '112rem',
		full: '100%',
	};

	useEffect(() => {
		(() => {
			const storedClientSync = getPref('clientSync');
			setClientSync(storedClientSync === 'true');

			const storedSync = getPref('syncFromDiscord');
			setSyncFromDiscord(storedSync !== 'false');

			const storedAccent = getPref('accent');
			if (storedAccent) setSelectedColor(storedAccent);

			const storedTheme = getPref('theme');
			if (storedTheme) setSelectedTheme(storedTheme);

			const storedUiZoom = getPref('uiZoom');
			if (storedUiZoom) {
				const val = parseInt(storedUiZoom, 10);
				setUiZoom(val);
				setThemeVar('--ui-zoom', String(val / 100));
				setThemeVar('--ui-scale', String(val));
			} else {
				setThemeVar('--ui-zoom', '1');
				setThemeVar('--ui-scale', '100');
			}

			const storedUiGap = getPref('uiGap');
			if (storedUiGap) {
				setUiGap(storedUiGap);
				setThemeVar('--ui-gap', `${storedUiGap}px`);
			} else {
				setThemeVar('--ui-gap', '16px');
			}

			const storedPageWidth = getPref('pageWidth');
			if (storedPageWidth && PAGE_WIDTH_MAP[storedPageWidth]) {
				setPageWidth(storedPageWidth);
				setThemeVar('--page-width', PAGE_WIDTH_MAP[storedPageWidth]);
			} else {
				setThemeVar('--page-width', '96rem');
			}

			const storedTextScale = getPref('textScale');
			if (storedTextScale) {
				const val = parseInt(storedTextScale, 10);
				setTextScale(val);
				setThemeVar('--text-scale', `${val}px`);
			} else {
				setThemeVar('--text-scale', '14px');
			}
		})();
	}, []);

	const saveToDb = async (overrides: any) => {
		if (!session?.user || !(session.user as any).id) return;

		const isSyncEnabled = overrides.clientSync !== undefined ? overrides.clientSync : clientSync;
		if (!isSyncEnabled) return;

		const payload = {
			appearance: {
				theme: overrides.theme || selectedTheme,
				accent: overrides.accent || selectedColor,
				uiZoom: overrides.uiZoom || uiZoom,
				uiGap: overrides.uiGap || uiGap,
				pageWidth: overrides.pageWidth || pageWidth,
				textScale: overrides.textScale || textScale,
				clientSync: isSyncEnabled,
				syncFromDiscord: overrides.syncFromDiscord !== undefined ? overrides.syncFromDiscord : syncFromDiscord,
				uiPreferences: {
					dotMatrixStage: overrides.dotMatrixStage || dotMatrixStage,
					dotMatrixType: overrides.dotMatrixType || dotMatrixType,
					dotMatrixAnimation: overrides.dotMatrixAnimation || dotMatrixAnimation,
				},
			},
		};

		try {
			const userId = (session.user as any).id;
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('account.appearance.toast.syncFailed.title'));
			}
		} catch (e: any) {
			console.error('Failed to sync appearance to server', e);
			toast({ type: 'error', title: t('account.appearance.toast.syncFailed.title'), description: e.message || t('account.appearance.toast.syncFailed.description') });
		}
	};

	const handleToggleClientSync = (e: React.ChangeEvent<HTMLInputElement> | boolean) => {
		const isChecked = typeof e === 'boolean' ? e : e.target.checked;
		setClientSync(isChecked);
		setPref('clientSync', String(isChecked));

		if (isChecked) {
			saveToDb({ clientSync: true });
			toast({
				type: 'success',
				title: t('account.appearance.toast.clientSyncEnabled.title'),
				description: t('account.appearance.toast.clientSyncEnabled.description'),
			});
		} else {
			saveToDb({ clientSync: false });
			toast({
				type: 'info',
				title: t('account.appearance.toast.clientSyncDisabled.title'),
				description: t('account.appearance.toast.clientSyncDisabled.description'),
			});
		}
	};

	const handleToggleSync = (e: React.ChangeEvent<HTMLInputElement> | boolean) => {
		const isChecked = typeof e === 'boolean' ? e : e.target.checked;
		setSyncFromDiscord(isChecked);
		setPref('syncFromDiscord', String(isChecked));
		saveToDb({ syncFromDiscord: isChecked });

		if (isChecked) {
			window.location.reload();
		}
	};

	const handleSelectColor = (hex: string) => {
		setSelectedColor(hex);
		setAccent(hex);
		setPref('accent', hex);
		saveToDb({ accent: hex });
		toast({
			type: 'success',
			title: t('account.appearance.toast.accentColor.title'),
			description: t('account.appearance.toast.accentColor.description', { color: PRESET_COLORS.find((c) => c.value == hex)?.key || '' }),
		});
	};

	const handleThemeChange = (themeMode: string) => {
		setSelectedTheme(themeMode);
		setTheme(themeMode as 'system' | 'dark' | 'light');
		setPref('theme', themeMode);
		saveToDb({ theme: themeMode });
		toast({
			type: 'success',
			title: t('account.appearance.toast.theme.title'),
			description: t('account.appearance.toast.theme.description', { theme: themeMode }),
		});
	};

	const handleUiZoomChange = (val: number) => {
		setUiZoom(val);
		setPref('uiZoom', String(val));
		setThemeVar('--ui-zoom', String(val / 100));
		setThemeVar('--ui-scale', String(val));
		saveToDb({ uiZoom: val });
	};

	const handleUiGapChange = (val: string) => {
		setUiGap(val);
		setPref('uiGap', val);
		setThemeVar('--ui-gap', `${val}px`);
		saveToDb({ uiGap: val });
		toast({
			type: 'success',
			title: t('account.appearance.toast.density.title'),
		});
	};

	const handlePageWidthChange = (val: string) => {
		const resolvedCss = PAGE_WIDTH_MAP[val] || '96rem';
		setPageWidth(val);
		setPref('pageWidth', val);
		setThemeVar('--page-width', resolvedCss);
		saveToDb({ pageWidth: val });
		toast({
			type: 'success',
			title: t('account.appearance.toast.pageWidth.title'),
		});
	};

	const handleTextScaleChange = (val: number) => {
		setTextScale(val);
		setPref('textScale', String(val));
		setThemeVar('--text-scale', `${val}px`);
		saveToDb({ textScale: val });
	};

	const handleDotMatrixTypeChange = (nextType: DotMatrixType) => {
		setPreference('dotMatrixType', nextType);
		saveToDb({ dotMatrixType: nextType });
		toast({
			type: 'success',
			title: t('account.appearance.toast.dotMatrixStage.title'),
		});
	};

	const handleDotMatrixAnimationChange = (nextAnim: DotMatrixAnimation) => {
		setPreference('dotMatrixAnimation', nextAnim);
		saveToDb({ dotMatrixAnimation: nextAnim });
		toast({
			type: 'success',
			title: t('account.appearance.toast.dotMatrixStage.title'),
		});
	};

	const handleResetDefaults = () => {
		setSelectedTheme('system');
		setTheme('system');
		setPref('theme', 'system');

		setSelectedColor('#8b7cf6');
		setAccent('#8b7cf6');
		setPref('accent', '#8b7cf6');

		setUiZoom(100);
		setPref('uiZoom', '100');
		setThemeVar('--ui-zoom', '1');
		setThemeVar('--ui-scale', '100');

		setUiGap('16');
		setPref('uiGap', '16');
		setThemeVar('--ui-gap', '16px');

		setPageWidth('default');
		setPref('pageWidth', 'default');
		setThemeVar('--page-width', '96rem');

		setTextScale(14);
		setPref('textScale', '14');
		setThemeVar('--text-scale', '14px');

		setPreference('dotMatrixStage', 'default');
		setPreference('dotMatrixType', 'default');
		setPreference('dotMatrixAnimation', 'animate');

		saveToDb({
			theme: 'system',
			accent: '#8b7cf6',
			uiZoom: 100,
			uiGap: '16',
			pageWidth: 'default',
			textScale: 14,
			dotMatrixStage: 'default',
			dotMatrixType: 'default',
			dotMatrixAnimation: 'animate',
		});
		toast({ type: 'success', title: t('account.appearance.toast.resetSuccess') });
	};

	const renderOption = (Icon: any, text: string) => (
		<div className="flex items-center gap-2.5">
			<Icon size={16} />
			<span className="font-medium">{text}</span>
		</div>
	);

	const themeOptions = [
		{ value: 'dark', label: renderOption(Moon, t('account.appearance.theme.options.dark')) },
		{ value: 'light', label: renderOption(Sun, t('account.appearance.theme.options.light')) },
		{ value: 'system', label: renderOption(Laptop, t('account.appearance.theme.options.system')) },
	];

	return (
		<div
			className={`flex flex-col max-w-(--page-width) mx-auto w-full transition-opacity duration-300 ${isUiHidden ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.appearance.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.appearance.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<Button variant="secondary" onClick={() => setIsUiHidden(true)} className="flex items-center gap-2">
						<EyeOff size={15} />
						{t('account.appearance.hideUi')}
					</Button>
					<Button variant="secondary" onClick={handleResetDefaults} className="flex items-center gap-2">
						<RotateCcw size={15} />
						{t('account.appearance.resetDefaults')}
					</Button>
				</div>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Theme Selector Card */}
				<div
					className="relative z-50 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.theme.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.theme.description')}</p>
					</div>
					<div className="w-full sm:w-56">
						<Selector value={selectedTheme} options={themeOptions} onChange={handleThemeChange} />
					</div>
				</div>

				{/* Dot-Matrix Background Stage & Animation Card */}
				<DotMatrixSettingsCard
					dotMatrixType={dotMatrixType}
					dotMatrixAnimation={dotMatrixAnimation}
					onChangeType={handleDotMatrixTypeChange}
					onChangeAnimation={handleDotMatrixAnimationChange}
					isUiHidden={isUiHidden}
					onToggleHideUi={toggleContentHidden}
				/>

				{/* Sync Accent with Clients */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.clientSync.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.clientSync.description')}</p>
					</div>
					<Toggle checked={clientSync} onChange={handleToggleClientSync} suppressHydrationWarning />
				</div>

				{/* Sync Accent with Discord */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.discordSync.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.discordSync.description')}</p>
					</div>
					<Toggle checked={syncFromDiscord} onChange={handleToggleSync} suppressHydrationWarning />
				</div>

				{/* Accent Color Picker */}
				<div
					className={`flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-opacity ${syncFromDiscord ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.accentColor.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.accentColor.description')}</p>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pt-2" style={{ gap: 'var(--ui-gap)' }}>
						{PRESET_COLORS.map((color) => {
							const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
							const label = t(`account.appearance.colors.${color.key}`);

							return (
								<button
									key={color.value}
									onClick={() => handleSelectColor(color.value)}
									className={`flex items-center rounded-2xl border transition-all text-left ${
										isSelected ? 'border-(--accent) bg-(--active-accent)/20 shadow-xs' : 'border-(--border)/10 hover:border-(--border)/40'
									}`}
									style={{
										padding: 'calc(var(--ui-gap) * 0.75)',
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<div className="h-8 w-8 rounded-full shadow-inner shrink-0 border border-(--border)/10" style={{ backgroundColor: color.value }} />
									<span className="text-xs font-medium text-(--text) truncate">{label}</span>
								</button>
							);
						})}
					</div>
				</div>

				<AppearanceScalingCards
					uiZoom={uiZoom}
					onUiZoomChange={handleUiZoomChange}
					uiGap={uiGap}
					onUiGapChange={handleUiGapChange}
					pageWidth={pageWidth}
					onPageWidthChange={handlePageWidthChange}
					textScale={textScale}
					onTextScaleChange={handleTextScaleChange}
				/>
			</div>
		</div>
	);
}
