/** @format */
'use client';

import { EyeOff, Laptop, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button, Selector, Toggle } from '@xernerx/ui';
import {
	useDictionary,
	useEnvironment,
	useSession,
	useShortcuts,
	useTheme,
	useToast,
	type AmbientSceneType,
	type CursorFxType,
	type DotMatrixAnimation,
	type DotMatrixRenderStyle,
	type DotMatrixStage,
	type DotMatrixType,
	type OverlaySkinType,
	type SurfaceStyleType,
} from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { DotMatrixSettingsCard } from './DotMatrixSettingsCard';
import { AmbientAndSurfaceCard } from './AmbientAndSurfaceCard';
import { AppearanceScalingCards } from './AppearanceScalingCards';
import { AppearanceAccentPicker, PRESET_COLORS } from './AppearanceAccentPicker';

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
	const dotMatrixRenderStyle: DotMatrixRenderStyle = uiPreferences?.dotMatrixRenderStyle || 'dots';
	const dotMatrixAnimation: DotMatrixAnimation = uiPreferences?.dotMatrixAnimation || (dotMatrixStage === 'ripple' ? 'always' : 'animate');
	const ambientScene: AmbientSceneType = uiPreferences?.ambientScene || 'default';
	const surfaceStyle: SurfaceStyleType = uiPreferences?.surfaceStyle || 'default';
	const cursorFx: CursorFxType = uiPreferences?.cursorFx || 'default';
	const overlaySkin: OverlaySkinType = uiPreferences?.overlaySkin || 'default';

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
	const [pageWidth, setPageWidth] = useState<number>(90);
	const [textScale, setTextScale] = useState<number>(14);

	const parseStoredPageWidth = (raw: string | null): number => {
		if (!raw) return 90;
		const legacyMap: Record<string, number> = {
			compact: 75,
			default: 90,
			wide: 95,
			full: 100,
		};
		const trimmed = raw.trim().toLowerCase();
		if (trimmed in legacyMap) return legacyMap[trimmed];
		const parsed = parseInt(trimmed.replace('%', ''), 10);
		if (!isNaN(parsed)) {
			return Math.min(100, Math.max(60, Math.round(parsed / 5) * 5));
		}
		return 90;
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
			const resolvedWidth = parseStoredPageWidth(storedPageWidth);
			setPageWidth(resolvedWidth);
			setThemeVar('--page-width', `${resolvedWidth}%`);

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
					dotMatrixRenderStyle: overrides.dotMatrixRenderStyle || dotMatrixRenderStyle,
					dotMatrixAnimation: overrides.dotMatrixAnimation || dotMatrixAnimation,
					ambientScene: overrides.ambientScene || ambientScene,
					surfaceStyle: overrides.surfaceStyle || surfaceStyle,
					cursorFx: overrides.cursorFx || cursorFx,
					overlaySkin: overrides.overlaySkin || overlaySkin,
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
		const matchedKey = PRESET_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase())?.key;
		const colorLabel = matchedKey ? t(`account.appearance.colors.${matchedKey}`) : hex;
		toast({
			type: 'success',
			title: t('account.appearance.toast.accentColor.title'),
			description: t('account.appearance.toast.accentColor.description', { color: colorLabel }),
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

	const handlePageWidthChange = (val: number) => {
		setPageWidth(val);
		setPref('pageWidth', String(val));
		setThemeVar('--page-width', `${val}%`);
		saveToDb({ pageWidth: String(val) });
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

	const handleDotMatrixRenderStyleChange = (nextStyle: DotMatrixRenderStyle) => {
		setPreference('dotMatrixRenderStyle', nextStyle);
		saveToDb({ dotMatrixRenderStyle: nextStyle });
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

	const handleAmbientSceneChange = (nextScene: AmbientSceneType) => {
		setPreference('ambientScene', nextScene);
		saveToDb({ ambientScene: nextScene });
		toast({
			type: 'success',
			title: t('account.appearance.toast.ambientScene.title'),
		});
	};

	const handleSurfaceStyleChange = (nextStyle: SurfaceStyleType) => {
		setPreference('surfaceStyle', nextStyle);
		saveToDb({ surfaceStyle: nextStyle });
		toast({
			type: 'success',
			title: t('account.appearance.toast.surfaceStyle.title'),
		});
	};

	const handleCursorFxChange = (nextFx: CursorFxType) => {
		setPreference('cursorFx', nextFx);
		saveToDb({ cursorFx: nextFx });
		toast({
			type: 'success',
			title: t('account.appearance.toast.cursorFx.title'),
		});
	};

	const handleOverlaySkinChange = (nextSkin: OverlaySkinType) => {
		setPreference('overlaySkin', nextSkin);
		saveToDb({ overlaySkin: nextSkin });
		toast({
			type: 'success',
			title: t('account.appearance.toast.overlaySkin.title'),
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

		setPageWidth(90);
		setPref('pageWidth', '90');
		setThemeVar('--page-width', '90%');

		setTextScale(14);
		setPref('textScale', '14');
		setThemeVar('--text-scale', '14px');

		setPreference('dotMatrixStage', 'default');
		setPreference('dotMatrixType', 'default');
		setPreference('dotMatrixRenderStyle', 'dots');
		setPreference('dotMatrixAnimation', 'animate');
		setPreference('ambientScene', 'default');
		setPreference('surfaceStyle', 'default');
		setPreference('cursorFx', 'default');
		setPreference('overlaySkin', 'default');

		saveToDb({
			theme: 'system',
			accent: '#8b7cf6',
			uiZoom: 100,
			uiGap: '16',
			pageWidth: '90',
			textScale: 14,
			dotMatrixStage: 'default',
			dotMatrixType: 'default',
			dotMatrixRenderStyle: 'dots',
			dotMatrixAnimation: 'animate',
			ambientScene: 'default',
			surfaceStyle: 'default',
			cursorFx: 'default',
			overlaySkin: 'default',
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
					<div className="w-full sm:w-auto">
						<Selector value={selectedTheme} options={themeOptions} onChange={handleThemeChange} />
					</div>
				</div>

				{/* Dot-Matrix Background Stage & Animation Card */}
				<DotMatrixSettingsCard
					dotMatrixType={dotMatrixType}
					dotMatrixRenderStyle={dotMatrixRenderStyle}
					dotMatrixAnimation={dotMatrixAnimation}
					onChangeType={handleDotMatrixTypeChange}
					onChangeRenderStyle={handleDotMatrixRenderStyleChange}
					onChangeAnimation={handleDotMatrixAnimationChange}
					isUiHidden={isUiHidden}
					onToggleHideUi={toggleContentHidden}
				/>

				{/* Standalone Full-Screen Ambient Shaders, Card Surfaces, Cursor FX & Overlay Skins */}
				<AmbientAndSurfaceCard
					ambientScene={ambientScene}
					surfaceStyle={surfaceStyle}
					cursorFx={cursorFx}
					overlaySkin={overlaySkin}
					onChangeAmbientScene={handleAmbientSceneChange}
					onChangeSurfaceStyle={handleSurfaceStyleChange}
					onChangeCursorFx={handleCursorFxChange}
					onChangeOverlaySkin={handleOverlaySkinChange}
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
				<AppearanceAccentPicker selectedColor={selectedColor} syncFromDiscord={syncFromDiscord} onSelectColor={handleSelectColor} />

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
