/** @format */

import { DEFAULT_STORE_CURRENCY, formatStorePrice } from './formatStorePrice';

export { DEFAULT_STORE_CURRENCY, formatStorePrice };

export interface UserSubscription {
	stripeSubscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodEnd: string;
}

export interface CatalogPrice {
	id: string;
	unitAmount: number;
	discountedAmount?: number;
	currency: string;
	interval: 'month' | 'year' | 'week' | 'day';
	intervalCount: number;
}

export interface CatalogCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	order: number;
	enabled?: boolean;
}

export interface CatalogItem {
	id: string;
	name: string;
	description: string;
	categoryId: string;
	skuId: string;
	itemType?: 'subscription' | 'credit_pack' | 'credit_perk';
	creditCost?: number;
	creditAmount?: number;
	perkType?:
		| 'none'
		| 'cdn_slots'
		| 'showcase_slots'
		| 'bot_slots'
		| 'vanity_url'
		| 'trial_pass'
		| 'vanity_badge'
		| 'streak_shield'
		| 'boost_bot'
		| 'boost_server'
		| 'dot_matrix'
		| 'stage_style'
		| 'ambient_scene'
		| 'surface_style'
		| 'profile_cosmetic'
		| 'cursor_fx'
		| 'overlay_skin'
		| 'icon_pack'
		| 'window_style';
	perkValue?: any;
	durationDays?: number;
	features: string[];
	badge?: string | null;
	discountPercent: number;
	isFeatured: boolean;
	enabled: boolean;
	order: number;
	stripeName?: string;
	stripeDescription?: string | null;
	discordSku?: {
		skuId: string;
		applicationId: string;
		slug?: string | null;
		summary?: string | null;
		storeUrl: string;
		thumbnailUrl?: string | null;
		bannerUrl?: string | null;
		appIconUrl?: string | null;
		benefits?: {
			id: string;
			name: string;
			description: string;
			emoji?: string | null;
		}[];
		hasEntitlement?: boolean;
		entitlementEndsAt?: string | null;
	} | null;
	prices: CatalogPrice[];
}

export type StripePrice = CatalogPrice;

export interface ProductData {
	name: string;
	description: string | null;
	prices: CatalogPrice[];
}

export const BUNDLE_CHILDREN_MAP: Record<string, string[]> = {
	dot_matrix_banner: [
		'dot_matrix_orbit',
		'dot_matrix_vortex',
		'dot_matrix_helix',
		'dot_matrix_prism',
		'dot_matrix_infinity',
		'dot_matrix_wavegrid',
		'dot_matrix_chronos',
		'dot_matrix_supernova',
		'dot_matrix_tesseract',
		'dot_matrix_synthwave',
		'dot_matrix_lotus',
	],
	stage_styles_pack: ['stage_constellation', 'stage_hexgrid', 'stage_aurora', 'stage_glyphs'],
	ambient_scenes_pack: ['ambient_mesh_lava', 'ambient_cyber_grid', 'ambient_topography', 'ambient_nebula_cosmos', 'ambient_prism_caustics'],
	surface_styles_pack: ['surface_crystal', 'surface_holographic', 'surface_neon', 'surface_obsidian'],
	profile_frames_pack: ['frame_plasma_ring', 'frame_holo_crown', 'frame_cyber_hex', 'frame_solar_flare'],
	profile_nameplates_pack: ['nameplate_aurora_wave', 'nameplate_synth_horizon', 'nameplate_nebula_shimmer', 'nameplate_cyber_circuit'],
	cursor_fx_bundle: ['cursor_starlight_trail', 'cursor_plasma_sparks', 'cursor_cyber_reticle', 'cursor_sonic_rings', 'cursor_aurora_ribbon'],
	overlay_skins_bundle: ['skin_hud_tactical', 'skin_frosted_prism', 'skin_neon_arcade', 'skin_minimal_pill'],
};

export const COSMETIC_PARENT_UNLOCKS: Record<string, string[]> = {
	dot_matrix_orbit: ['dot_matrix_banner'],
	dot_matrix_vortex: ['dot_matrix_banner'],
	dot_matrix_helix: ['dot_matrix_banner'],
	dot_matrix_prism: ['dot_matrix_banner'],
	dot_matrix_infinity: ['dot_matrix_banner'],
	dot_matrix_wavegrid: ['dot_matrix_banner'],
	dot_matrix_chronos: ['dot_matrix_banner', 'stage_constellation', 'stage_styles_pack'],
	dot_matrix_supernova: ['dot_matrix_banner', 'stage_constellation', 'stage_styles_pack'],
	dot_matrix_tesseract: ['dot_matrix_banner', 'stage_hexgrid', 'stage_styles_pack'],
	dot_matrix_synthwave: ['dot_matrix_banner', 'stage_aurora', 'stage_styles_pack'],
	dot_matrix_lotus: ['dot_matrix_banner', 'stage_glyphs', 'stage_styles_pack'],
	stage_constellation: ['stage_styles_pack'],
	stage_hexgrid: ['stage_styles_pack'],
	stage_aurora: ['stage_styles_pack'],
	stage_glyphs: ['stage_styles_pack'],
	ambient_mesh_lava: ['ambient_scenes_pack'],
	ambient_cyber_grid: ['ambient_scenes_pack'],
	ambient_topography: ['ambient_scenes_pack'],
	ambient_nebula_cosmos: ['ambient_scenes_pack'],
	ambient_prism_caustics: ['ambient_scenes_pack'],
	surface_crystal: ['surface_styles_pack'],
	surface_holographic: ['surface_styles_pack'],
	surface_neon: ['surface_styles_pack'],
	surface_obsidian: ['surface_styles_pack'],
	frame_plasma_ring: ['profile_frames_pack'],
	frame_holo_crown: ['profile_frames_pack'],
	frame_cyber_hex: ['profile_frames_pack'],
	frame_solar_flare: ['profile_frames_pack'],
	nameplate_aurora_wave: ['profile_nameplates_pack'],
	nameplate_synth_horizon: ['profile_nameplates_pack'],
	nameplate_nebula_shimmer: ['profile_nameplates_pack'],
	nameplate_cyber_circuit: ['profile_nameplates_pack'],
	cursor_starlight_trail: ['cursor_fx_bundle'],
	cursor_plasma_sparks: ['cursor_fx_bundle'],
	cursor_cyber_reticle: ['cursor_fx_bundle'],
	cursor_sonic_rings: ['cursor_fx_bundle'],
	cursor_aurora_ribbon: ['cursor_fx_bundle'],
	skin_hud_tactical: ['overlay_skins_bundle'],
	skin_frosted_prism: ['overlay_skins_bundle'],
	skin_neon_arcade: ['overlay_skins_bundle'],
	skin_minimal_pill: ['overlay_skins_bundle'],
};

export const CHILD_TO_BUNDLE: Record<string, string> = Object.fromEntries(Object.entries(COSMETIC_PARENT_UNLOCKS).map(([child, parents]) => [child, parents[0]]));

export const FALLBACK_EUR_PRICES: Record<string, string> = {
	'credits-500': formatStorePrice(5, 'EUR'),
	'credits-1200': formatStorePrice(10, 'EUR'),
	'credits-3250': formatStorePrice(25, 'EUR'),
	'credits-7000': formatStorePrice(50, 'EUR'),
};
