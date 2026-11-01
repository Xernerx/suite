/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';
import { useEnvironment } from '@xernerx/providers';
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark' | 'system';

export type LayoutAlignment = 'system' | 'left' | 'right';
export type DotMatrixStage = 'default' | 'ripple' | 'orbit' | 'blank';
export type DotMatrixType = 'default' | 'full' | 'icon' | 'orbit' | 'vortex' | 'helix' | 'prism' | 'infinity' | 'wavegrid' | 'chronos' | 'supernova' | 'tesseract' | 'synthwave' | 'lotus' | 'blank';
export type DotMatrixRenderStyle = 'dots' | 'constellation' | 'hexgrid' | 'aurora' | 'glyphs';
export type DotMatrixAnimation = 'animate' | 'static' | 'always';
export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx' | 'capsule' | 'squircle' | 'minimal';
export type UIIconStyle = 'standard' | 'duotone' | 'bold' | 'precision';
export type AmbientSceneType = 'default' | 'mesh_lava' | 'cyber_grid' | 'topography' | 'nebula_cosmos' | 'prism_caustics';
export type SurfaceStyleType = 'default' | 'crystal' | 'holographic' | 'neon' | 'obsidian';
export type CursorFxType = 'default' | 'starlight_trail' | 'plasma_sparks' | 'cyber_reticle' | 'sonic_rings' | 'aurora_ribbon';
export type OverlaySkinType = 'default' | 'hud_tactical' | 'frosted_prism' | 'neon_arcade' | 'minimal_pill';
export type HeaderSubdomainId = 'app' | 'portal' | 'store' | 'account' | 'info' | 'docs' | 'cdn' | 'haste' | 'api' | 'www' | 'admin' | 'hosting';

const VALID_MATRIX_TYPES: readonly DotMatrixType[] = [
	'default',
	'full',
	'icon',
	'orbit',
	'vortex',
	'helix',
	'prism',
	'infinity',
	'wavegrid',
	'chronos',
	'supernova',
	'tesseract',
	'synthwave',
	'lotus',
	'blank',
];
const VALID_RENDER_STYLES: readonly DotMatrixRenderStyle[] = ['dots', 'constellation', 'hexgrid', 'aurora', 'glyphs'];
const VALID_MATRIX_ANIMS: readonly DotMatrixAnimation[] = ['animate', 'static', 'always'];
const VALID_WINDOW_CONTROLS: readonly WindowControlsStyle[] = ['system', 'windows', 'macos', 'xernerx', 'capsule', 'squircle', 'minimal'];
const VALID_UI_ICON_STYLES: readonly UIIconStyle[] = ['standard', 'duotone', 'bold', 'precision'];
const VALID_AMBIENT_SCENES: readonly AmbientSceneType[] = ['default', 'mesh_lava', 'cyber_grid', 'topography', 'nebula_cosmos', 'prism_caustics'];
const VALID_SURFACE_STYLES: readonly SurfaceStyleType[] = ['default', 'crystal', 'holographic', 'neon', 'obsidian'];
const VALID_CURSOR_FX: readonly CursorFxType[] = ['default', 'starlight_trail', 'plasma_sparks', 'cyber_reticle', 'sonic_rings', 'aurora_ribbon'];
const VALID_OVERLAY_SKINS: readonly OverlaySkinType[] = ['default', 'hud_tactical', 'frosted_prism', 'neon_arcade', 'minimal_pill'];
export const VALID_HEADER_SUBDOMAINS: readonly HeaderSubdomainId[] = ['app', 'portal', 'store', 'account', 'info', 'docs', 'cdn', 'haste', 'api', 'www', 'admin', 'hosting'];
export const DEFAULT_HEADER_SUBDOMAINS: HeaderSubdomainId[] = ['portal', 'store'];

const COSMETIC_CHILD_TO_BUNDLE: Record<string, string> = {
	ambient_mesh_lava: 'ambient_scenes_pack',
	ambient_cyber_grid: 'ambient_scenes_pack',
	ambient_topography: 'ambient_scenes_pack',
	ambient_nebula_cosmos: 'ambient_scenes_pack',
	ambient_prism_caustics: 'ambient_scenes_pack',
	surface_crystal: 'surface_styles_pack',
	surface_holographic: 'surface_styles_pack',
	surface_neon: 'surface_styles_pack',
	surface_obsidian: 'surface_styles_pack',
	cursor_starlight_trail: 'cursor_fx_bundle',
	cursor_plasma_sparks: 'cursor_fx_bundle',
	cursor_cyber_reticle: 'cursor_fx_bundle',
	cursor_sonic_rings: 'cursor_fx_bundle',
	cursor_aurora_ribbon: 'cursor_fx_bundle',
	skin_hud_tactical: 'overlay_skins_bundle',
	skin_frosted_prism: 'overlay_skins_bundle',
	skin_neon_arcade: 'overlay_skins_bundle',
	skin_minimal_pill: 'overlay_skins_bundle',
};

