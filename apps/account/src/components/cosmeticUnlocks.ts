/** @format */

import type { AmbientSceneType, CursorFxType, DotMatrixRenderStyle, DotMatrixType, OverlaySkinType, SurfaceStyleType, UIIconStyle, WindowControlsStyle } from '@xernerx/providers';
import type { DesktopAppIcon } from './desktopPreferencesConfig';

export const AMBIENT_SCENE_UNLOCK_MAP: Partial<Record<AmbientSceneType, string>> = {
	mesh_lava: 'ambient_mesh_lava',
	cyber_grid: 'ambient_cyber_grid',
	topography: 'ambient_topography',
	nebula_cosmos: 'ambient_nebula_cosmos',
	prism_caustics: 'ambient_prism_caustics',
};

export const SURFACE_STYLE_UNLOCK_MAP: Partial<Record<SurfaceStyleType, string>> = {
	crystal: 'surface_crystal',
	holographic: 'surface_holographic',
	neon: 'surface_neon',
	obsidian: 'surface_obsidian',
};

export const CURSOR_FX_UNLOCK_MAP: Partial<Record<CursorFxType, string>> = {
	starlight_trail: 'cursor_starlight_trail',
	plasma_sparks: 'cursor_plasma_sparks',
	cyber_reticle: 'cursor_cyber_reticle',
	sonic_rings: 'cursor_sonic_rings',
	aurora_ribbon: 'cursor_aurora_ribbon',
};

export const OVERLAY_SKIN_UNLOCK_MAP: Partial<Record<OverlaySkinType, string>> = {
	hud_tactical: 'skin_hud_tactical',
	frosted_prism: 'skin_frosted_prism',
	neon_arcade: 'skin_neon_arcade',
	minimal_pill: 'skin_minimal_pill',
};

export const RENDER_STYLE_UNLOCK_MAP: Partial<Record<DotMatrixRenderStyle, string>> = {
	constellation: 'stage_constellation',
	hexgrid: 'stage_hexgrid',
	aurora: 'stage_aurora',
	glyphs: 'stage_glyphs',
};

export const FORMATION_UNLOCK_MAP: Partial<Record<DotMatrixType, string>> = {
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

export const AVATAR_FRAME_UNLOCK_MAP: Record<string, string> = {
	plasma_ring: 'frame_plasma_ring',
	holo_crown: 'frame_holo_crown',
	cyber_hex: 'frame_cyber_hex',
	solar_flare: 'frame_solar_flare',
};

export const NAMEPLATE_UNLOCK_MAP: Record<string, string> = {
	aurora_wave: 'nameplate_aurora_wave',
	synth_horizon: 'nameplate_synth_horizon',
	nebula_shimmer: 'nameplate_nebula_shimmer',
	cyber_circuit: 'nameplate_cyber_circuit',
};

export const PROFILE_CARD_THEME_UNLOCK_MAP: Record<string, string> = {
	holographic: 'nameplate_aurora_wave',
	celestial: 'nameplate_synth_horizon',
	cyber_neon: 'nameplate_nebula_shimmer',
	obsidian_gold: 'nameplate_cyber_circuit',
};

export const DESKTOP_ICON_UNLOCK_MAP: Partial<Record<DesktopAppIcon, string>> = {
	white: 'icon_pack_monochrome',
	black: 'icon_pack_monochrome',
	cyan: 'icon_pack_neon',
	pink: 'icon_pack_neon',
	gold: 'icon_pack_royal',
	red: 'icon_pack_royal',
};

export const WINDOW_CONTROL_UNLOCK_MAP: Partial<Record<WindowControlsStyle, string>> = {
	capsule: 'window_styles_pack',
	squircle: 'window_styles_pack',
	minimal: 'window_styles_pack',
};

export const UI_ICON_STYLE_UNLOCK_MAP: Partial<Record<UIIconStyle, string>> = {
	duotone: 'ui_icon_packs',
	bold: 'ui_icon_packs',
	precision: 'ui_icon_packs',
};

const CHILD_TO_PARENT_BUNDLE: Record<string, string> = {
	ambient_mesh_lava: 'ambient_scenes_pack',
	ambient_cyber_grid: 'ambient_scenes_pack',
	ambient_topography: 'ambient_scenes_pack',
	ambient_nebula_cosmos: 'ambient_scenes_pack',
	ambient_prism_caustics: 'ambient_scenes_pack',
	surface_crystal: 'surface_styles_pack',
	surface_holographic: 'surface_styles_pack',
	surface_neon: 'surface_styles_pack',
	surface_obsidian: 'surface_styles_pack',
	frame_plasma_ring: 'profile_frames_pack',
	frame_holo_crown: 'profile_frames_pack',
	frame_cyber_hex: 'profile_frames_pack',
	frame_solar_flare: 'profile_frames_pack',
	nameplate_aurora_wave: 'profile_nameplates_pack',
	nameplate_synth_horizon: 'profile_nameplates_pack',
	nameplate_nebula_shimmer: 'profile_nameplates_pack',
	nameplate_cyber_circuit: 'profile_nameplates_pack',
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

export function hasUltraOrStaffAccess(user: any, hasAdminAccess = false): boolean {
	if (hasAdminAccess || user?.staffSubscription) return true;
	const subs: any[] = Array.isArray(user?.subscriptions) ? user.subscriptions : [];
	return subs.some(
		(s) =>
			(s?.status === 'active' || s?.status === 'trialing') &&
			(s?.priceId === 'ultra' ||
				s?.stripeSubscriptionId === 'staff_infinite_sub' ||
				String(s?.priceId || '').includes('V0pD5uXoTQkrYS') ||
				String(s?.priceId || '')
					.toLowerCase()
					.includes('ultra'))
	);
}

export function isCosmeticUnlocked(user: any, _hasAdminAccess: boolean, requiredBadgeId?: string): boolean {
	if (!requiredBadgeId) return true;
	const unlocked: string[] = Array.isArray(user?.credits?.unlockedBadges) ? user.credits.unlockedBadges : [];
	if (unlocked.includes(requiredBadgeId)) return true;
	const parentBundle = CHILD_TO_PARENT_BUNDLE[requiredBadgeId];
	if (parentBundle && unlocked.includes(parentBundle)) return true;
	return false;
}
