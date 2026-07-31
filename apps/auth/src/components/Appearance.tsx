/** @format */
'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useTheme, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

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
	const { setTheme, setAccent } = useTheme();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [syncFromDiscord, setSyncFromDiscord] = useState<boolean>(() => {
		return getPref('syncFromDiscord') !== 'false';
	});
	const [selectedColor, setSelectedColor] = useState<string>('#8b7cf6');
	const [selectedTheme, setSelectedTheme] = useState<string>('system');

	useEffect(() => {
		(async () => {
			const storedSync = getPref('syncFromDiscord');
			setSyncFromDiscord(storedSync !== 'false');

			const storedAccent = getPref('accent');
			if (storedAccent) setSelectedColor(storedAccent);

			const storedTheme = getPref('theme');
			if (storedTheme) setSelectedTheme(storedTheme);
		})();
	}, []);

	const handleToggleSync = (e: React.ChangeEvent<HTMLInputElement> | boolean) => {
		const isChecked = typeof e === 'boolean' ? e : e.target.checked;
		setSyncFromDiscord(isChecked);
		setPref('syncFromDiscord', String(isChecked));

		if (isChecked) {
			window.location.reload();
		}
	};

	const handleSelectColor = (hex: string) => {
		setSelectedColor(hex);
		setAccent(hex);
		setPref('accent', hex);
		toast({ type: 'success', title: 'Updated accent color!', description: `Set accent color to ${PRESET_COLORS.find((c) => c.value == hex)?.key}` });
	};

	const handleThemeChange = (themeMode: string) => {
		setSelectedTheme(themeMode);
		setTheme(themeMode as 'system' | 'dark' | 'light');
		setPref('theme', themeMode);
		toast({ type: 'success', title: 'Updated theme!', description: `Set theme to ${themeMode}` });
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

	return (
		<div className='flex flex-col gap-8 max-w-4xl mx-auto p-6 md:p-12 w-full'>
			<div>
				<h1 className='text-3xl font-black tracking-tight text-(--text)'>{t('auth.appearance.title')}</h1>
				<p className='text-sm text-(--text-muted) mt-1'>{t('auth.appearance.description')}</p>
			</div>

			{/* Theme Selector Card */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
				<div className='flex flex-col max-w-xl'>
					<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.theme.title', {}, 'Theme')}</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>{t('auth.appearance.theme.description', {}, 'Choose your preferred interface theme mode.')}</p>
				</div>
				<div className='w-full sm:w-56'>
					<Selector value={selectedTheme} options={themeOptions} onChange={handleThemeChange} />
				</div>
			</div>

			{/* Sync Accent with Discord */}
			<div className='flex items-center justify-between gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
				<div className='flex flex-col max-w-xl'>
					<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.discordSync.title')}</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>{t('auth.appearance.discordSync.description')}</p>
				</div>
				<Toggle checked={syncFromDiscord} onChange={handleToggleSync} suppressHydrationWarning />
			</div>

			{/* Accent Color Picker */}
			<div
				className={`flex flex-col gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm transition-opacity ${syncFromDiscord ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
				<div className='flex flex-col'>
					<h3 className='text-base font-semibold text-(--text)'>{t('auth.appearance.accentColor.title')}</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>{t('auth.appearance.accentColor.description')}</p>
				</div>

				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2'>
					{PRESET_COLORS.map((color) => {
						const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
						const label = t(`auth.appearance.colors.${color.key}`, {}, color.key);

						return (
							<button
								key={color.value}
								onClick={() => handleSelectColor(color.value)}
								className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
									isSelected ? 'border-(--accent) bg-(--active-accent)/20 shadow-xs' : 'border-(--border)/10 hover:border-(--border)/40'
								}`}>
								<div className='h-8 w-8 rounded-full shadow-inner shrink-0 border border-white/10' style={{ backgroundColor: color.value }} />
								<span className='text-xs font-medium text-(--text) truncate'>{label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
