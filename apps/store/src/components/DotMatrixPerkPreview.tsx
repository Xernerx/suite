/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Compass, Copy, Cpu, Crosshair, Crown, Flame, Gem, Hexagon, LayoutGrid, Minus, MousePointerClick, Play, Search, Shield, Sparkles, Square, User, X, Zap } from 'lucide-react';
import { AmbientStageCanvas, CursorFxCanvas, XernerxDotLogo, type AmbientSceneType, type CursorFxType, type DotLogoVariant, type DotMatrixRenderStyle } from '@xernerx/feedback';
import { useDictionary } from '@xernerx/providers';

const FORMATIONS: { id: DotLogoVariant; labelKey: string }[] = [
	{ id: 'orbit', labelKey: 'account.appearance.dotMatrix.types.orbit' },
	{ id: 'vortex', labelKey: 'account.appearance.dotMatrix.types.vortex' },
	{ id: 'helix', labelKey: 'account.appearance.dotMatrix.types.helix' },
	{ id: 'prism', labelKey: 'account.appearance.dotMatrix.types.prism' },
	{ id: 'infinity', labelKey: 'account.appearance.dotMatrix.types.infinity' },
	{ id: 'wavegrid', labelKey: 'account.appearance.dotMatrix.types.wavegrid' },
	{ id: 'chronos', labelKey: 'account.appearance.dotMatrix.types.chronos' },
	{ id: 'supernova', labelKey: 'account.appearance.dotMatrix.types.supernova' },
	{ id: 'tesseract', labelKey: 'account.appearance.dotMatrix.types.tesseract' },
	{ id: 'synthwave', labelKey: 'account.appearance.dotMatrix.types.synthwave' },
	{ id: 'lotus', labelKey: 'account.appearance.dotMatrix.types.lotus' },
	{ id: 'full', labelKey: 'account.appearance.dotMatrix.types.full' },
	{ id: 'icon', labelKey: 'account.appearance.dotMatrix.types.icon' },
];

const STAGE_PRESETS: Record<string, { variant: DotLogoVariant; renderStyle: DotMatrixRenderStyle }> = {
	stage_constellation: { variant: 'supernova', renderStyle: 'constellation' },
	stage_hexgrid: { variant: 'tesseract', renderStyle: 'hexgrid' },
	stage_aurora: { variant: 'synthwave', renderStyle: 'aurora' },
	stage_glyphs: { variant: 'lotus', renderStyle: 'glyphs' },
};

const AMBIENT_SCENES: Array<{ id: Exclude<AmbientSceneType, 'default'>; labelKey: string }> = [
	{ id: 'mesh_lava', labelKey: 'account.appearance.ambientScene.options.mesh_lava.label' },
	{ id: 'cyber_grid', labelKey: 'account.appearance.ambientScene.options.cyber_grid.label' },
	{ id: 'topography', labelKey: 'account.appearance.ambientScene.options.topography.label' },
	{ id: 'nebula_cosmos', labelKey: 'account.appearance.ambientScene.options.nebula_cosmos.label' },
	{ id: 'prism_caustics', labelKey: 'account.appearance.ambientScene.options.prism_caustics.label' },
];

const SINGLE_AMBIENT_MAP: Record<string, Exclude<AmbientSceneType, 'default'>> = {
	ambient_mesh_lava: 'mesh_lava',
	ambient_cyber_grid: 'cyber_grid',
	ambient_topography: 'topography',
	ambient_nebula_cosmos: 'nebula_cosmos',
	ambient_prism_caustics: 'prism_caustics',
};

const DESKTOP_CREST_PACKS: Record<string, Array<{ id: string; label: string; src: string }>> = {
	icon_pack_monochrome: [
		{ id: 'white', label: 'Monochrome White', src: '/icons/app/white.png' },
		{ id: 'black', label: 'Obsidian Black', src: '/icons/app/black.png' },
	],
	icon_pack_neon: [
		{ id: 'cyan', label: 'Arctic Cyan', src: '/icons/app/cyan.png' },
		{ id: 'pink', label: 'Vibrant Pink', src: '/icons/app/pink.png' },
	],
	icon_pack_royal: [
		{ id: 'gold', label: 'Amber Gold', src: '/icons/app/gold.png' },
		{ id: 'red', label: 'Crimson Red', src: '/icons/app/red.png' },
	],
};

