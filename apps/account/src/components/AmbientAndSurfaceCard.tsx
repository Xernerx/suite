/** @format */
'use client';

import { useState } from 'react';
import { Bell, Check, Compass, Crosshair, Droplets, ExternalLink, EyeOff, Flame, Gem, Grid, Layers, Lock, Mountain, MousePointerClick, Radio, Sparkles, Stars, Sun, Wand2, Zap } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { AmbientStageCanvas, CursorFxCanvas } from '@xernerx/feedback';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser, type AmbientSceneType, type CursorFxType, type OverlaySkinType, type SurfaceStyleType } from '@xernerx/providers';
import { AMBIENT_SCENE_UNLOCK_MAP, CURSOR_FX_UNLOCK_MAP, isCosmeticUnlocked, OVERLAY_SKIN_UNLOCK_MAP, SURFACE_STYLE_UNLOCK_MAP } from './cosmeticUnlocks';

interface AmbientAndSurfaceCardProps {
	ambientScene: AmbientSceneType;
	surfaceStyle: SurfaceStyleType;
	cursorFx: CursorFxType;
	overlaySkin: OverlaySkinType;
	onChangeAmbientScene: (next: AmbientSceneType) => void;
	onChangeSurfaceStyle: (next: SurfaceStyleType) => void;
	onChangeCursorFx: (next: CursorFxType) => void;
	onChangeOverlaySkin: (next: OverlaySkinType) => void;
	onToggleHideUi?: () => void;
}

const AMBIENT_SCENES: Array<{ value: AmbientSceneType; icon: any }> = [
	{ value: 'default', icon: Layers },
	{ value: 'mesh_lava', icon: Flame },
	{ value: 'cyber_grid', icon: Grid },
	{ value: 'topography', icon: Mountain },
	{ value: 'nebula_cosmos', icon: Stars },
	{ value: 'prism_caustics', icon: Droplets },
];

const SURFACE_STYLES: Array<{ value: SurfaceStyleType; icon: any }> = [
	{ value: 'default', icon: Layers },
	{ value: 'crystal', icon: Gem },
	{ value: 'holographic', icon: Sparkles },
	{ value: 'neon', icon: Zap },
	{ value: 'obsidian', icon: Compass },
];

const CURSOR_FX_OPTIONS: Array<{ value: CursorFxType; icon: any }> = [
	{ value: 'default', icon: MousePointerClick },
	{ value: 'starlight_trail', icon: Sparkles },
	{ value: 'plasma_sparks', icon: Zap },
	{ value: 'cyber_reticle', icon: Crosshair },
	{ value: 'sonic_rings', icon: Radio },
	{ value: 'aurora_ribbon', icon: Wand2 },
];

const OVERLAY_SKINS: Array<{ value: OverlaySkinType; icon: any }> = [
	{ value: 'default', icon: Layers },
	{ value: 'hud_tactical', icon: Crosshair },
	{ value: 'frosted_prism', icon: Gem },
	{ value: 'neon_arcade', icon: Zap },
	{ value: 'minimal_pill', icon: Sparkles },
];

