/** @format */
'use client';

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
import { getPref, parseStoredPageWidth, setPref, setThemeVar } from './appearance/appearanceStorage';
import { AppearanceHeader, AppearanceThemeCard } from './appearance/AppearanceThemeCard';
import { AppearanceSyncCards } from './appearance/AppearanceSyncCards';

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

	const [clientSync, setClientSync] = useState<boolean>(() => getPref('clientSync') === 'true');
	const [syncFromDiscord, setSyncFromDiscord] = useState<boolean>(() => getPref('syncFromDiscord') !== 'false');

	const [selectedColor, setSelectedColor] = useState<string>('#8b7cf6');
	const [selectedTheme, setSelectedTheme] = useState<string>('system');

	const [uiZoom, setUiZoom] = useState<number>(100);
	const [uiGap, setUiGap] = useState<string>('16');
	const [pageWidth, setPageWidth] = useState<number>(90);
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
		toast({ type: 'success', title: t('account.appearance.toast.density.title') });
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
		toast({ type: 'success', title: t('account.appearance.toast.dotMatrixStage.title') });
	};

	const handleDotMatrixRenderStyleChange = (nextStyle: DotMatrixRenderStyle) => {
		setPreference('dotMatrixRenderStyle', nextStyle);
		saveToDb({ dotMatrixRenderStyle: nextStyle });
		toast({ type: 'success', title: t('account.appearance.toast.dotMatrixStage.title') });
	};

	const handleDotMatrixAnimationChange = (nextAnim: DotMatrixAnimation) => {
		setPreference('dotMatrixAnimation', nextAnim);
		saveToDb({ dotMatrixAnimation: nextAnim });
		toast({ type: 'success', title: t('account.appearance.toast.dotMatrixStage.title') });
	};

	const handleAmbientSceneChange = (nextScene: AmbientSceneType) => {
		setPreference('ambientScene', nextScene);
		saveToDb({ ambientScene: nextScene });
		toast({ type: 'success', title: t('account.appearance.toast.ambientScene.title') });
	};

	const handleSurfaceStyleChange = (nextStyle: SurfaceStyleType) => {
		setPreference('surfaceStyle', nextStyle);
		saveToDb({ surfaceStyle: nextStyle });
		toast({ type: 'success', title: t('account.appearance.toast.surfaceStyle.title') });
	};

	const handleCursorFxChange = (nextFx: CursorFxType) => {
		setPreference('cursorFx', nextFx);
		saveToDb({ cursorFx: nextFx });
		toast({ type: 'success', title: t('account.appearance.toast.cursorFx.title') });
	};

	const handleOverlaySkinChange = (nextSkin: OverlaySkinType) => {
		setPreference('overlaySkin', nextSkin);
		saveToDb({ overlaySkin: nextSkin });
		toast({ type: 'success', title: t('account.appearance.toast.overlaySkin.title') });
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

	return (
		<div
			className={`flex flex-col max-w-(--page-width) mx-auto w-full transition-opacity duration-300 ${isUiHidden ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}
		>
			<AppearanceHeader onHideUi={() => setIsUiHidden(true)} onResetDefaults={handleResetDefaults} />

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<AppearanceThemeCard selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />

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

				<AppearanceSyncCards clientSync={clientSync} onToggleClientSync={handleToggleClientSync} syncFromDiscord={syncFromDiscord} onToggleDiscordSync={handleToggleSync} />

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
