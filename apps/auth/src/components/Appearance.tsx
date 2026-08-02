/** @format */
'use client';

import { Columns3, Laptop, Moon, Sun } from 'lucide-react';
import { Selector, Slider, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useTheme, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

const PRESET_COLORS = [
	{ key: 'purple', value: '#8b7cf6' },
	{ key: 'green', value: '#a4b795' },
	{ key: 'neon', value: '#39ff14' },
	{ key: 'blue', value: '#3b82f6' },
	{ key: 'pink', value: '#ec4899' },
	{ key: 'orange', value: '#f97316' },
	{ key: 'yellow', value: '#eab308' },
	{ key: 'crimson', value: '#ef4444' },
	{ key: 'mint', value: '#2dd4bf' },
	{ key: 'indigo', value: '#6366f1' },
	{ key: 'lime', value: '#acc813' },
	{ key: 'charcoal', value: '#27272a' },
] as const;

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
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		document.cookie = `${key}=${value}; domain=.xernerx.com; path=/; max-age=31536000; SameSite=Lax`;
	} catch {}
	try {
		localStorage.setItem(key, value);
	} catch {}
}

export default function Appearance() {
	const { data: session } = useSession();

	const { getEnvUrl } = useEnvironment();
	const { setTheme, setAccent } = useTheme();
	const { toast } = useToast();
	const { t } = useDictionary();

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
	const [textScale, setTextScale] = useState<number>(14);

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
				document.documentElement.style.setProperty('--ui-zoom', String(val / 100));
			} else {
				document.documentElement.style.setProperty('--ui-zoom', '1');
			}

			const storedUiGap = getPref('uiGap');
			if (storedUiGap) {
				setUiGap(storedUiGap);
				document.documentElement.style.setProperty('--ui-gap', `${storedUiGap}px`);
			} else {
				document.documentElement.style.setProperty('--ui-gap', '16px');
			}

			const storedTextScale = getPref('textScale');
			if (storedTextScale) {
				const val = parseInt(storedTextScale, 10);
				setTextScale(val);
				document.documentElement.style.setProperty('--text-scale', `${val}px`);
			} else {
				document.documentElement.style.setProperty('--text-scale', '14px');
			}
		})();
	}, []);

	const saveToDb = async (overrides: any) => {
		if (!session?.user || !(session.user as any).id) return;

		const isSyncEnabled = overrides.clientSync !== undefined ? overrides.clientSync : clientSync;
		if (!isSyncEnabled) return;

		const payload = {
			appearance: {
				theme: selectedTheme,
				accent: selectedColor,
				uiZoom,
				uiGap,
				textScale,
				clientSync: isSyncEnabled,
				syncFromDiscord,
				...overrides,
			},
		};

		try {
			const userId = (session.user as any).id;
			await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error('Failed to sync appearance to server', e);
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
				title: t('auth.appearance.toast.clientSyncEnabled.title', {}, 'Client Sync Enabled'),
				description: t('auth.appearance.toast.clientSyncEnabled.description', {}, 'Your appearance settings are now syncing to your account.'),
			});
		} else {
			saveToDb({ clientSync: false });
			toast({
				type: 'info',
				title: t('auth.appearance.toast.clientSyncDisabled.title', {}, 'Client Sync Disabled'),
				description: t('auth.appearance.toast.clientSyncDisabled.description', {}, 'Your appearance settings will stay local to this browser.'),
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
			title: t('auth.appearance.toast.accentColor.title', {}, 'Updated accent color!'),
			description: t(
				'auth.appearance.toast.accentColor.description',
				{ color: PRESET_COLORS.find((c) => c.value == hex)?.key || '' },
				`Set accent color to ${PRESET_COLORS.find((c) => c.value == hex)?.key}`
			),
		});
	};

	const handleThemeChange = (themeMode: string) => {
		setSelectedTheme(themeMode);
		setTheme(themeMode as 'system' | 'dark' | 'light');
		setPref('theme', themeMode);
		saveToDb({ theme: themeMode });
		toast({
			type: 'success',
			title: t('auth.appearance.toast.theme.title', {}, 'Updated theme!'),
			description: t('auth.appearance.toast.theme.description', { theme: themeMode }, `Set theme to ${themeMode}`),
		});
	};

	const handleUiZoomChange = (val: number) => {
		setUiZoom(val);
		setPref('uiZoom', String(val));
		document.documentElement.style.setProperty('--ui-zoom', String(val / 100));
		saveToDb({ uiZoom: val });
	};

	const handleUiGapChange = (val: string) => {
		setUiGap(val);
		setPref('uiGap', val);
		document.documentElement.style.setProperty('--ui-gap', `${val}px`);
		saveToDb({ uiGap: val });
		toast({ type: 'success', title: t('auth.appearance.toast.density.title', {}, 'Updated layout density!') });
	};

	const handleTextScaleChange = (val: number) => {
		setTextScale(val);
		setPref('textScale', String(val));
		document.documentElement.style.setProperty('--text-scale', `${val}px`);
		saveToDb({ textScale: val });
	};

	const themeOptions = [
		{
			value: 'dark',
			label: (
				<div className='flex items-center gap-2.5'>
					<Moon size={16} />
					<span className='font-medium'>{t('auth.appearance.theme.options.dark', {}, 'Dark')}</span>
				</div>
			),
		},
		{
			value: 'light',
			label: (
				<div className='flex items-center gap-2.5'>
					<Sun size={16} />
					<span className='font-medium'>{t('auth.appearance.theme.options.light', {}, 'Light')}</span>
				</div>
			),
		},
		{
			value: 'system',
			label: (
				<div className='flex items-center gap-2.5'>
					<Laptop size={16} />
					<span className='font-medium'>{t('auth.appearance.theme.options.system', {}, 'System')}</span>
				</div>
			),
		},
	];

	const densityOptions = [
		{
			value: '10',
			label: (
				<div className='flex items-center gap-2.5'>
					<Columns3 size={16} />
					<span className='font-medium'>{t('auth.appearance.density.compact', {}, 'Compact')}</span>
				</div>
			),
		},
		{
			value: '16',
			label: (
				<div className='flex items-center gap-2.5'>
					<Columns3 size={16} />
					<span className='font-medium'>{t('auth.appearance.density.default', {}, 'Default')}</span>
				</div>
			),
		},
		{
			value: '24',
			label: (
				<div className='flex items-center gap-2.5'>
					<Columns3 size={16} />
					<span className='font-medium'>{t('auth.appearance.density.spacious', {}, 'Spacious')}</span>
				</div>
			),
		},
	];

	return (
		<div
			className='flex flex-col max-w-4xl mx-auto w-full'
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}>
			<div className='flex flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className='text-3xl font-black tracking-tight text-(--text)'>{t('auth.appearance.title', {}, 'Appearance')}</h1>
				<p className='text-sm text-(--text-muted)'>{t('auth.appearance.description', {}, 'Customize how the interface looks and feels across your workspace.')}</p>
			</div>

			<div className='flex flex-col' style={{ gap: 'var(--ui-gap)' }}>
				{/* Theme Selector Card */}
				<div
					className='flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.theme.title', {}, 'Theme')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.theme.description', {}, 'Choose your preferred interface theme mode.')}</p>
					</div>
					<div className='w-full sm:w-56'>
						<Selector value={selectedTheme} options={themeOptions} onChange={handleThemeChange} />
					</div>
				</div>

				{/* Sync Accent with Clients */}
				<div
					className='flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.clientSync.title', {}, 'Sync Appearance Settings Across Clients')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.clientSync.description', {}, 'Automatically load appearance settings on all your devices.')}</p>
					</div>
					<Toggle checked={clientSync} onChange={handleToggleClientSync} suppressHydrationWarning />
				</div>

				{/* Sync Accent with Discord */}
				<div
					className='flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.discordSync.title', {}, 'Sync Accent from Discord')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.discordSync.description', {}, 'Automatically adopt your Discord profile theme accent color as your workspace accent.')}</p>
					</div>
					<Toggle checked={syncFromDiscord} onChange={handleToggleSync} suppressHydrationWarning />
				</div>

				{/* Accent Color Picker */}
				<div
					className={`flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm transition-opacity ${syncFromDiscord ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.accentColor.title', {}, 'Accent Color')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.accentColor.description', {}, 'Select a custom accent color for your workspace theme.')}</p>
					</div>

					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pt-2' style={{ gap: 'var(--ui-gap)' }}>
						{PRESET_COLORS.map((color) => {
							const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
							const label = t(`auth.appearance.colors.${color.key}`, {}, color.key);

							return (
								<button
									key={color.value}
									onClick={() => handleSelectColor(color.value)}
									className={`flex items-center rounded-2xl border transition-all text-left ${
										isSelected ? 'border-(--accent) bg-(--active-accent)/20 shadow-xs' : 'border-(--border)/10 hover:border-(--border)/40'
									}`}
									style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'calc(var(--ui-gap) * 0.5)' }}>
									<div className='h-8 w-8 rounded-full shadow-inner shrink-0 border border-white/10' style={{ backgroundColor: color.value }} />
									<span className='text-xs font-medium text-(--text) truncate'>{label}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* UI Zoom Level */}
				<div className='flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm' style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.zoom.title', {}, 'UI Zoom Level')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.zoom.description', {}, 'Scale the interface zoom uniformly across the application.')}</p>
					</div>
					<div className='w-full pt-2'>
						<Slider value={uiZoom} onChange={handleUiZoomChange} min={80} max={125} step={5} unit='%' />
					</div>
				</div>

				{/* Layout Density Selector */}
				<div
					className='flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.density.title', {}, 'Layout Spacing')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.density.description', {}, 'Switch between compact, default, and spacious interface padding gaps.')}</p>
					</div>
					<div className='w-full sm:w-56'>
						<Selector value={uiGap} options={densityOptions} onChange={handleUiGapChange} />
					</div>
				</div>

				{/* Text Scale Slider */}
				<div className='flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm' style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.textScale.title', {}, 'Text Scale')}</h3>
						<p className='text-xs text-(--text-muted)'>{t('auth.appearance.textScale.description', {}, 'Configure base typography size for readability.')}</p>
					</div>
					<div className='w-full pt-2'>
						<Slider value={textScale} onChange={handleTextScaleChange} min={10} max={20} step={1} unit='px' />
					</div>
				</div>
			</div>
		</div>
	);
}