export function AmbientAndSurfaceCard({
	ambientScene,
	surfaceStyle,
	cursorFx,
	overlaySkin,
	onChangeAmbientScene,
	onChangeSurfaceStyle,
	onChangeCursorFx,
	onChangeOverlaySkin,
	onToggleHideUi,
}: AmbientAndSurfaceCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { hasPermission } = usePermissions();
	const { toast } = useToast();
	const hasAdminAccess = hasPermission('access');

	const [previewSceneOverride, setPreviewSceneOverride] = useState<AmbientSceneType | null>(null);

	const showLockedToast = (titleKey: string, descKey: string) => {
		toast({
			type: 'info',
			title: t(titleKey),
			description: t(descKey),
			action: {
				label: t('account.appearance.dotMatrix.openCreditStore'),
				onClick: () => {
					window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
				},
			},
		});
	};

	const handleSelectAmbientScene = (nextScene: AmbientSceneType) => {
		const reqUnlock = AMBIENT_SCENE_UNLOCK_MAP[nextScene];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			setPreviewSceneOverride(nextScene);
			showLockedToast('account.appearance.ambientScene.lockedToastTitle', 'account.appearance.ambientScene.lockedToastDesc');
			return;
		}
		setPreviewSceneOverride(null);
		onChangeAmbientScene(nextScene);
	};

	const handleSelectSurfaceStyle = (nextStyle: SurfaceStyleType) => {
		const reqUnlock = SURFACE_STYLE_UNLOCK_MAP[nextStyle];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			showLockedToast('account.appearance.surfaceStyle.lockedToastTitle', 'account.appearance.surfaceStyle.lockedToastDesc');
			return;
		}
		onChangeSurfaceStyle(nextStyle);
	};

	const handleSelectCursorFx = (nextFx: CursorFxType) => {
		const reqUnlock = CURSOR_FX_UNLOCK_MAP[nextFx];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			showLockedToast('account.appearance.cursorFx.lockedToastTitle', 'account.appearance.cursorFx.lockedToastDesc');
			return;
		}
		onChangeCursorFx(nextFx);
	};

	const handleSelectOverlaySkin = (nextSkin: OverlaySkinType) => {
		const reqUnlock = OVERLAY_SKIN_UNLOCK_MAP[nextSkin];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			showLockedToast('account.appearance.overlaySkin.lockedToastTitle', 'account.appearance.overlaySkin.lockedToastDesc');
			return;
		}
		onChangeOverlaySkin(nextSkin);
	};

	const activePreviewScene: AmbientSceneType = previewSceneOverride || (ambientScene === 'default' ? 'mesh_lava' : ambientScene);

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Standalone Full-Screen Ambient Canvas Scenes */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col max-w-2xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center gap-2">
							<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.ambientScene.title')}</h2>
							<Badge variant="accent" size="sm">
								{t('account.appearance.ambientScene.badge')}
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.ambientScene.description')}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						{previewSceneOverride && (
							<Button
								size="sm"
								variant="primary"
								onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits'))}
								className="inline-flex items-center gap-1.5"
							>
								<ExternalLink size={13} />
								{t('account.appearance.dotMatrix.openCreditStore')}
							</Button>
						)}
						{onToggleHideUi && (
							<Button size="sm" variant="secondary" onClick={onToggleHideUi} className="inline-flex items-center gap-1.5">
								<EyeOff size={13} className="text-(--accent)" />
								{t('account.appearance.hideUi')}
							</Button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 items-stretch" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{/* Live Shader Viewport Preview */}
					<div className="lg:col-span-5 relative min-h-[168px] rounded-2xl border border-(--accent)/30 bg-(--background)/70 overflow-hidden flex flex-col justify-between p-4">
						<AmbientStageCanvas scene={activePreviewScene} preview />
						<div className="relative z-10 flex items-center justify-between gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2.5 py-1 text-[10px] font-bold text-(--accent)">
								<Sun size={11} />
								{t(`account.appearance.ambientScene.options.${activePreviewScene}.label`)}
							</span>
							{previewSceneOverride && (
								<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/85 border border-(--border)/20 px-2 py-0.5 text-[10px] font-bold text-(--text-muted)">
									<Lock size={10} className="text-(--accent)" />
									{t('account.appearance.ambientScene.previewMode')}
								</span>
							)}
						</div>
						<div className="relative z-10 mt-auto pt-6">
							<p className="text-[11px] font-medium text-(--text) drop-shadow-xs">{t(`account.appearance.ambientScene.options.${activePreviewScene}.desc`)}</p>
						</div>
					</div>

					{/* Scene Option Cards */}
					<div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
						{AMBIENT_SCENES.map((item) => {
							const Icon = item.icon;
							const unlocked = isCosmeticUnlocked(user, hasAdminAccess, AMBIENT_SCENE_UNLOCK_MAP[item.value]);
							const isSelected = ambientScene === item.value && !previewSceneOverride;
							const isPreviewed = previewSceneOverride === item.value;

							return (
								<button
									key={item.value}
									type="button"
									onClick={() => handleSelectAmbientScene(item.value)}
									className={`group flex flex-col justify-between text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
										isSelected
											? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_22%,transparent)]'
											: isPreviewed
												? 'bg-(--accent)/10 border-(--accent)/50'
												: 'bg-(--background)/50 border-(--border)/10 hover:border-(--accent)/35 hover:bg-(--foreground)/45'
									}`}
								>
									<div className="flex items-center justify-between w-full mb-2">
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
												isSelected ? 'bg-(--accent) text-(--accent-contrast) border-(--accent)' : 'bg-(--foreground)/50 text-(--accent) border-(--border)/10'
											}`}
										>
											<Icon size={15} />
										</div>
										{isSelected ? (
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast)">
												<Check size={11} />
											</span>
										) : !unlocked ? (
											<Lock size={13} className="text-(--accent) opacity-80" />
										) : null}
									</div>
									<div>
										<div className="text-xs font-bold text-(--text) truncate">{t(`account.appearance.ambientScene.options.${item.value}.label`)}</div>
										<div className="text-[10px] text-(--text-muted) line-clamp-2 mt-0.5">{t(`account.appearance.ambientScene.options.${item.value}.desc`)}</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Card & Glass Surface Architecture */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col max-w-2xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center gap-2">
							<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.surfaceStyle.title')}</h2>
							<Badge variant="accent" size="sm">
								{t('account.appearance.surfaceStyle.badge')}
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.surfaceStyle.description')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{SURFACE_STYLES.map((item) => {
						const Icon = item.icon;
						const unlocked = isCosmeticUnlocked(user, hasAdminAccess, SURFACE_STYLE_UNLOCK_MAP[item.value]);
						const isSelected = surfaceStyle === item.value;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => handleSelectSurfaceStyle(item.value)}
								className={`xrx-surface-preview-${item.value} relative flex flex-col justify-between text-left rounded-2xl border p-4 transition-all cursor-pointer ${
									isSelected ? 'bg-(--accent)/15 border-(--accent) ring-2 ring-(--accent)/40' : 'bg-(--background)/55 border-(--border)/15 hover:border-(--accent)/40'
								}`}
							>
								<div className="flex items-center justify-between w-full mb-3">
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
											isSelected ? 'bg-(--accent) text-(--accent-contrast) border-(--accent)' : 'bg-(--foreground)/60 text-(--accent) border-(--border)/15'
										}`}
									>
										<Icon size={16} />
									</div>
									{isSelected ? (
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast)">
											<Check size={11} />
										</span>
									) : !unlocked ? (
										<Lock size={13} className="text-(--accent) opacity-80" />
									) : null}
								</div>

								<div>
									<div className="text-xs font-bold text-(--text)">{t(`account.appearance.surfaceStyle.options.${item.value}.label`)}</div>
									<p className="text-[10px] text-(--text-muted) mt-1 line-clamp-2">{t(`account.appearance.surfaceStyle.options.${item.value}.desc`)}</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Interactive Cursor Trail & Click Shockwave FX */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col max-w-2xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center gap-2">
							<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.cursorFx.title')}</h2>
							<Badge variant="accent" size="sm">
								{t('account.appearance.cursorFx.badge')}
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.cursorFx.description')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{CURSOR_FX_OPTIONS.map((item) => {
						const Icon = item.icon;
						const unlocked = isCosmeticUnlocked(user, hasAdminAccess, CURSOR_FX_UNLOCK_MAP[item.value]);
						const isSelected = cursorFx === item.value;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => handleSelectCursorFx(item.value)}
								className={`relative flex flex-col justify-between text-left rounded-2xl border p-4 transition-all cursor-pointer overflow-hidden ${
									isSelected ? 'bg-(--accent)/15 border-(--accent) ring-2 ring-(--accent)/40' : 'bg-(--background)/55 border-(--border)/15 hover:border-(--accent)/40'
								}`}
							>
								<div className="relative h-14 w-full rounded-xl border border-(--border)/10 bg-(--background)/70 mb-3 overflow-hidden flex items-center justify-center">
									{item.value !== 'default' ? (
										<CursorFxCanvas fx={item.value} preview />
									) : (
										<div className="flex items-center gap-1.5 text-[11px] font-medium text-(--text-muted)">
											<MousePointerClick size={14} className="text-(--accent)" />
											<span>{t('account.appearance.cursorFx.options.default.label')}</span>
										</div>
									)}
								</div>

								<div className="flex items-center justify-between w-full mb-1.5">
									<div className="flex items-center gap-2">
										<div
											className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
												isSelected ? 'bg-(--accent) text-(--accent-contrast) border-(--accent)' : 'bg-(--foreground)/60 text-(--accent) border-(--border)/15'
											}`}
										>
											<Icon size={14} />
										</div>
										<div className="text-xs font-bold text-(--text)">{t(`account.appearance.cursorFx.options.${item.value}.label`)}</div>
									</div>
									{isSelected ? (
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast)">
											<Check size={11} />
										</span>
									) : !unlocked ? (
										<Lock size={13} className="text-(--accent) opacity-80" />
									) : null}
								</div>

								<p className="text-[10px] text-(--text-muted) line-clamp-2">{t(`account.appearance.cursorFx.options.${item.value}.desc`)}</p>
							</button>
						);
					})}
				</div>
			</div>

			{/* Custom Toast, Modal & Command Palette (Ctrl+K) Skins */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col max-w-2xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center gap-2">
							<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.overlaySkin.title')}</h2>
							<Badge variant="accent" size="sm">
								{t('account.appearance.overlaySkin.badge')}
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.overlaySkin.description')}</p>
					</div>

					<Button
						size="sm"
						variant="secondary"
						onClick={() =>
							toast({
								type: 'info',
								title: t(`account.appearance.overlaySkin.options.${overlaySkin}.label`),
								description: t('account.appearance.overlaySkin.testToastDesc'),
							})
						}
						className="inline-flex items-center gap-1.5 shrink-0"
					>
						<Bell size={13} className="text-(--accent)" />
						{t('account.appearance.overlaySkin.testToastBtn')}
					</Button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{OVERLAY_SKINS.map((item) => {
						const Icon = item.icon;
						const unlocked = isCosmeticUnlocked(user, hasAdminAccess, OVERLAY_SKIN_UNLOCK_MAP[item.value]);
						const isSelected = overlaySkin === item.value;

						return (
							<button
								key={item.value}
								type="button"
								onClick={() => handleSelectOverlaySkin(item.value)}
								className={`xrx-skin-preview-${item.value} relative flex flex-col justify-between text-left rounded-2xl border p-4 transition-all cursor-pointer ${
									isSelected ? 'bg-(--accent)/15 border-(--accent) ring-2 ring-(--accent)/40' : 'bg-(--background)/55 border-(--border)/15 hover:border-(--accent)/40'
								}`}
							>
								<div className="flex items-center justify-between w-full mb-3">
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
											isSelected ? 'bg-(--accent) text-(--accent-contrast) border-(--accent)' : 'bg-(--foreground)/60 text-(--accent) border-(--border)/15'
										}`}
									>
										<Icon size={16} />
									</div>
									{isSelected ? (
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast)">
											<Check size={11} />
										</span>
									) : !unlocked ? (
										<Lock size={13} className="text-(--accent) opacity-80" />
									) : null}
								</div>

								<div>
									<div className="text-xs font-bold text-(--text)">{t(`account.appearance.overlaySkin.options.${item.value}.label`)}</div>
									<p className="text-[10px] text-(--text-muted) mt-1 line-clamp-2">{t(`account.appearance.overlaySkin.options.${item.value}.desc`)}</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
