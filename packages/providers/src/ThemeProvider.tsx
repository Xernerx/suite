/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';
import { useEnvironment } from '@xernerx/providers';
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark' | 'system';

export type LayoutAlignment = 'system' | 'left' | 'right';

export interface UIPreferences {
	showHeaderStore: boolean;
	showHeaderCommandPalette: boolean;
	showHeaderNotifications: boolean;
	showHeaderDownload: boolean;
	showHeaderAppDrawer: boolean;
	showShortcutHints: boolean;
	showDiscordCollectibles: boolean;
	showGiftBadge: boolean;
	reducedMotion: boolean;
	defaultSidebarCollapsed: boolean;
	developerMode: boolean;
	alignment: LayoutAlignment;
}

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
	showHeaderStore: true,
	showHeaderCommandPalette: true,
	showHeaderNotifications: true,
	showHeaderDownload: true,
	showHeaderAppDrawer: true,
	showShortcutHints: true,
	showDiscordCollectibles: true,
	showGiftBadge: true,
	reducedMotion: false,
	defaultSidebarCollapsed: false,
	developerMode: false,
	alignment: 'system',
};

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
	setAccent: (color?: string | number | null) => void;
	preferences: UIPreferences;
	setPreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
	resetPreferences: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_ACCENT = '#8b7cf6';

/* ---------- STORAGE HELPERS ---------- */

function setThemeVar(name: string, value: string) {
	if (typeof document === 'undefined') return;
	document.documentElement.style.setProperty(name, value);
	if (document.body) {
		document.body.style.setProperty(name, value);
	}
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

function loadStoredUIPreferences(): UIPreferences {
	if (typeof window === 'undefined') return DEFAULT_UI_PREFERENCES;
	const result = { ...DEFAULT_UI_PREFERENCES };
	(Object.keys(DEFAULT_UI_PREFERENCES) as Array<keyof UIPreferences>).forEach((key) => {
		const raw = getPref(`pref_${key}`);
		if (key === 'alignment') {
			if (raw === 'system' || raw === 'left' || raw === 'right') {
				result.alignment = raw;
			}
		} else if (raw === 'true') {
			(result as any)[key] = true;
		} else if (raw === 'false') {
			(result as any)[key] = false;
		}
	});
	return result;
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
	setThemeVar('--accent', accent.toHexString());
	setThemeVar('--accent-hover', accent.clone().darken(8).toHexString());
	setThemeVar('--accent-active', accent.clone().setAlpha(0.15).toRgbString());
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
	const [preferences, setPreferencesState] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES);

	useEffect(() => {
		const loaded = loadStoredUIPreferences();
		setPreferencesState(loaded);
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('reduce-motion', loaded.reducedMotion);
		}
	}, []);

	useEffect(() => {
		if (!isReady) return;
		const storedAccent = getPref('accent') || DEFAULT_ACCENT;

		const accent = tinycolor(storedAccent);
		setThemeVar('--accent', accent.toHexString());
		setThemeVar('--accent-hover', accent.clone().darken(8).toHexString());
		setThemeVar('--accent-active', accent.clone().setAlpha(0.15).toRgbString());

		const storedZoom = getPref('uiZoom');
		if (storedZoom) {
			const parsedZoom = parseInt(storedZoom, 10);
			if (!isNaN(parsedZoom)) {
				setThemeVar('--ui-zoom', String(parsedZoom / 100));
				setThemeVar('--ui-scale', String(parsedZoom));
			}
		}

		const storedGap = getPref('uiGap');
		if (storedGap) {
			setThemeVar('--ui-gap', `${storedGap}px`);
		}

		const storedTextScale = getPref('textScale');
		if (storedTextScale) {
			setThemeVar('--text-scale', `${storedTextScale}px`);
		}

		setResolvedTheme(theme === 'system' ? getSystemTheme() : theme);

		if (!session?.user || !(session.user as any).id) return;

		const fetchRemoteSync = async () => {
			try {
				const userId = (session.user as any).id;
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
					credentials: 'include',
				});
				if (!res.ok) return;

				const data = await res.json();
				const appPrefs = data?.appearance || data?.settings?.appearance;

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

					if (appPrefs.uiZoom) {
						setThemeVar('--ui-zoom', String(appPrefs.uiZoom / 100));
						setThemeVar('--ui-scale', String(appPrefs.uiZoom));
					}
					if (appPrefs.uiGap) setThemeVar('--ui-gap', `${appPrefs.uiGap}px`);
					if (appPrefs.textScale) setThemeVar('--text-scale', `${appPrefs.textScale}px`);

					if (appPrefs.uiPreferences && typeof appPrefs.uiPreferences === 'object') {
						const mergedPrefs: UIPreferences = { ...DEFAULT_UI_PREFERENCES };
						(Object.keys(DEFAULT_UI_PREFERENCES) as Array<keyof UIPreferences>).forEach((k) => {
							if (k === 'alignment') {
								const remoteAlign = appPrefs.uiPreferences[k];
								if (remoteAlign === 'system' || remoteAlign === 'left' || remoteAlign === 'right') {
									mergedPrefs.alignment = remoteAlign;
									setPref(`pref_${k}`, remoteAlign);
								} else {
									const localAlign = getPref(`pref_${k}`);
									if (localAlign === 'system' || localAlign === 'left' || localAlign === 'right') {
										mergedPrefs.alignment = localAlign;
									}
								}
							} else if (typeof appPrefs.uiPreferences[k] === 'boolean') {
								(mergedPrefs as any)[k] = appPrefs.uiPreferences[k];
								setPref(`pref_${k}`, String(appPrefs.uiPreferences[k]));
							} else {
								const localVal = getPref(`pref_${k}`);
								if (localVal === 'true' || localVal === 'false') (mergedPrefs as any)[k] = localVal === 'true';
							}
						});
						setPreferencesState(mergedPrefs);
						if (typeof document !== 'undefined') {
							document.documentElement.classList.toggle('reduce-motion', mergedPrefs.reducedMotion);
						}
					}
				}
			} catch (e) {
				console.warn('Failed to sync appearance from server', e);
			}
		};

		fetchRemoteSync();
	}, [getEnvUrl, session, isReady]);

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

	const syncPreferencesToRemote = useCallback(
		async (nextPrefs: UIPreferences) => {
			if (!session?.user || !(session.user as any).id) return;
			try {
				const userId = (session.user as any).id;
				await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						appearance: {
							uiPreferences: nextPrefs,
						},
					}),
				});
			} catch {}
		},
		[getEnvUrl, session]
	);

	const setPreference = useCallback(
		<K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
			setPref(`pref_${key}`, String(value));
			setPreferencesState((prev) => {
				const next = { ...prev, [key]: value };
				if (key === 'reducedMotion' && typeof document !== 'undefined') {
					document.documentElement.classList.toggle('reduce-motion', Boolean(value));
				}
				syncPreferencesToRemote(next);
				return next;
			});
		},
		[syncPreferencesToRemote]
	);

	const resetPreferences = useCallback(() => {
		(Object.keys(DEFAULT_UI_PREFERENCES) as Array<keyof UIPreferences>).forEach((k) => {
			setPref(`pref_${k}`, String(DEFAULT_UI_PREFERENCES[k]));
		});
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('reduce-motion');
		}
		setPreferencesState(DEFAULT_UI_PREFERENCES);
		syncPreferencesToRemote(DEFAULT_UI_PREFERENCES);
	}, [syncPreferencesToRemote]);

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
				preferences,
				setPreference,
				resetPreferences,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
	return ctx;
}