function hasBadgeUnlock(unlocked: string[], req?: string): boolean {
	if (!req) return true;
	if (unlocked.includes(req)) return true;
	const bundle = COSMETIC_CHILD_TO_BUNDLE[req];
	return Boolean(bundle && unlocked.includes(bundle));
}

function enforceUnlockedCosmetics(prefs: UIPreferences, unlocked: string[]): UIPreferences {
	const next = { ...prefs };
	const typeMap: Partial<Record<DotMatrixType, string>> = {
		orbit: 'dot_matrix_banner',
		vortex: 'dot_matrix_banner',
		helix: 'dot_matrix_banner',
		prism: 'dot_matrix_banner',
		infinity: 'dot_matrix_banner',
		wavegrid: 'dot_matrix_banner',
		chronos: 'stage_constellation',
		supernova: 'stage_constellation',
		tesseract: 'stage_hexgrid',
		synthwave: 'stage_aurora',
		lotus: 'stage_glyphs',
	};
	const renderMap: Partial<Record<DotMatrixRenderStyle, string>> = {
		constellation: 'stage_constellation',
		hexgrid: 'stage_hexgrid',
		aurora: 'stage_aurora',
		glyphs: 'stage_glyphs',
	};
	const wcMap: Partial<Record<WindowControlsStyle, string>> = {
		capsule: 'window_styles_pack',
		squircle: 'window_styles_pack',
		minimal: 'window_styles_pack',
	};
	const iconMap: Partial<Record<UIIconStyle, string>> = {
		duotone: 'ui_icon_packs',
		bold: 'ui_icon_packs',
		precision: 'ui_icon_packs',
	};
	const sceneMap: Partial<Record<AmbientSceneType, string>> = {
		mesh_lava: 'ambient_mesh_lava',
		cyber_grid: 'ambient_cyber_grid',
		topography: 'ambient_topography',
		nebula_cosmos: 'ambient_nebula_cosmos',
		prism_caustics: 'ambient_prism_caustics',
	};
	const surfMap: Partial<Record<SurfaceStyleType, string>> = {
		crystal: 'surface_crystal',
		holographic: 'surface_holographic',
		neon: 'surface_neon',
		obsidian: 'surface_obsidian',
	};
	const fxMap: Partial<Record<CursorFxType, string>> = {
		starlight_trail: 'cursor_starlight_trail',
		plasma_sparks: 'cursor_plasma_sparks',
		cyber_reticle: 'cursor_cyber_reticle',
		sonic_rings: 'cursor_sonic_rings',
		aurora_ribbon: 'cursor_aurora_ribbon',
	};
	const skinMap: Partial<Record<OverlaySkinType, string>> = {
		hud_tactical: 'skin_hud_tactical',
		frosted_prism: 'skin_frosted_prism',
		neon_arcade: 'skin_neon_arcade',
		minimal_pill: 'skin_minimal_pill',
	};

	if (next.dotMatrixType && !hasBadgeUnlock(unlocked, typeMap[next.dotMatrixType])) {
		next.dotMatrixType = 'default';
		setPref('pref_dotMatrixType', 'default');
	}
	if (next.dotMatrixRenderStyle && !hasBadgeUnlock(unlocked, renderMap[next.dotMatrixRenderStyle])) {
		next.dotMatrixRenderStyle = 'dots';
		setPref('pref_dotMatrixRenderStyle', 'dots');
	}
	if (next.windowControls && !hasBadgeUnlock(unlocked, wcMap[next.windowControls])) {
		next.windowControls = 'system';
		setPref('pref_windowControls', 'system');
	}
	if (next.uiIconStyle && !hasBadgeUnlock(unlocked, iconMap[next.uiIconStyle])) {
		next.uiIconStyle = 'standard';
		setPref('pref_uiIconStyle', 'standard');
	}
	if (next.ambientScene && !hasBadgeUnlock(unlocked, sceneMap[next.ambientScene])) {
		next.ambientScene = 'default';
		setPref('pref_ambientScene', 'default');
	}
	if (next.surfaceStyle && !hasBadgeUnlock(unlocked, surfMap[next.surfaceStyle])) {
		next.surfaceStyle = 'default';
		setPref('pref_surfaceStyle', 'default');
	}
	if (next.cursorFx && !hasBadgeUnlock(unlocked, fxMap[next.cursorFx])) {
		next.cursorFx = 'default';
		setPref('pref_cursorFx', 'default');
	}
	if (next.overlaySkin && !hasBadgeUnlock(unlocked, skinMap[next.overlaySkin])) {
		next.overlaySkin = 'default';
		setPref('pref_overlaySkin', 'default');
	}
	return next;
}

