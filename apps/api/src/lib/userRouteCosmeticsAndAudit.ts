/** @format */

import { NextRequest } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

const COSMETIC_PARENTS_MAP: Record<string, string[]> = {
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

export async function updateUserAppearanceCreditsAndLevel(params: { models: any; resolvedId: string; appearance: any; credits: any; level: any }): Promise<{
	existingCredits: any;
	existingLevel: any;
	updatedAppearance: any;
	updatedCredits: any;
	updatedLevel: any;
}> {
	const { models, resolvedId, appearance, credits, level } = params;

	const existingCredits = (await models.users.Credit.findOne({ ownerId: resolvedId }).lean()) as any;
	const effectiveUnlockedBadges: string[] = Array.isArray(credits?.unlockedBadges)
		? credits.unlockedBadges.map(String)
		: Array.isArray(existingCredits?.unlockedBadges)
			? existingCredits.unlockedBadges.map(String)
			: [];

	const hasCosmeticBadge = (reqBadge?: string) => {
		if (!reqBadge) return true;
		if (effectiveUnlockedBadges.includes(reqBadge)) return true;
		const parents = COSMETIC_PARENTS_MAP[reqBadge];
		return Boolean(parents && parents.some((p) => effectiveUnlockedBadges.includes(p)));
	};

	let updatedAppearance: any = null;
	if (appearance) {
		const { uiPreferences, _id: _aId, __v: _aV, createdAt: _aCreated, updatedAt: _aUpdated, ownerId: _aOwner, ...restAppearance } = appearance;
		const appearanceUpdate: Record<string, any> = { ...restAppearance };
		if (uiPreferences && typeof uiPreferences === 'object') {
			const typeUnlock: Record<string, string> = {
				orbit: 'dot_matrix_orbit',
				vortex: 'dot_matrix_vortex',
				helix: 'dot_matrix_helix',
				prism: 'dot_matrix_prism',
				infinity: 'dot_matrix_infinity',
				wavegrid: 'dot_matrix_wavegrid',
				chronos: 'dot_matrix_chronos',
				supernova: 'dot_matrix_supernova',
				tesseract: 'dot_matrix_tesseract',
				synthwave: 'dot_matrix_synthwave',
				lotus: 'dot_matrix_lotus',
			};
			const renderUnlock: Record<string, string> = {
				constellation: 'stage_constellation',
				hexgrid: 'stage_hexgrid',
				aurora: 'stage_aurora',
				glyphs: 'stage_glyphs',
			};
			const wcUnlock: Record<string, string> = {
				capsule: 'window_styles_pack',
				squircle: 'window_styles_pack',
				minimal: 'window_styles_pack',
			};
			const iconUnlock: Record<string, string> = {
				duotone: 'ui_icon_packs',
				bold: 'ui_icon_packs',
				precision: 'ui_icon_packs',
			};
			const sceneUnlock: Record<string, string> = {
				mesh_lava: 'ambient_mesh_lava',
				cyber_grid: 'ambient_cyber_grid',
				topography: 'ambient_topography',
				nebula_cosmos: 'ambient_nebula_cosmos',
				prism_caustics: 'ambient_prism_caustics',
			};
			const surfUnlock: Record<string, string> = {
				crystal: 'surface_crystal',
				holographic: 'surface_holographic',
				neon: 'surface_neon',
				obsidian: 'surface_obsidian',
			};
			const fxUnlock: Record<string, string> = {
				starlight_trail: 'cursor_starlight_trail',
				plasma_sparks: 'cursor_plasma_sparks',
				cyber_reticle: 'cursor_cyber_reticle',
				sonic_rings: 'cursor_sonic_rings',
				aurora_ribbon: 'cursor_aurora_ribbon',
			};
			const skinUnlock: Record<string, string> = {
				hud_tactical: 'skin_hud_tactical',
				frosted_prism: 'skin_frosted_prism',
				neon_arcade: 'skin_neon_arcade',
				minimal_pill: 'skin_minimal_pill',
			};

			for (const [k, rawVal] of Object.entries(uiPreferences)) {
				let v = rawVal;
				if (k === 'dotMatrixType' && typeof v === 'string' && !hasCosmeticBadge(typeUnlock[v])) v = 'default';
				if (k === 'dotMatrixRenderStyle' && typeof v === 'string' && !hasCosmeticBadge(renderUnlock[v])) v = 'dots';
				if (k === 'windowControls' && typeof v === 'string' && !hasCosmeticBadge(wcUnlock[v])) v = 'system';
				if (k === 'uiIconStyle' && typeof v === 'string' && !hasCosmeticBadge(iconUnlock[v])) v = 'standard';
				if (k === 'ambientScene' && typeof v === 'string' && !hasCosmeticBadge(sceneUnlock[v])) v = 'default';
				if (k === 'surfaceStyle' && typeof v === 'string' && !hasCosmeticBadge(surfUnlock[v])) v = 'default';
				if (k === 'cursorFx' && typeof v === 'string' && !hasCosmeticBadge(fxUnlock[v])) v = 'default';
				if (k === 'overlaySkin' && typeof v === 'string' && !hasCosmeticBadge(skinUnlock[v])) v = 'default';
				appearanceUpdate[`uiPreferences.${k}`] = v;
			}
		}
		updatedAppearance = await models.users.Appearance.findOneAndUpdate({ ownerId: resolvedId }, { $set: appearanceUpdate }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
	} else {
		updatedAppearance = await models.users.Appearance.findOne({ ownerId: resolvedId }).lean();
	}

	let updatedCredits: any = null;
	if (credits) {
		const { _id: _cId, __v: _cV, createdAt: _cCreated, updatedAt: _cUpdated, ownerId: _cOwner, ...cleanCredits } = credits;
		if (cleanCredits.profileCosmetics && typeof cleanCredits.profileCosmetics === 'object') {
			const frameUnlock: Record<string, string> = {
				plasma_ring: 'frame_plasma_ring',
				holo_crown: 'frame_holo_crown',
				cyber_hex: 'frame_cyber_hex',
				solar_flare: 'frame_solar_flare',
			};
			const npUnlock: Record<string, string> = {
				aurora_wave: 'nameplate_aurora_wave',
				synth_horizon: 'nameplate_synth_horizon',
				nebula_shimmer: 'nameplate_nebula_shimmer',
				cyber_circuit: 'nameplate_cyber_circuit',
			};
			const cardUnlock: Record<string, string> = {
				holographic: 'nameplate_aurora_wave',
				celestial: 'nameplate_synth_horizon',
				cyber_neon: 'nameplate_nebula_shimmer',
				obsidian_gold: 'nameplate_cyber_circuit',
			};
			const reqFrame = String(cleanCredits.profileCosmetics.avatarFrame || 'none');
			const reqNp = String(cleanCredits.profileCosmetics.nameplate || 'none');
			const reqCard = String(cleanCredits.profileCosmetics.cardTheme || 'default');
			cleanCredits.profileCosmetics = {
				avatarFrame: hasCosmeticBadge(frameUnlock[reqFrame]) ? reqFrame : 'none',
				nameplate: hasCosmeticBadge(npUnlock[reqNp]) ? reqNp : 'none',
				cardTheme: hasCosmeticBadge(cardUnlock[reqCard]) ? reqCard : 'default',
			};
		}
		if (cleanCredits.dotMatrixVariant !== undefined) {
			if (!hasCosmeticBadge('dot_matrix_banner')) {
				cleanCredits.dotMatrixVariant = existingCredits?.dotMatrixVariant || 'orbit';
			}
		}
		updatedCredits = await models.users.Credit.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanCredits }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
	} else {
		updatedCredits = existingCredits;
	}

	const existingLevel = level ? await models.users.Level.findOne({ ownerId: resolvedId }).lean() : null;
	let updatedLevel: any = null;
	if (level) {
		const { _id: _lId, __v: _lV, createdAt: _lCreated, updatedAt: _lUpdated, ownerId: _lOwner, ...cleanLevel } = level;
		updatedLevel = await models.users.Level.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanLevel }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
	} else {
		updatedLevel = await models.users.Level.findOne({ ownerId: resolvedId }).lean();
	}

	return {
		existingCredits,
		existingLevel,
		updatedAppearance,
		updatedCredits,
		updatedLevel,
	};
}

