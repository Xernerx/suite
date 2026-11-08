/** @format */

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
		storeUrl: string;
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

export const CHILD_TO_BUNDLE: Record<string, string> = {
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

export const FALLBACK_EUR_PRICES: Record<string, string> = {
	'credits-500': '€5.00',
	'credits-1200': '€10.00',
	'credits-3250': '€25.00',
	'credits-7000': '€50.00',
};
