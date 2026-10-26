/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';
import { useEnvironment } from '@xernerx/providers';
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark' | 'system';

export type LayoutAlignment = 'system' | 'left' | 'right';
export type DotMatrixStage = 'default' | 'ripple' | 'orbit' | 'blank';
export type DotMatrixType = 'default' | 'full' | 'icon' | 'orbit' | 'vortex' | 'helix' | 'prism' | 'infinity' | 'wavegrid' | 'blank';
export type DotMatrixAnimation = 'animate' | 'static' | 'always';
export type HeaderSubdomainId = 'app' | 'portal' | 'store' | 'account' | 'info' | 'docs' | 'cdn' | 'api' | 'www' | 'admin' | 'hosting';

const VALID_MATRIX_TYPES: readonly DotMatrixType[] = ['default', 'full', 'icon', 'orbit', 'vortex', 'helix', 'prism', 'infinity', 'wavegrid', 'blank'];
const VALID_MATRIX_ANIMS: readonly DotMatrixAnimation[] = ['animate', 'static', 'always'];
export const VALID_HEADER_SUBDOMAINS: readonly HeaderSubdomainId[] = ['app', 'portal', 'store', 'account', 'info', 'docs', 'cdn', 'api', 'www', 'admin', 'hosting'];
export const DEFAULT_HEADER_SUBDOMAINS: HeaderSubdomainId[] = ['portal', 'store'];

export function parseHeaderSubdomains(raw: unknown): HeaderSubdomainId[] | null {
	if (Array.isArray(raw)) {
		return raw.filter((v): v is HeaderSubdomainId => typeof v === 'string' && (VALID_HEADER_SUBDOMAINS as readonly string[]).includes(v));
	}
	if (typeof raw === 'string') {
		if (raw === 'none') return [];
		const parts = raw
			.split(',')
			.map((s) => s.trim())
			.filter((v): v is HeaderSubdomainId => (VALID_HEADER_SUBDOMAINS as readonly string[]).includes(v));
		if (parts.length > 0) return parts;
	}
	return null;
}