export function useEffectiveAlignment(): {
	effectiveAlignment: 'left' | 'right';
	isRightAligned: boolean;
} {
	const ctx = useContext(ThemeContext);
	const [windowControls, setWindowControls] = useState<'system' | 'windows' | 'macos' | 'xernerx'>('system');
	const [isMacPlatform, setIsMacPlatform] = useState(false);

	useEffect(() => {
		if (typeof navigator !== 'undefined') {
			const ua = navigator.userAgent.toLowerCase();
			const isMac = ua.includes('mac') && !(navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
			setIsMacPlatform(isMac);
		}

		const electronBridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (electronBridge?.metadata?.windowControls) {
			setWindowControls(electronBridge.metadata.windowControls);
		}
		electronBridge?.getMetadata?.()?.then?.((meta: any) => {
			if (meta?.windowControls) setWindowControls(meta.windowControls);
		});

		const handleMetaUpdate = (e: Event) => {
			const detail = (e as CustomEvent)?.detail;
			if (detail?.windowControls) {
				setWindowControls(detail.windowControls);
			}
		};
		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
	}, []);

	const prefAlignment = ctx?.preferences?.alignment || 'system';
	const effectiveControls = windowControls === 'system' ? (isMacPlatform ? 'macos' : 'windows') : windowControls;
	const effectiveAlignment: 'left' | 'right' = prefAlignment === 'right' ? 'right' : prefAlignment === 'left' ? 'left' : effectiveControls === 'macos' || isMacPlatform ? 'right' : 'left';

	return {
		effectiveAlignment,
		isRightAligned: effectiveAlignment === 'right',
	};
}
