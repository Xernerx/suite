/** @format */
'use client';

import { useEffect, useState } from 'react';

import { Toggle } from '@xernerx/ui';
import { useTheme } from '@xernerx/providers';

const PRESET_COLORS = [
	{ label: 'Xernerx Purple', value: '#8b7cf6' },
	{ label: 'Crea Green', value: '#a4b795' },
	{ label: 'Cyber Neon', value: '#39ff14' },
	{ label: 'Electric Blue', value: '#3b82f6' },
	{ label: 'Vibrant Pink', value: '#ec4899' },
	{ label: 'Sunset Orange', value: '#f97316' },
	{ label: 'Golden Yellow', value: '#eab308' },
	{ label: 'Deep Crimson', value: '#ef4444' },
	{ label: 'Mint Breeze', value: '#2dd4bf' },
	{ label: 'Royal Indigo', value: '#6366f1' },
	{ label: 'Acid Lime', value: '#acc813' },
	{ label: 'Void Charcoal', value: '#27272a' },
];

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
		// 1. Destroy any old host-specific cookies that might shadow our domain cookie
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

		// 2. Set the global domain-wide cookie
		document.cookie = `${key}=${value}; domain=.xernerx.com; path=/; max-age=31536000; SameSite=Lax`;
	} catch {}
	try {
		localStorage.setItem(key, value);
	} catch {}
}

export default function Appearance() {
	const { setAccent } = useTheme();

	// Default to true unless explicitly turned off
	const [syncFromDiscord, setSyncFromDiscord] = useState<boolean>(() => {
		return getPref('syncFromDiscord') !== 'false';
	});
	const [selectedColor, setSelectedColor] = useState<string>('#8b7cf6');

	useEffect(() => {
		(async () => {
			const storedSync = getPref('syncFromDiscord');
			setSyncFromDiscord(storedSync !== 'false');

			const storedAccent = getPref('accent');
			if (storedAccent) {
				setSelectedColor(storedAccent);
			}
		})();
	}, []);

	// Accepts either an Event or a direct boolean depending on how Toggle is built
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
	};

	return (
		<div className='flex flex-col gap-8 max-w-4xl mx-auto p-6 md:p-12 w-full'>
			<div>
				<h1 className='text-3xl font-black tracking-tight text-(--text)'>Appearance</h1>
				<p className='text-sm text-(--text-muted) mt-1'>Customize how the interface looks and feels across your workspace.</p>
			</div>

			<div className='flex items-center justify-between gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
				<div className='flex flex-col max-w-xl'>
					<h3 className='text-base font-semibold text-(--text)'>Sync Accent with Discord</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>Automatically adopt your Discord profile theme accent color as your workspace accent.</p>
				</div>
				<Toggle checked={syncFromDiscord} onChange={handleToggleSync} suppressHydrationWarning />
			</div>

			<div
				className={`flex flex-col gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm transition-opacity ${syncFromDiscord ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
				<div className='flex flex-col'>
					<h3 className='text-base font-semibold text-(--text)'>Accent Color</h3>
					<p className='text-xs text-(--text-muted) mt-0.5'>Select a custom accent color for your workspace theme.</p>
				</div>

				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2'>
					{PRESET_COLORS.map((color) => {
						const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
						return (
							<button
								key={color.value}
								onClick={() => handleSelectColor(color.value)}
								className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
									isSelected ? 'border-(--accent) bg-(--active-accent)/20 shadow-xs' : 'border-(--border)/10 hover:border-(--border)/40'
								}`}>
								<div className='h-8 w-8 rounded-full shadow-inner shrink-0 border border-white/10' style={{ backgroundColor: color.value }} />
								<span className='text-xs font-medium text-(--text) truncate'>{color.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
