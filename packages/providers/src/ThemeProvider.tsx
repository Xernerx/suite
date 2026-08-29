/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import tinycolor from 'tinycolor2';
import { useEnvironment } from '@xernerx/providers'; // Imported useEnvironment for API routing
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
	setAccent: (color?: string | number | null) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_ACCENT = '#8b7cf6';

/* ---------- STORAGE HELPERS ---------- */

function setPref(key: string, value: string) {
	if (typeof window === 'undefined') return;

	try {
		// Clear shadow cookies
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		document.cookie = `${key}=${value}; domain=.xernerx.com; path=/; max-age=31536000; SameSite=Lax`;
	} catch (e) {}

	try {
		localStorage.setItem(key, value);
	} catch (e) {}
}

function getPref(key: string): string | null {
	if (typeof window === 'undefined') return null;

	try {
		const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
		if (match) return match[2];
	} catch (e) {}

	try {
		return localStorage.getItem(key);
	} catch (e) {}

	return null;
}

/* ---------- THEME LOGIC ---------- */

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
	if (typeof window === 'undefined') return;
	const root = document.documentElement;

	if (theme === 'dark') {
		root.classList.add('dark');
		return;
	}

	if (theme === 'light') {
		root.classList.remove('dark');
		return;
	}

	const prefersDark = getSystemTheme();
	root.classList.toggle('dark', prefersDark === 'dark');
}

function applyAccent(color?: string | number | null) {
	if (typeof window === 'undefined') return;

	let colorStr = DEFAULT_ACCENT;

	if (color !== null && color !== undefined) {
		if (typeof color === 'number' || (typeof color === 'string' && /^\d+$/.test(color))) {
			const num = typeof color === 'string' ? parseInt(color, 10) : color;
			colorStr = '#' + num.toString(16).padStart(6, '0');
		} else if (typeof color === 'string') {
			colorStr = color;
		}
	}

	setPref('accent', colorStr);

	const accent = tinycolor(colorStr);
	document.documentElement.style.setProperty('--accent', accent.toHexString());
	document.documentElement.style.setProperty('--accent-hover', accent.clone().darken(8).toHexString());
	document.documentElement.style.setProperty('--accent-active', accent.clone().setAlpha(0.15).toRgbString());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();

	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === 'undefined') return 'system';
		const stored = getPref('theme') as Theme | null;
		return stored === 'light' || stored === 'dark' ? stored : 'system';
	});

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

	// -----------------------------------------------------------------------------
	// Initial Load & Client Sync Request
	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------
	useEffect(() => {
		if (!isReady) return;
		const storedAccent = getPref('accent') || DEFAULT_ACCENT;

		const accent = tinycolor(storedAccent);
		document.documentElement.style.setProperty('--accent', accent.toHexString());
		document.documentElement.style.setProperty('--accent-hover', accent.clone().darken(8).toHexString());
		document.documentElement.style.setProperty('--accent-active', accent.clone().setAlpha(0.15).toRgbString());

		setResolvedTheme(theme === 'system' ? getSystemTheme() : theme);

		// We can only fetch user preferences if we have a valid session ID
		if (!session?.user || !(session.user as any).id) return;

		const fetchRemoteSync = async () => {
			try {
				const userId = (session.user as any).id;
				const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
					credentials: 'include',
				});
				if (!res.ok) return;

				const data = await res.json();
				const appPrefs = data?.settings?.appearance;

				if (appPrefs && appPrefs.clientSync) {
					setPref('clientSync', 'true');
					if (appPrefs.theme) setPref('theme', appPrefs.theme);
					if (appPrefs.accent) setPref('accent', appPrefs.accent);
					if (appPrefs.uiZoom) setPref('uiZoom', String(appPrefs.uiZoom));
					if (appPrefs.uiGap) setPref('uiGap', String(appPrefs.uiGap));
					if (appPrefs.textScale) setPref('textScale', String(appPrefs.textScale));
					if (appPrefs.syncFromDiscord !== undefined) setPref('syncFromDiscord', String(appPrefs.syncFromDiscord));

					if (appPrefs.theme) {
						setThemeState(appPrefs.theme);
						applyTheme(appPrefs.theme);
					}
					if (appPrefs.accent) applyAccent(appPrefs.accent);

					if (appPrefs.uiZoom) document.documentElement.style.setProperty('--ui-zoom', String(appPrefs.uiZoom / 100));
					if (appPrefs.uiGap) document.documentElement.style.setProperty('--ui-gap', `${appPrefs.uiGap}px`);
					if (appPrefs.textScale) document.documentElement.style.setProperty('--text-scale', `${appPrefs.textScale}px`);
				}
			} catch (e) {
				console.warn('Failed to sync appearance from server', e);
			}
		};

		fetchRemoteSync();
	}, [getEnvUrl, session]);

	useEffect(() => {
		const resolved = theme === 'system' ? getSystemTheme() : theme;
		setResolvedTheme(resolved);
		applyTheme(theme);
	}, [theme]);

	function updateTheme(next: Theme) {
		if (theme !== next) {
			setPref('theme', next);
			setThemeState(next);
		}
	}

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			if (theme !== 'system') return;
			const resolved = getSystemTheme();
			setResolvedTheme(resolved);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
		};

		media.addEventListener('change', handler);
		return () => media.removeEventListener('change', handler);
	}, [theme]);

	return (
		<ThemeContext.Provider
			value={{
				theme,
				resolvedTheme,
				setTheme: updateTheme,
				setAccent: applyAccent,
			}}
		>
			<script
				id="theme-init"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: `
                        (function() {
                            try {
                                function getPref(key) {
                                    var match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
                                    if (match) return match[2];
                                    return localStorage.getItem(key);
                                }

                                var theme = getPref('theme') || 'system';
                                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                    document.documentElement.classList.add('dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                }

                                var accent = getPref('accent');
                                if (accent) {
                                    document.documentElement.style.setProperty('--accent', accent);
                                }
                            } catch (e) {}
                        })();
                    `,
				}}
			/>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
	return ctx;
}