export function DotMatrixPerkPreview({ initialVariant = 'orbit', perkValue = 'dot_matrix_banner' }: { initialVariant?: DotLogoVariant; perkValue?: string }) {
	const { t } = useDictionary();
	const stagePreset = STAGE_PRESETS[perkValue];
	const [variant, setVariant] = useState<DotLogoVariant>(stagePreset ? stagePreset.variant : initialVariant);
	const [renderStyle, setRenderStyle] = useState<DotMatrixRenderStyle>(stagePreset ? stagePreset.renderStyle : 'dots');
	const [ambientScene, setAmbientScene] = useState<Exclude<AmbientSceneType, 'default'>>('mesh_lava');
	const [cursorFxPreview, setCursorFxPreview] = useState<Exclude<CursorFxType, 'default'>>('starlight_trail');
	const [morphingFromLoad, setMorphingFromLoad] = useState(false);

	useEffect(() => {
		if (stagePreset) {
			setVariant(stagePreset.variant);
			setRenderStyle(stagePreset.renderStyle);
		}
	}, [perkValue]);

	const triggerLoadingMorphDemo = () => {
		setMorphingFromLoad(true);
		setTimeout(() => {
			setMorphingFromLoad(false);
		}, 900);
	};

	if (perkValue === 'ambient_scenes_pack' || perkValue in SINGLE_AMBIENT_MAP) {
		const activeScene = SINGLE_AMBIENT_MAP[perkValue] || ambientScene;
		return (
			<div className="flex flex-col gap-2">
				<div className="relative h-28 w-full rounded-2xl overflow-hidden border border-(--accent)/35 bg-(--background)/80">
					<AmbientStageCanvas scene={activeScene} preview />
					<div className="relative z-10 flex items-center justify-between px-2.5 py-2 pointer-events-none">
						<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
							<Sparkles size={11} />
							{t(`account.appearance.ambientScene.options.${activeScene}.label`)}
						</span>
					</div>
				</div>
				{perkValue === 'ambient_scenes_pack' && (
					<div className="flex flex-wrap items-center gap-1">
						{AMBIENT_SCENES.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setAmbientScene(s.id)}
								className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
									ambientScene === s.id
										? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
										: 'bg-(--background)/55 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/35 hover:text-(--text)'
								}`}
							>
								{t(s.labelKey)}
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	if (perkValue === 'surface_styles_pack' || perkValue.startsWith('surface_')) {
		const allSurfaces = [
			{ id: 'crystal', key: 'surface_crystal', label: t('account.appearance.surfaceStyle.options.crystal.label'), Icon: Gem },
			{ id: 'holographic', key: 'surface_holographic', label: t('account.appearance.surfaceStyle.options.holographic.label'), Icon: Sparkles },
			{ id: 'neon', key: 'surface_neon', label: t('account.appearance.surfaceStyle.options.neon.label'), Icon: Zap },
			{ id: 'obsidian', key: 'surface_obsidian', label: t('account.appearance.surfaceStyle.options.obsidian.label'), Icon: Compass },
		];
		const items = perkValue === 'surface_styles_pack' ? allSurfaces : allSurfaces.filter((s) => s.key === perkValue);
		return (
			<div className={`grid ${items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-2.5`}>
				{items.map((s) => (
					<div key={s.id} className={`xrx-surface-preview-${s.id} flex items-center gap-2 rounded-xl border border-(--border)/15 bg-(--foreground)/45 px-3 py-2.5`}>
						<s.Icon size={14} className="text-(--accent) shrink-0" />
						<span className="text-[11px] font-bold text-(--text) truncate">{s.label}</span>
					</div>
				))}
			</div>
		);
	}

	if (perkValue === 'cursor_fx_bundle' || perkValue.startsWith('cursor_')) {
		const singleMap: Record<string, Exclude<CursorFxType, 'default'>> = {
			cursor_starlight_trail: 'starlight_trail',
			cursor_plasma_sparks: 'plasma_sparks',
			cursor_cyber_reticle: 'cyber_reticle',
			cursor_sonic_rings: 'sonic_rings',
			cursor_aurora_ribbon: 'aurora_ribbon',
		};
		const activeFx: Exclude<CursorFxType, 'default'> = singleMap[perkValue] || cursorFxPreview;
		const fxOptions: Array<{ id: Exclude<CursorFxType, 'default'>; labelKey: string }> = [
			{ id: 'starlight_trail', labelKey: 'account.appearance.cursorFx.options.starlight_trail.label' },
			{ id: 'plasma_sparks', labelKey: 'account.appearance.cursorFx.options.plasma_sparks.label' },
			{ id: 'cyber_reticle', labelKey: 'account.appearance.cursorFx.options.cyber_reticle.label' },
			{ id: 'sonic_rings', labelKey: 'account.appearance.cursorFx.options.sonic_rings.label' },
			{ id: 'aurora_ribbon', labelKey: 'account.appearance.cursorFx.options.aurora_ribbon.label' },
		];
		return (
			<div className="flex flex-col gap-2">
				<div className="relative h-24 w-full rounded-2xl overflow-hidden border border-(--accent)/35 bg-(--background)/80">
					<CursorFxCanvas fx={activeFx} preview />
					<div className="relative z-10 flex items-center justify-between px-2.5 py-2 pointer-events-none">
						<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
							<MousePointerClick size={11} />
							{t(`account.appearance.cursorFx.options.${activeFx}.label`)}
						</span>
					</div>
				</div>
				{perkValue === 'cursor_fx_bundle' && (
					<div className="flex flex-wrap items-center gap-1">
						{fxOptions.map((opt) => (
							<button
								key={opt.id}
								type="button"
								onClick={() => setCursorFxPreview(opt.id)}
								className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
									cursorFxPreview === opt.id
										? 'bg-(--accent) text-(--accent-contrast) border-(--accent)'
										: 'bg-(--background)/55 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/35 hover:text-(--text)'
								}`}
							>
								{t(opt.labelKey)}
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	if (perkValue === 'overlay_skins_bundle' || perkValue.startsWith('skin_')) {
		const allSkins = [
			{ id: 'hud_tactical', key: 'skin_hud_tactical', label: t('account.appearance.overlaySkin.options.hud_tactical.label'), Icon: Crosshair },
			{ id: 'frosted_prism', key: 'skin_frosted_prism', label: t('account.appearance.overlaySkin.options.frosted_prism.label'), Icon: Gem },
			{ id: 'neon_arcade', key: 'skin_neon_arcade', label: t('account.appearance.overlaySkin.options.neon_arcade.label'), Icon: Zap },
			{ id: 'minimal_pill', key: 'skin_minimal_pill', label: t('account.appearance.overlaySkin.options.minimal_pill.label'), Icon: Sparkles },
		];
		const items = perkValue === 'overlay_skins_bundle' ? allSkins : allSkins.filter((s) => s.key === perkValue);
		return (
			<div className={`grid ${items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-2.5`}>
				{items.map((s) => (
					<div key={s.id} className={`xrx-skin-preview-${s.id} flex items-center justify-between gap-2 rounded-xl border border-(--border)/15 bg-(--foreground)/55 px-3 py-2`}>
						<div className="flex items-center gap-1.5 min-w-0">
							<s.Icon size={13} className="text-(--accent) shrink-0" />
							<span className="text-[10px] font-bold text-(--text) truncate">{s.label}</span>
						</div>
						<span className="text-[9px] font-mono text-(--accent) opacity-80 shrink-0">Ctrl+K</span>
					</div>
				))}
			</div>
		);
	}

	if (perkValue === 'profile_frames_pack' || perkValue.startsWith('frame_')) {
		const allFrames = [
			{ id: 'plasma_ring', key: 'frame_plasma_ring', label: t('account.profile.cosmeticsStudio.frames.plasma_ring'), Icon: Zap },
			{ id: 'holo_crown', key: 'frame_holo_crown', label: t('account.profile.cosmeticsStudio.frames.holo_crown'), Icon: Crown },
			{ id: 'cyber_hex', key: 'frame_cyber_hex', label: t('account.profile.cosmeticsStudio.frames.cyber_hex'), Icon: Hexagon },
			{ id: 'solar_flare', key: 'frame_solar_flare', label: t('account.profile.cosmeticsStudio.frames.solar_flare'), Icon: Flame },
		];
		const items = perkValue === 'profile_frames_pack' ? allFrames : allFrames.filter((f) => f.key === perkValue);
		return (
			<div className={`grid ${items.length > 1 ? 'grid-cols-4' : 'grid-cols-1'} gap-2 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-3`}>
				{items.map((f) => (
					<div key={f.id} className="flex flex-col items-center gap-1.5">
						<div className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-(--foreground)/65 text-(--accent) xrx-avatar-frame-${f.id}`}>
							<User size={15} />
						</div>
						<span className="text-[9px] font-bold text-(--text-muted) text-center leading-tight line-clamp-1">{f.label}</span>
					</div>
				))}
			</div>
		);
	}

	if (perkValue === 'profile_nameplates_pack' || perkValue.startsWith('nameplate_')) {
		const allNameplates = [
			{ id: 'aurora_wave', key: 'nameplate_aurora_wave', card: 'holographic' },
			{ id: 'synth_horizon', key: 'nameplate_synth_horizon', card: 'celestial' },
			{ id: 'nebula_shimmer', key: 'nameplate_nebula_shimmer', card: 'cyber_neon' },
			{ id: 'cyber_circuit', key: 'nameplate_cyber_circuit', card: 'obsidian_gold' },
		] as const;
		const items = perkValue === 'profile_nameplates_pack' ? allNameplates : allNameplates.filter((n) => n.key === perkValue);
		return (
			<div className={`flex flex-col gap-1.5 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-2.5 xrx-profile-card-${items[0]?.card || 'holographic'}`}>
				<div className={`grid ${items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
					{items.map((np) => (
						<div key={np.id} className="flex items-center justify-center rounded-xl bg-(--background)/65 border border-(--border)/10 py-1.5 px-2">
							<span className={`xrx-nameplate-${np.id} !text-[10px] truncate px-2 py-0.5 rounded-full font-bold text-(--text)`}>
								{t(`account.profile.cosmeticsStudio.nameplates.${np.id}`)}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (perkValue in DESKTOP_CREST_PACKS) {
		const crests = DESKTOP_CREST_PACKS[perkValue];
		return (
			<div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-3">
				{crests.map((crest) => (
					<div key={crest.id} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-(--foreground)/45 border border-(--border)/10 p-2.5">
						<img src={crest.src} alt={crest.label} className="h-11 w-11 rounded-xl object-contain drop-shadow-md" />
						<span className="text-[11px] font-bold text-(--text) text-center">{crest.label}</span>
					</div>
				))}
			</div>
		);
	}

	if (perkValue === 'ui_icon_packs') {
		return (
			<div className="grid grid-cols-3 gap-2 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-3">
				{[
					{
						id: 'duotone',
						label: t('account.preferences.uiIconStyle.duotone'),
						style: { fill: 'color-mix(in srgb, currentColor 22%, transparent)', filter: 'drop-shadow(0 0 6px var(--accent))' },
					},
					{ id: 'bold', label: t('account.preferences.uiIconStyle.bold'), strokeWidth: 2.7 },
					{ id: 'precision', label: t('account.preferences.uiIconStyle.precision'), strokeWidth: 1.3 },
				].map((mode) => (
					<div key={mode.id} className="flex flex-col items-center gap-1.5 rounded-xl bg-(--foreground)/45 border border-(--border)/10 p-2.5 text-(--accent)">
						<div className="flex items-center gap-1.5">
							<Compass size={16} strokeWidth={mode.strokeWidth || 2} style={mode.style} />
							<Shield size={16} strokeWidth={mode.strokeWidth || 2} style={mode.style} />
							<Bell size={16} strokeWidth={mode.strokeWidth || 2} style={mode.style} />
						</div>
						<span className="text-[10px] font-bold text-(--text) text-center">{mode.label}</span>
					</div>
				))}
			</div>
		);
	}

	if (perkValue === 'window_styles_pack') {
		return (
			<div className="flex flex-col gap-2 rounded-2xl border border-(--accent)/30 bg-(--background)/65 p-3">
				<div className="flex items-center justify-between gap-2 rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-1.5">
					<span className="text-[10px] font-bold text-(--text-muted)">{t('account.preferences.desktop.windowControlsCapsule')}</span>
					<div className="flex items-center gap-1 rounded-full bg-(--foreground)/75 border border-(--border)/15 px-1.5 py-0.5 text-(--text-muted)">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent)/20 text-(--accent)">
							<Search size={11} />
						</span>
						<span className="flex h-5 w-5 items-center justify-center rounded-full">
							<LayoutGrid size={11} />
						</span>
						<span className="flex h-5 w-5 items-center justify-center rounded-full">
							<Minus size={11} />
						</span>
						<span className="flex h-5 w-5 items-center justify-center rounded-full text-(--accent-red)">
							<X size={11} />
						</span>
					</div>
				</div>
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-1 items-center justify-between rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-1.5">
						<span className="text-[10px] font-bold text-(--text-muted)">{t('account.preferences.desktop.windowControlsSquircle')}</span>
						<div className="flex items-center gap-1">
							<span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--foreground)/75 border border-(--accent)/35 text-(--accent)">
								<Copy size={10} />
							</span>
							<span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--foreground)/75 border border-(--border)/15 text-(--text-muted)">
								<Square size={9} />
							</span>
						</div>
					</div>
					<div className="flex flex-1 items-center justify-between rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-1.5">
						<span className="text-[10px] font-bold text-(--text-muted)">{t('account.preferences.desktop.windowControlsMinimal')}</span>
						<div className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-full bg-(--accent)/45" />
							<span className="h-2.5 w-2.5 rounded-full bg-(--accent)" />
							<span className="h-2.5 w-2.5 rounded-full bg-(--accent-red)/80" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (perkValue !== 'dot_matrix_banner' && !stagePreset) return null;

	return (
		<div className="flex flex-col gap-2">
			<div className="relative h-32 w-full rounded-2xl overflow-hidden border border-(--accent)/35 bg-(--background)/75 shadow-[inset_0_0_24px_color-mix(in_srgb,var(--accent)_14%,transparent)]">
				<div className="absolute inset-0">
					<XernerxDotLogo variant={morphingFromLoad ? 'full' : variant} renderStyle={renderStyle} backgroundMode ripple={true} vivid={true} />
				</div>
				<div className="relative z-10 flex items-center justify-between px-2.5 py-2 pointer-events-none">
					<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
						<Cpu size={11} />
						{t('account.store.credits.dotMatrixPreview.liveBadge')}
					</span>
					<button
						type="button"
						onClick={triggerLoadingMorphDemo}
						className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-(--background)/85 hover:bg-(--accent) hover:text-(--accent-contrast) backdrop-blur-md border border-(--accent)/35 px-2.5 py-0.5 text-[10px] font-bold text-(--accent) transition-colors cursor-pointer"
					>
						<Play size={9} />
						{t('account.store.credits.dotMatrixPreview.testMorph')}
					</button>
				</div>
			</div>

			{perkValue === 'dot_matrix_banner' ? (
				<div className="flex flex-wrap items-center gap-1">
					{FORMATIONS.map((f) => {
						const active = variant === f.id;
						return (
							<button
								key={f.id}
								type="button"
								onClick={() => setVariant(f.id)}
								className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
									active
										? 'bg-(--accent) text-(--accent-contrast) border-(--accent) shadow-xs'
										: 'bg-(--background)/55 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/35 hover:text-(--text)'
								}`}
							>
								{t(f.labelKey)}
							</button>
						);
					})}
				</div>
			) : (
				<div className="flex items-center justify-between gap-1 text-[10px] text-(--text-muted) px-1">
					<span className="inline-flex items-center gap-1 font-semibold text-(--accent)">
						<Sparkles size={10} />
						{t(`account.appearance.dotMatrix.renderStyles.${renderStyle}`)}
					</span>
					<span>{t('account.store.credits.dotMatrixPreview.clickHint')}</span>
				</div>
			)}
		</div>
	);
}