export async function syncVirtueAndRecordUserUpdateAudit(params: {
	req: NextRequest;
	resolvedId: string;
	existingDoc: any;
	updatedUser: any;
	userBody: Record<string, any>;
	unsetFields: Record<string, 1>;
	addedRoles: string[];
	removedRoles: string[];
	credits: any;
	existingCredits: any;
	updatedCredits: any;
	level: any;
	existingLevel: any;
	updatedLevel: any;
}): Promise<void> {
	const { req, resolvedId, existingDoc, updatedUser, userBody, unsetFields, addedRoles, removedRoles, credits, existingCredits, updatedCredits, level, existingLevel, updatedLevel } = params;

	const changes: string[] = [];
	const metaChanges: Record<string, any> = {};

	if (userBody.name !== undefined && (existingDoc?.name || null) !== (updatedUser.name || null)) {
		changes.push(`name: "${existingDoc?.name || ''}" → "${updatedUser.name || ''}"`);
		metaChanges.name = updatedUser.name || null;
	}
	if (userBody.privacy !== undefined && (existingDoc?.privacy || 'public') !== (updatedUser.privacy || 'public')) {
		changes.push(`privacy: ${existingDoc?.privacy || 'public'} → ${updatedUser.privacy}`);
		metaChanges.privacy = updatedUser.privacy;
	}
	if (userBody.description !== undefined && (existingDoc?.description || null) !== (updatedUser.description || null)) {
		changes.push('description updated');
		metaChanges.descriptionUpdated = true;
	}
	if (userBody.info !== undefined && (existingDoc?.info || null) !== (updatedUser.info || null)) {
		changes.push('info updated');
		metaChanges.infoUpdated = true;
	}
	if (typeof userBody.verified === 'boolean' && Boolean(existingDoc?.verified) !== Boolean(updatedUser.verified)) {
		changes.push(`verified: ${updatedUser.verified ? 'true' : 'false'}`);
		metaChanges.verified = Boolean(updatedUser.verified);
	}
	if (typeof userBody.blacklisted === 'boolean' && Boolean((existingDoc as any)?.blacklisted) !== Boolean((updatedUser as any).blacklisted)) {
		changes.push(`blacklisted: ${(updatedUser as any).blacklisted ? 'true' : 'false'}`);
		metaChanges.blacklisted = Boolean((updatedUser as any).blacklisted);
	}
	if (typeof userBody.services === 'boolean' && ((existingDoc as any)?.services !== false) !== ((updatedUser as any).services !== false)) {
		changes.push(`services: ${(updatedUser as any).services !== false ? 'enabled' : 'disabled'}`);
		metaChanges.services = (updatedUser as any).services !== false;
	}
	if (typeof userBody.services === 'boolean' || typeof userBody.blacklisted === 'boolean') {
		try {
			const virtueDb = await database('virtue');
			const VUserModel = (virtueDb.models.profiles as any)?.User;
			if (VUserModel) {
				const virtueSync: Record<string, any> = {};
				if (typeof userBody.services === 'boolean') virtueSync.services = userBody.services;
				if (typeof userBody.blacklisted === 'boolean') virtueSync.blacklisted = userBody.blacklisted;
				await VUserModel.updateOne({ id: resolvedId }, { $set: virtueSync }).catch(() => null);
			}
		} catch {}
	}
	if (typeof userBody.widgets === 'boolean' && Boolean((existingDoc as any)?.widgets) !== Boolean((updatedUser as any).widgets)) {
		changes.push(`widgets: ${(updatedUser as any).widgets ? 'enabled' : 'disabled'}`);
		metaChanges.widgets = Boolean((updatedUser as any).widgets);
	}
	if (userBody.email !== undefined && (existingDoc?.email || '') !== (updatedUser.email || '')) {
		changes.push(`email: "${existingDoc?.email || ''}" → "${updatedUser.email || ''}"`);
		metaChanges.email = updatedUser.email || '';
	}
	if (userBody.icon !== undefined && (existingDoc?.icon || '') !== (updatedUser.icon || '')) {
		changes.push('avatar URL updated');
		metaChanges.icon = updatedUser.icon || '';
	}
	if (Array.isArray(userBody.showcases) && (existingDoc?.showcases?.length || 0) !== (updatedUser.showcases?.length || 0)) {
		changes.push(`showcases: ${existingDoc?.showcases?.length || 0} → ${updatedUser.showcases?.length || 0}`);
		metaChanges.showcasesCount = updatedUser.showcases?.length || 0;
	}
	if (Array.isArray(userBody.connections) && (existingDoc?.connections?.length || 0) !== (updatedUser.connections?.length || 0)) {
		changes.push(`connections: ${existingDoc?.connections?.length || 0} → ${updatedUser.connections?.length || 0}`);
		metaChanges.connectionsCount = updatedUser.connections?.length || 0;
	}
	if (Array.isArray(userBody.devices) && (existingDoc?.devices?.length || 0) !== (updatedUser.devices?.length || 0)) {
		changes.push(`devices: ${existingDoc?.devices?.length || 0} → ${updatedUser.devices?.length || 0}`);
		metaChanges.devicesCount = updatedUser.devices?.length || 0;
	}
	if (userBody.stripeCustomerId !== undefined && ((existingDoc as any)?.stripeCustomerId || null) !== ((updatedUser as any).stripeCustomerId || null)) {
		changes.push(`stripeCustomerId: ${(existingDoc as any)?.stripeCustomerId || 'none'} → ${(updatedUser as any).stripeCustomerId || 'none'}`);
		metaChanges.stripeCustomerId = (updatedUser as any).stripeCustomerId || null;
	}
	if (typeof userBody.staffSubscription === 'boolean' && Boolean((existingDoc as any)?.staffSubscription) !== userBody.staffSubscription) {
		changes.push(`staffSubscription: ${userBody.staffSubscription ? 'enabled' : 'disabled'}`);
		metaChanges.staffSubscription = userBody.staffSubscription;
	}
	if ((userBody.vanitySlug !== undefined || unsetFields.vanitySlug) && (existingDoc?.vanitySlug || '') !== (updatedUser.vanitySlug || '')) {
		changes.push(`vanitySlug: "${existingDoc?.vanitySlug || ''}" → "${updatedUser.vanitySlug || ''}"`);
		metaChanges.vanitySlug = updatedUser.vanitySlug || '';
	}
	if (addedRoles.length > 0) {
		changes.push(`roles +[${addedRoles.join(', ')}]`);
		metaChanges.rolesAdded = addedRoles.join(', ');
	}
	if (removedRoles.length > 0) {
		changes.push(`roles -[${removedRoles.join(', ')}]`);
		metaChanges.rolesRemoved = removedRoles.join(', ');
	}
	if (credits) {
		const oldBalance = Number((existingCredits as any)?.balance) || 0;
		const newBalance = Number(updatedCredits?.balance) || 0;
		const oldStreak = Number((existingCredits as any)?.streak) || 0;
		const newStreak = Number(updatedCredits?.streak) || 0;
		if (credits.balance !== undefined && oldBalance !== newBalance) {
			changes.push(`credits: ${oldBalance} → ${newBalance}`);
			metaChanges.creditsBalance = `${oldBalance} → ${newBalance}`;
		}
		if (credits.streak !== undefined && oldStreak !== newStreak) {
			changes.push(`streak: ${oldStreak} → ${newStreak}`);
			metaChanges.creditsStreak = `${oldStreak} → ${newStreak}`;
		}
		const slotKeys = ['streakShields', 'extraBotSlots', 'extraCdnSlots', 'extraShowcaseSlots', 'extraVanitySlots', 'totalSpent'] as const;
		for (const sk of slotKeys) {
			if ((credits as any)[sk] !== undefined) {
				const oldVal = Number((existingCredits as any)?.[sk]) || 0;
				const newVal = Number((updatedCredits as any)?.[sk]) || 0;
				if (oldVal !== newVal) {
					changes.push(`${sk}: ${oldVal} → ${newVal}`);
					metaChanges[sk] = `${oldVal} → ${newVal}`;
				}
			}
		}
		if (Array.isArray(credits.unlockedBadges)) {
			const oldB = ((existingCredits as any)?.unlockedBadges || []).join(',');
			const newB = (updatedCredits?.unlockedBadges || []).join(',');
			if (oldB !== newB) {
				changes.push(`unlockedBadges: [${newB}]`);
				metaChanges.unlockedBadges = updatedCredits?.unlockedBadges || [];
			}
		}
	}
	if (level) {
		const oldLvl = Number((existingLevel as any)?.level) || 1;
		const newLvl = Number(updatedLevel?.level) || 1;
		const oldXp = Number((existingLevel as any)?.xp) || 0;
		const newXp = Number(updatedLevel?.xp) || 0;
		if (level.level !== undefined && oldLvl !== newLvl) {
			changes.push(`level: ${oldLvl} → ${newLvl}`);
			metaChanges.globalLevel = `${oldLvl} → ${newLvl}`;
		}
		if (level.xp !== undefined && oldXp !== newXp) {
			changes.push(`xp: ${oldXp} → ${newXp}`);
			metaChanges.globalXp = `${oldXp} → ${newXp}`;
		}
	}

	if (changes.length > 0) {
		await recordAuditLog(req, {
			action: 'user.update',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Updated user "${updatedUser.name || resolvedId}" (${changes.join(', ')})`,
			metadata: metaChanges,
		});
	}
}