export interface UIPreferences {
	headerSubdomains: HeaderSubdomainId[];
	showHeaderStore: boolean;
	showHeaderPortal: boolean;
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
	dotMatrixStage?: DotMatrixStage;
	dotMatrixType?: DotMatrixType;
	dotMatrixAnimation?: DotMatrixAnimation;
}

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
	headerSubdomains: [...DEFAULT_HEADER_SUBDOMAINS],
	showHeaderStore: true,
	showHeaderPortal: true,
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
	dotMatrixStage: 'default',
	dotMatrixType: 'default',
	dotMatrixAnimation: 'animate',
};

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
	setAccent: (color?: string | number | null) => void;
	preferences: UIPreferences;
	uiPreferences: UIPreferences;
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
	const result: UIPreferences = { ...DEFAULT_UI_PREFERENCES, headerSubdomains: [...DEFAULT_HEADER_SUBDOMAINS] };
	let hasExplicitSubdomains = false;
	(Object.keys(DEFAULT_UI_PREFERENCES) as Array<keyof UIPreferences>).forEach((key) => {
		const raw = getPref(`pref_${key}`);
		if (key === 'headerSubdomains') {
			const parsed = parseHeaderSubdomains(raw);
			if (parsed !== null) {
				result.headerSubdomains = parsed;
				hasExplicitSubdomains = true;
			}
		} else if (key === 'alignment') {
			if (raw === 'system' || raw === 'left' || raw === 'right') {
				result.alignment = raw;
			}
		} else if (key === 'dotMatrixStage') {
			if (raw === 'default' || raw === 'ripple' || raw === 'orbit' || raw === 'blank') {
				result.dotMatrixStage = raw;
			}
		} else if (key === 'dotMatrixType') {
			if (raw && (VALID_MATRIX_TYPES as readonly string[]).includes(raw)) {
				result.dotMatrixType = raw as DotMatrixType;
			}
		} else if (key === 'dotMatrixAnimation') {
			if (raw && (VALID_MATRIX_ANIMS as readonly string[]).includes(raw)) {
				result.dotMatrixAnimation = raw as DotMatrixAnimation;
			}
		} else if (raw === 'true') {
			(result as any)[key] = true;
		} else if (raw === 'false') {
			(result as any)[key] = false;
		}
	});
	if (!hasExplicitSubdomains) {
		result.headerSubdomains = [...(result.showHeaderPortal !== false ? (['portal'] as HeaderSubdomainId[]) : []), ...(result.showHeaderStore !== false ? (['store'] as HeaderSubdomainId[]) : [])];
	} else {
		result.showHeaderStore = result.headerSubdomains.includes('store');
		result.showHeaderPortal = result.headerSubdomains.includes('portal');
	}
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
	const resolved = theme === 'system' ? getSystemTheme() : theme;
	root.classList.toggle('dark', resolved === 'dark');
	root.style.colorScheme = resolved;
	root.dataset.theme = resolved;
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

		const storedPageWidth = getPref('pageWidth');
		const pageWidthMap: Record<string, string> = {
			compact: '80rem',
			default: '96rem',
			wide: '112rem',
			full: '100%',
		};
		if (storedPageWidth && pageWidthMap[storedPageWidth]) {
			setThemeVar('--page-width', pageWidthMap[storedPageWidth]);
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
					if (appPrefs.pageWidth) setPref('pageWidth', String(appPrefs.pageWidth));
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
					if (appPrefs.pageWidth && pageWidthMap[appPrefs.pageWidth]) {
						setThemeVar('--page-width', pageWidthMap[appPrefs.pageWidth]);
					}
					if (appPrefs.textScale) setThemeVar('--text-scale', `${appPrefs.textScale}px`);
				}

				if (appPrefs?.uiPreferences && typeof appPrefs.uiPreferences === 'object') {
					const mergedPrefs: UIPreferences = { ...DEFAULT_UI_PREFERENCES, headerSubdomains: [...DEFAULT_HEADER_SUBDOMAINS] };
					let hasRemoteSubdomains = false;
					(Object.keys(DEFAULT_UI_PREFERENCES) as Array<keyof UIPreferences>).forEach((k) => {
						if (k === 'headerSubdomains') {
							const remoteSubs = parseHeaderSubdomains(appPrefs.uiPreferences[k]);
							if (remoteSubs !== null) {
								mergedPrefs.headerSubdomains = remoteSubs;
								setPref(`pref_${k}`, remoteSubs.length > 0 ? remoteSubs.join(',') : 'none');
								hasRemoteSubdomains = true;
							} else {
								const localSubs = parseHeaderSubdomains(getPref(`pref_${k}`));
								if (localSubs !== null) {
									mergedPrefs.headerSubdomains = localSubs;
									hasRemoteSubdomains = true;
								}
							}
						} else if (k === 'alignment') {
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
						} else if (k === 'dotMatrixStage') {
							const remoteStage = appPrefs.uiPreferences[k];
							if (remoteStage === 'default' || remoteStage === 'ripple' || remoteStage === 'orbit' || remoteStage === 'blank') {
								mergedPrefs.dotMatrixStage = remoteStage;
								setPref(`pref_${k}`, remoteStage);
							} else {
								const localStage = getPref(`pref_${k}`);
								if (localStage === 'default' || localStage === 'ripple' || localStage === 'orbit' || localStage === 'blank') {
									mergedPrefs.dotMatrixStage = localStage;
								}
							}
						} else if (k === 'dotMatrixType') {
							const remoteType = appPrefs.uiPreferences[k];
							if (remoteType && (VALID_MATRIX_TYPES as readonly string[]).includes(remoteType)) {
								mergedPrefs.dotMatrixType = remoteType as DotMatrixType;
								setPref(`pref_${k}`, remoteType);
							} else {
								const localType = getPref(`pref_${k}`);
								if (localType && (VALID_MATRIX_TYPES as readonly string[]).includes(localType)) {
									mergedPrefs.dotMatrixType = localType as DotMatrixType;
								}
							}
						} else if (k === 'dotMatrixAnimation') {
							const remoteAnim = appPrefs.uiPreferences[k];
							if (remoteAnim && (VALID_MATRIX_ANIMS as readonly string[]).includes(remoteAnim)) {
								mergedPrefs.dotMatrixAnimation = remoteAnim as DotMatrixAnimation;
								setPref(`pref_${k}`, remoteAnim);
							} else {
								const localAnim = getPref(`pref_${k}`);
								if (localAnim && (VALID_MATRIX_ANIMS as readonly string[]).includes(localAnim)) {
									mergedPrefs.dotMatrixAnimation = localAnim as DotMatrixAnimation;
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
					if (!hasRemoteSubdomains) {
						mergedPrefs.headerSubdomains = [
							...(mergedPrefs.showHeaderPortal !== false ? (['portal'] as HeaderSubdomainId[]) : []),
							...(mergedPrefs.showHeaderStore !== false ? (['store'] as HeaderSubdomainId[]) : []),
						];
					} else {
						mergedPrefs.showHeaderStore = mergedPrefs.headerSubdomains.includes('store');
						mergedPrefs.showHeaderPortal = mergedPrefs.headerSubdomains.includes('portal');
					}
					setPreferencesState(mergedPrefs);
					if (typeof document !== 'undefined') {
						document.documentElement.classList.toggle('reduce-motion', mergedPrefs.reducedMotion);
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
			if (key === 'headerSubdomains' && Array.isArray(value)) {
				const subs = (value as HeaderSubdomainId[]).filter((v) => (VALID_HEADER_SUBDOMAINS as readonly string[]).includes(v));
				setPref('pref_headerSubdomains', subs.length > 0 ? subs.join(',') : 'none');
				setPref('pref_showHeaderStore', String(subs.includes('store')));
				setPref('pref_showHeaderPortal', String(subs.includes('portal')));
				setPreferencesState((prev) => {
					const next: UIPreferences = {
						...prev,
						headerSubdomains: subs,
						showHeaderStore: subs.includes('store'),
						showHeaderPortal: subs.includes('portal'),
					};
					syncPreferencesToRemote(next);
					return next;
				});
				return;
			}
			setPref(`pref_${key}`, String(value));
			setPreferencesState((prev) => {
				const next = { ...prev, [key]: value };
				if (key === 'showHeaderStore' || key === 'showHeaderPortal') {
					const targetSub: HeaderSubdomainId = key === 'showHeaderStore' ? 'store' : 'portal';
					const currentSubs = Array.isArray(prev.headerSubdomains) ? prev.headerSubdomains : [...DEFAULT_HEADER_SUBDOMAINS];
					const nextSubs = value ? Array.from(new Set([...currentSubs, targetSub])) : currentSubs.filter((s) => s !== targetSub);
					next.headerSubdomains = nextSubs;
					setPref('pref_headerSubdomains', nextSubs.length > 0 ? nextSubs.join(',') : 'none');
				}
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
			const val = DEFAULT_UI_PREFERENCES[k];
			if (k === 'headerSubdomains' && Array.isArray(val)) {
				setPref(`pref_${k}`, val.join(','));
			} else {
				setPref(`pref_${k}`, String(val));
			}
		});
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('reduce-motion');
		}
		setPreferencesState({ ...DEFAULT_UI_PREFERENCES, headerSubdomains: [...DEFAULT_HEADER_SUBDOMAINS] });
		syncPreferencesToRemote({ ...DEFAULT_UI_PREFERENCES, headerSubdomains: [...DEFAULT_HEADER_SUBDOMAINS] });
	}, [syncPreferencesToRemote]);

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			if (theme !== 'system') return;
			const resolved = getSystemTheme();
			setResolvedTheme(resolved);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
			document.documentElement.style.colorScheme = resolved;
			document.documentElement.dataset.theme = resolved;
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
				uiPreferences: preferences,
				setPreference,
				resetPreferences,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

const FALLBACK_THEME_CONTEXT: ThemeContextType = {
	theme: 'dark',
	resolvedTheme: 'dark',
	setTheme: () => {},
	setAccent: () => {},
	preferences: DEFAULT_UI_PREFERENCES,
	uiPreferences: DEFAULT_UI_PREFERENCES,
	setPreference: () => {},
	resetPreferences: () => {},
};

export function useTheme(): ThemeContextType {
	const ctx = useContext(ThemeContext);
	return ctx ?? FALLBACK_THEME_CONTEXT;
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
			if (detail?.windowControls) setWindowControls(detail.windowControls);
		};
		const unsubscribe = electronBridge?.onMetadataUpdated?.((meta: any) => {
			if (meta?.windowControls) setWindowControls(meta.windowControls);
		});
		window.addEventListener('xernerx:metadata-updated', handleMetaUpdate);
		return () => {
			window.removeEventListener('xernerx:metadata-updated', handleMetaUpdate);
			unsubscribe?.();
		};
	}, []);

	const prefAlignment = ctx?.preferences?.alignment || 'system';
	const effectiveControls = windowControls === 'system' ? (isMacPlatform ? 'macos' : 'windows') : windowControls;
	const effectiveAlignment: 'left' | 'right' = prefAlignment === 'right' ? 'right' : prefAlignment === 'left' ? 'left' : effectiveControls === 'macos' || isMacPlatform ? 'right' : 'left';
	return { effectiveAlignment, isRightAligned: effectiveAlignment === 'right' };
}
