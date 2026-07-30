/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import Script from 'next/script';
import tinycolor from 'tinycolor2';

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
	document.documentElement.style.setProperty('--hover-accent', accent.clone().darken(8).toHexString());
	document.documentElement.style.setProperty('--active-accent', accent.clone().setAlpha(0.15).toRgbString());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === 'undefined') return 'system';
		const stored = getPref('theme') as Theme | null;
		return stored === 'light' || stored === 'dark' ? stored : 'system';
	});

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		const storedAccent = getPref('accent') || DEFAULT_ACCENT;

		const accent = tinycolor(storedAccent);
		document.documentElement.style.setProperty('--accent', accent.toHexString());
		document.documentElement.style.setProperty('--hover-accent', accent.clone().darken(8).toHexString());
		document.documentElement.style.setProperty('--active-accent', accent.clone().setAlpha(0.15).toRgbString());

		setResolvedTheme(theme === 'system' ? getSystemTheme() : theme);
	}, []);

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
			}}>
			<Script
				id='theme-init'
				strategy='beforeInteractive'
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