const LEGACY_PAGE_WIDTH_PERCENT: Record<string, number> = {
	compact: 75,
	default: 90,
	wide: 95,
	full: 100,
};

export function parsePageWidthPercent(raw: unknown): number {
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return Math.min(100, Math.max(60, Math.round(raw / 5) * 5));
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim().toLowerCase();
		if (trimmed in LEGACY_PAGE_WIDTH_PERCENT) {
			return LEGACY_PAGE_WIDTH_PERCENT[trimmed];
		}
		const num = parseInt(trimmed.replace('%', ''), 10);
		if (!isNaN(num)) {
			return Math.min(100, Math.max(60, Math.round(num / 5) * 5));
		}
	}
	return 90;
}

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
	dotMatrixRenderStyle?: DotMatrixRenderStyle;
	dotMatrixAnimation?: DotMatrixAnimation;
	windowControls?: WindowControlsStyle;
	uiIconStyle?: UIIconStyle;
	ambientScene?: AmbientSceneType;
	surfaceStyle?: SurfaceStyleType;
	cursorFx?: CursorFxType;
	overlaySkin?: OverlaySkinType;
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
	dotMatrixRenderStyle: 'dots',
	dotMatrixAnimation: 'animate',
	windowControls: 'system',
	uiIconStyle: 'standard',
	ambientScene: 'default',
	surfaceStyle: 'default',
	cursorFx: 'default',
	overlaySkin: 'default',
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
		} else if (key === 'dotMatrixRenderStyle') {
			if (raw && (VALID_RENDER_STYLES as readonly string[]).includes(raw)) {
				result.dotMatrixRenderStyle = raw as DotMatrixRenderStyle;
			}
		} else if (key === 'dotMatrixAnimation') {
			if (raw && (VALID_MATRIX_ANIMS as readonly string[]).includes(raw)) {
				result.dotMatrixAnimation = raw as DotMatrixAnimation;
			}
		} else if (key === 'windowControls') {
			if (raw && (VALID_WINDOW_CONTROLS as readonly string[]).includes(raw)) {
				result.windowControls = raw as WindowControlsStyle;
			}
		} else if (key === 'uiIconStyle') {
			if (raw && (VALID_UI_ICON_STYLES as readonly string[]).includes(raw)) {
				result.uiIconStyle = raw as UIIconStyle;
			}
		} else if (key === 'ambientScene') {
			if (raw && (VALID_AMBIENT_SCENES as readonly string[]).includes(raw)) {
				result.ambientScene = raw as AmbientSceneType;
			}
		} else if (key === 'surfaceStyle') {
			if (raw && (VALID_SURFACE_STYLES as readonly string[]).includes(raw)) {
				result.surfaceStyle = raw as SurfaceStyleType;
			}
		} else if (key === 'cursorFx') {
			if (raw && (VALID_CURSOR_FX as readonly string[]).includes(raw)) {
				result.cursorFx = raw as CursorFxType;
			}
		} else if (key === 'overlaySkin') {
			if (raw && (VALID_OVERLAY_SKINS as readonly string[]).includes(raw)) {
				result.overlaySkin = raw as OverlaySkinType;
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

function syncAccentCssVars(colorStr: string) {
	if (typeof window === 'undefined') return;

	const isDark = document.documentElement.classList.contains('dark');
	const parsed = tinycolor(colorStr);
	const accent = parsed.isValid() ? parsed : tinycolor(DEFAULT_ACCENT);
	const hex = accent.toHexString();
	const lum = accent.getLuminance();

	const accentContrast = lum > 0.42 ? '#09090b' : '#fafafa';
	const surfaceHex = isDark ? '#09090b' : '#fafafa';
	const surfaceContrast = tinycolor.readability(accent, surfaceHex);

	let readable = accent.clone();
	if (!isDark && surfaceContrast < 2.2) {
		readable = accent.toHsl().s < 0.15 ? tinycolor('#27272a') : accent.clone().darken(35);
	} else if (isDark && surfaceContrast < 2.2) {
		readable = accent.toHsl().s < 0.15 ? tinycolor('#e4e4e7') : accent.clone().lighten(35);
	}

	const readableHex = readable.toHexString();
	const hoverHex = lum > 0.85 ? accent.clone().darken(10).toHexString() : lum < 0.08 ? accent.clone().lighten(14).toHexString() : accent.clone().darken(8).toHexString();

	setThemeVar('--accent', hex);
	setThemeVar('--accent-contrast', accentContrast);
	setThemeVar('--accent-readable', readableHex);
	setThemeVar('--hover-accent', hoverHex);
	setThemeVar('--accent-hover', hoverHex);
	setThemeVar('--active-accent', readableHex);
	setThemeVar('--accent-active', readable.clone().setAlpha(0.15).toRgbString());
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
	syncAccentCssVars(colorStr);
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
			document.documentElement.dataset.iconStyle = loaded.uiIconStyle || 'standard';
			document.documentElement.dataset.surfaceStyle = loaded.surfaceStyle || 'default';
			delete document.documentElement.dataset.fontPack;
			document.documentElement.dataset.overlaySkin = loaded.overlaySkin || 'default';
		}
	}, []);

	useEffect(() => {
		if (!isReady) return;
		const storedAccent = getPref('accent') || DEFAULT_ACCENT;
		syncAccentCssVars(storedAccent);

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
		if (storedPageWidth) {
			const pct = parsePageWidthPercent(storedPageWidth);
			setThemeVar('--page-width', `${pct}%`);
		} else {
			setThemeVar('--page-width', '90%');
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
					if (appPrefs.pageWidth) {
						const pct = parsePageWidthPercent(appPrefs.pageWidth);
						setPref('pageWidth', String(pct));
						setThemeVar('--page-width', `${pct}%`);
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
						} else if (k === 'dotMatrixRenderStyle') {
							const remoteRender = appPrefs.uiPreferences[k];
							if (remoteRender && (VALID_RENDER_STYLES as readonly string[]).includes(remoteRender)) {
								mergedPrefs.dotMatrixRenderStyle = remoteRender as DotMatrixRenderStyle;
								setPref(`pref_${k}`, remoteRender);
							} else {
								const localRender = getPref(`pref_${k}`);
								if (localRender && (VALID_RENDER_STYLES as readonly string[]).includes(localRender)) {
									mergedPrefs.dotMatrixRenderStyle = localRender as DotMatrixRenderStyle;
								}
							}
						} else if (k === 'windowControls') {
							const remoteWc = appPrefs.uiPreferences[k];
							if (remoteWc && (VALID_WINDOW_CONTROLS as readonly string[]).includes(remoteWc)) {
								mergedPrefs.windowControls = remoteWc as WindowControlsStyle;
								setPref(`pref_${k}`, remoteWc);
							} else {
								const localWc = getPref(`pref_${k}`);
								if (localWc && (VALID_WINDOW_CONTROLS as readonly string[]).includes(localWc)) {
									mergedPrefs.windowControls = localWc as WindowControlsStyle;
								}
							}
						} else if (k === 'uiIconStyle') {
							const remoteIcon = appPrefs.uiPreferences[k];
							if (remoteIcon && (VALID_UI_ICON_STYLES as readonly string[]).includes(remoteIcon)) {
								mergedPrefs.uiIconStyle = remoteIcon as UIIconStyle;
								setPref(`pref_${k}`, remoteIcon);
							} else {
								const localIcon = getPref(`pref_${k}`);
								if (localIcon && (VALID_UI_ICON_STYLES as readonly string[]).includes(localIcon)) {
									mergedPrefs.uiIconStyle = localIcon as UIIconStyle;
								}
							}
						} else if (k === 'ambientScene') {
							const remoteScene = appPrefs.uiPreferences[k];
							if (remoteScene && (VALID_AMBIENT_SCENES as readonly string[]).includes(remoteScene)) {
								mergedPrefs.ambientScene = remoteScene as AmbientSceneType;
								setPref(`pref_${k}`, remoteScene);
							} else {
								const localScene = getPref(`pref_${k}`);
								if (localScene && (VALID_AMBIENT_SCENES as readonly string[]).includes(localScene)) {
									mergedPrefs.ambientScene = localScene as AmbientSceneType;
								}
							}
						} else if (k === 'surfaceStyle') {
							const remoteSurf = appPrefs.uiPreferences[k];
							if (remoteSurf && (VALID_SURFACE_STYLES as readonly string[]).includes(remoteSurf)) {
								mergedPrefs.surfaceStyle = remoteSurf as SurfaceStyleType;
								setPref(`pref_${k}`, remoteSurf);
							} else {
								const localSurf = getPref(`pref_${k}`);
								if (localSurf && (VALID_SURFACE_STYLES as readonly string[]).includes(localSurf)) {
									mergedPrefs.surfaceStyle = localSurf as SurfaceStyleType;
								}
							}
						} else if (k === 'cursorFx') {
							const remoteFx = appPrefs.uiPreferences[k];
							if (remoteFx && (VALID_CURSOR_FX as readonly string[]).includes(remoteFx)) {
								mergedPrefs.cursorFx = remoteFx as CursorFxType;
								setPref(`pref_${k}`, remoteFx);
							} else {
								const localFx = getPref(`pref_${k}`);
								if (localFx && (VALID_CURSOR_FX as readonly string[]).includes(localFx)) {
									mergedPrefs.cursorFx = localFx as CursorFxType;
								}
							}
						} else if (k === 'overlaySkin') {
							const remoteSkin = appPrefs.uiPreferences[k];
							if (remoteSkin && (VALID_OVERLAY_SKINS as readonly string[]).includes(remoteSkin)) {
								mergedPrefs.overlaySkin = remoteSkin as OverlaySkinType;
								setPref(`pref_${k}`, remoteSkin);
							} else {
								const localSkin = getPref(`pref_${k}`);
								if (localSkin && (VALID_OVERLAY_SKINS as readonly string[]).includes(localSkin)) {
									mergedPrefs.overlaySkin = localSkin as OverlaySkinType;
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
					const unlockedList: string[] = Array.isArray(data?.credits?.unlockedBadges) ? data.credits.unlockedBadges : [];
					const gatedPrefs = enforceUnlockedCosmetics(mergedPrefs, unlockedList);
					setPreferencesState(gatedPrefs);
					if (typeof document !== 'undefined') {
						document.documentElement.classList.toggle('reduce-motion', gatedPrefs.reducedMotion);
						document.documentElement.dataset.iconStyle = gatedPrefs.uiIconStyle || 'standard';
						document.documentElement.dataset.surfaceStyle = gatedPrefs.surfaceStyle || 'default';
						delete document.documentElement.dataset.fontPack;
						document.documentElement.dataset.overlaySkin = gatedPrefs.overlaySkin || 'default';
					}
				} else {
					const unlockedList: string[] = Array.isArray(data?.credits?.unlockedBadges) ? data.credits.unlockedBadges : [];
					const gatedPrefs = enforceUnlockedCosmetics(loadStoredUIPreferences(), unlockedList);
					setPreferencesState(gatedPrefs);
					if (typeof document !== 'undefined') {
						document.documentElement.classList.toggle('reduce-motion', gatedPrefs.reducedMotion);
						document.documentElement.dataset.iconStyle = gatedPrefs.uiIconStyle || 'standard';
						document.documentElement.dataset.surfaceStyle = gatedPrefs.surfaceStyle || 'default';
						delete document.documentElement.dataset.fontPack;
						document.documentElement.dataset.overlaySkin = gatedPrefs.overlaySkin || 'default';
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
		syncAccentCssVars(getPref('accent') || DEFAULT_ACCENT);
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
				if (key === 'uiIconStyle' && typeof document !== 'undefined') {
					document.documentElement.dataset.iconStyle = String(value || 'standard');
				}
				if (key === 'surfaceStyle' && typeof document !== 'undefined') {
					document.documentElement.dataset.surfaceStyle = String(value || 'default');
				}
				if (key === 'overlaySkin' && typeof document !== 'undefined') {
					document.documentElement.dataset.overlaySkin = String(value || 'default');
				}
				if (key === 'windowControls' && typeof window !== 'undefined') {
					const electronBridge = (window as any).electron;
					if (electronBridge?.setMetadata) {
						electronBridge.setMetadata({ windowControls: value }).catch?.(() => {});
					}
					window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: { windowControls: value } }));
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
			document.documentElement.dataset.iconStyle = 'standard';
			document.documentElement.dataset.surfaceStyle = 'default';
			delete document.documentElement.dataset.fontPack;
			document.documentElement.dataset.overlaySkin = 'default';
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
			syncAccentCssVars(getPref('accent') || DEFAULT_ACCENT);
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
	const [windowControls, setWindowControls] = useState<WindowControlsStyle>('system');
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
	const prefControls = ctx?.preferences?.windowControls && ctx.preferences.windowControls !== 'system' ? ctx.preferences.windowControls : windowControls;
	const effectiveControls = prefControls === 'system' ? (isMacPlatform ? 'macos' : 'windows') : prefControls;
	const effectiveAlignment: 'left' | 'right' = prefAlignment === 'right' ? 'right' : prefAlignment === 'left' ? 'left' : effectiveControls === 'macos' || isMacPlatform ? 'right' : 'left';
	return { effectiveAlignment, isRightAligned: effectiveAlignment === 'right' };
}
