/** @format */

import crypto from 'crypto';
import { database } from './database';

export interface GiveawayEligibilityOptions {
	memberRoleIds?: string[];
	username?: string;
	avatar?: string;
}

export interface GiveawayEligibilityResult {
	eligible: boolean;
	reasons: string[];
	weight: number;
	matchedBonuses: Array<{ label: string; extraEntries: number }>;
	userSnapshot: {
		username: string;
		avatar: string;
	};
	profileStats: {
		hasAccount: boolean;
		verified: boolean;
		hasActivePass: boolean;
		globalLevel: number;
		streak: number;
		totalSpent: number;
		memberRoleIds: string[];
		ownedBadges: string[];
	};
}

const BUNDLE_CHILD_UNLOCKS: Record<string, string[]> = {
	ambient_scenes_pack: ['ambient_mesh_lava', 'ambient_cyber_grid', 'ambient_topography', 'ambient_nebula_cosmos', 'ambient_prism_caustics'],
	surface_styles_pack: ['surface_crystal', 'surface_holographic', 'surface_neon', 'surface_obsidian'],
	profile_frames_pack: ['frame_plasma_ring', 'frame_holo_crown', 'frame_cyber_hex', 'frame_solar_flare'],
	profile_nameplates_pack: ['nameplate_aurora_wave', 'nameplate_synth_horizon', 'nameplate_nebula_shimmer', 'nameplate_cyber_circuit'],
	cursor_fx_bundle: ['cursor_starlight_trail', 'cursor_plasma_sparks', 'cursor_cyber_reticle', 'cursor_sonic_rings', 'cursor_aurora_ribbon'],
	overlay_skins_bundle: ['skin_hud_tactical', 'skin_frosted_prism', 'skin_neon_arcade', 'skin_minimal_pill'],
};

function getBotTokens(): string[] {
	return Array.from(new Set([process.env.DISCORD_CLIENT_TOKEN, process.env.DISCORD_BOT_TOKEN].map((t) => String(t || '').trim()).filter(Boolean)));
}

async function discordApiFetch(path: string, init?: RequestInit): Promise<Response | null> {
	const tokens = getBotTokens();
	for (const token of tokens) {
		try {
			const res = await fetch(`https://discord.com/api/v10${path}`, {
				...init,
				headers: {
					Authorization: `Bot ${token}`,
					'Content-Type': 'application/json',
					...(init?.headers || {}),
				},
			});
			if (res.ok || (res.status !== 401 && res.status !== 403 && res.status !== 404)) {
				return res;
			}
		} catch {
			// Try next token
		}
	}
	return null;
}

export async function fetchDiscordMemberInfo(guildId: string, userId: string): Promise<{ roles: string[]; username?: string; avatar?: string; inGuild: boolean }> {
	if (!guildId || !userId) return { roles: [], inGuild: false };
	const res = await discordApiFetch(`/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`);
	if (!res || !res.ok) return { roles: [], inGuild: false };
	try {
		const data = (await res.json()) as any;
		const userObj = data?.user || {};
		const username = userObj.global_name || data?.nick || userObj.username || '';
		const avatarHash = data?.avatar || userObj.avatar;
		const avatar = avatarHash ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${String(avatarHash).startsWith('a_') ? 'gif' : 'png'}?size=128` : '';
		return {
			roles: Array.isArray(data?.roles) ? data.roles.map(String) : [],
			username,
			avatar,
			inGuild: true,
		};
	} catch {
		return { roles: [], inGuild: false };
	}
}

export async function evaluateGiveawayEligibility(giveaway: any, userId: string, options?: GiveawayEligibilityOptions): Promise<GiveawayEligibilityResult> {
	const db = await database('xernerx');
	const UserModel = (db.models.users as any)?.User;
	const LevelModel = (db.models.users as any)?.Level;
	const CreditModel = (db.models.users as any)?.Credit;
	const SubscriptionModel = (db.models.users as any)?.Subscription;
	const SettingModel = (db.models.core as any)?.Setting;

	const [userDoc, levelDoc, creditDoc, subDocs, adminServerSetting] = await Promise.all([
		UserModel
			? UserModel.findOne({ id: userId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		LevelModel
			? LevelModel.findOne({ ownerId: userId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		CreditModel
			? CreditModel.findOne({ ownerId: userId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		SubscriptionModel
			? SubscriptionModel.find({
					ownerId: userId,
					status: { $in: ['active', 'trialing'] },
				})
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		SettingModel
			? SettingModel.findOne({ id: 'admin_server_id' })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
	]);

	let virtueGlobalLevel = 0;
	try {
		const virtueDb = await database('virtue');
		const VirtueLevelModel = (virtueDb.models.levels as any)?.Level;
		if (VirtueLevelModel) {
			const vDoc = await VirtueLevelModel.findOne({ id: userId })
				.lean()
				.catch(() => null);
			if (vDoc && typeof vDoc.level === 'number') {
				virtueGlobalLevel = vDoc.level;
			}
		}
	} catch {
		// Ignore virtue DB fallback errors
	}

	const resolvedGuildId = String(giveaway?.guildId || adminServerSetting?.value || '687429190165069838');
	let memberRoleIds = Array.isArray(options?.memberRoleIds) ? options!.memberRoleIds.map(String) : [];
	let fetchedUsername = options?.username || '';
	let fetchedAvatar = options?.avatar || '';

	const reqs = giveaway?.requirements || {};
	const bonusRules = Array.isArray(giveaway?.bonusEntries) ? giveaway.bonusEntries : [];
	const needsDiscordRoles =
		(Array.isArray(reqs.requiredDiscordRoleIds) && reqs.requiredDiscordRoleIds.length > 0) ||
		(Array.isArray(reqs.excludedDiscordRoleIds) && reqs.excludedDiscordRoleIds.length > 0) ||
		bonusRules.some((b: any) => b?.type === 'discord_role' && b?.targetId);

	if (!options?.memberRoleIds && (needsDiscordRoles || !userDoc)) {
		const memberInfo = await fetchDiscordMemberInfo(resolvedGuildId, userId);
		memberRoleIds = memberInfo.roles;
		if (!fetchedUsername && memberInfo.username) fetchedUsername = memberInfo.username;
		if (!fetchedAvatar && memberInfo.avatar) fetchedAvatar = memberInfo.avatar;
	}

	const nowMs = Date.now();
	const activeSubDocs = Array.isArray(subDocs) ? subDocs.filter((s: any) => !s?.currentPeriodEnd || new Date(s.currentPeriodEnd).getTime() > nowMs) : [];
	const hasActivePass = Boolean(userDoc?.staffSubscription || activeSubDocs.length > 0);
	const hasAccount = Boolean(userDoc);
	const verified = Boolean(userDoc?.verified);
	const globalLevel = Math.max(Number(levelDoc?.level) || 0, virtueGlobalLevel, hasAccount ? 1 : 0);
	const streak = Number(creditDoc?.streak) || 0;
	const totalSpent = Number(creditDoc?.totalSpent) || 0;

	const ownedBadgesSet = new Set<string>([
		...(Array.isArray(creditDoc?.unlockedBadges) ? creditDoc.unlockedBadges.map(String) : []),
		...(Array.isArray(creditDoc?.activeBadges) ? creditDoc.activeBadges.map(String) : []),
		...activeSubDocs.map((s: any) => String(s?.priceId || '')).filter(Boolean),
	]);
	if ((creditDoc?.extraCdnSlots || 0) > 0) ownedBadgesSet.add('cdn_slots');
	if ((creditDoc?.extraShowcaseSlots || 0) > 0) ownedBadgesSet.add('showcase_slots');
	if ((creditDoc?.extraVanitySlots || 0) > 0 || userDoc?.vanityUnlocked) ownedBadgesSet.add('vanity_url');
	if ((creditDoc?.extraBotSlots || 0) > 0) ownedBadgesSet.add('bot_slots');
	if ((creditDoc?.streakShields || 0) > 0) ownedBadgesSet.add('streak_shield');

	const reasons: string[] = [];

	if (reqs.requireAccount && !hasAccount) {
		reasons.push('Xernerx account required');
	}
	if (reqs.requireVerified && !verified) {
		reasons.push('Verified profile required');
	}
	if (reqs.requireActivePass && !hasActivePass) {
		reasons.push('Active Pass required');
	}
	if ((Number(reqs.minGlobalLevel) || 0) > 0 && globalLevel < Number(reqs.minGlobalLevel)) {
		reasons.push(`Global Level ${reqs.minGlobalLevel}+ (Currently Lv. ${globalLevel})`);
	}
	if ((Number(reqs.minStreak) || 0) > 0 && streak < Number(reqs.minStreak)) {
		reasons.push(`${reqs.minStreak}d Streak+ (Currently ${streak}d)`);
	}
	if ((Number(reqs.minTotalSpent) || 0) > 0 && totalSpent < Number(reqs.minTotalSpent)) {
		reasons.push(`${Number(reqs.minTotalSpent).toLocaleString()}+ Credits spent (Currently ${totalSpent.toLocaleString()})`);
	}

	const excludedRoles: string[] = Array.isArray(reqs.excludedDiscordRoleIds) ? reqs.excludedDiscordRoleIds.filter(Boolean).map(String) : [];
	if (excludedRoles.length > 0 && excludedRoles.some((rId) => memberRoleIds.includes(rId))) {
		reasons.push('Excluded Discord role');
	}

	const requiredRoles: string[] = Array.isArray(reqs.requiredDiscordRoleIds) ? reqs.requiredDiscordRoleIds.filter(Boolean).map(String) : [];
	if (requiredRoles.length > 0) {
		const mode = reqs.roleMatchMode === 'all' ? 'all' : 'any';
		const matchesRoles = mode === 'all' ? requiredRoles.every((rId) => memberRoleIds.includes(rId)) : requiredRoles.some((rId) => memberRoleIds.includes(rId));
		if (!matchesRoles) {
			const roleMentions = requiredRoles.map((id) => `<@&${id}>`).join(mode === 'all' ? ' & ' : ' / ');
			reasons.push(`Required Role: ${roleMentions}`);
		}
	}

	const requiredItems: string[] = Array.isArray(reqs.requiredBadgeOrItemIds) ? reqs.requiredBadgeOrItemIds.filter(Boolean).map(String) : [];
	if (requiredItems.length > 0) {
		const hasRequiredItem = requiredItems.some((itemId) => ownedBadgesSet.has(itemId));
		if (!hasRequiredItem) {
			reasons.push(`Required Item: ${requiredItems.join(', ')}`);
		}
	}

	let weight = 1;
	const matchedBonuses: Array<{ label: string; extraEntries: number }> = [];
	for (const rule of bonusRules) {
		const extra = Math.max(0, Number(rule?.extraEntries) || 0);
		if (extra <= 0) continue;

		if (rule.type === 'active_pass' && hasActivePass) {
			weight += extra;
			matchedBonuses.push({ label: rule.label || 'Active Pass Subscriber', extraEntries: extra });
		} else if (rule.type === 'verified' && verified) {
			weight += extra;
			matchedBonuses.push({ label: rule.label || 'Verified Xernerx Profile', extraEntries: extra });
		} else if (rule.type === 'discord_role' && rule.targetId && memberRoleIds.includes(String(rule.targetId))) {
			weight += extra;
			matchedBonuses.push({ label: rule.label || `Discord Role`, extraEntries: extra });
		} else if (rule.type === 'badge_or_item' && rule.targetId && ownedBadgesSet.has(String(rule.targetId))) {
			weight += extra;
			matchedBonuses.push({ label: rule.label || `Item Holder (${rule.targetId})`, extraEntries: extra });
		} else if (rule.type === 'global_level' && (Number(rule.targetId) || 0) > 0 && globalLevel >= Number(rule.targetId)) {
			weight += extra;
			matchedBonuses.push({ label: rule.label || `Global Level ${rule.targetId}+`, extraEntries: extra });
		}
	}

	const username = fetchedUsername || userDoc?.discordCache?.globalName || userDoc?.name || userDoc?.discordCache?.username || `User ${userId.slice(-4)}`;
	const avatar = fetchedAvatar || userDoc?.discordCache?.avatarUrl || userDoc?.icon || '';

	return {
		eligible: reasons.length === 0,
		reasons,
		weight,
		matchedBonuses,
		userSnapshot: { username, avatar },
		profileStats: {
			hasAccount,
			verified,
			hasActivePass,
			globalLevel,
			streak,
			totalSpent,
			memberRoleIds,
			ownedBadges: Array.from(ownedBadgesSet),
		},
	};
}

export function buildGiveawayDiscordPayload(giveaway: any): Record<string, any> {
	const entries = Array.isArray(giveaway?.entries) ? giveaway.entries : [];
	const winners = Array.isArray(giveaway?.winners) ? giveaway.winners : [];
	const endsUnix = giveaway?.endsAt ? Math.floor(new Date(giveaway.endsAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
	const isEnded = giveaway?.status === 'ended' || giveaway?.status === 'cancelled';
	const isCancelled = giveaway?.status === 'cancelled';

	const reqItems: string[] = [];
	const reqs = giveaway?.requirements || {};
	if ((Number(reqs.minGlobalLevel) || 0) > 0) reqItems.push(`Level ${reqs.minGlobalLevel}+`);
	if (reqs.requireAccount) reqItems.push('Xernerx Account');
	if (reqs.requireVerified) reqItems.push('Verified Profile');
	if (reqs.requireActivePass) reqItems.push('Active Pass');
	if ((Number(reqs.minStreak) || 0) > 0) reqItems.push(`${reqs.minStreak}d Streak+`);
	if ((Number(reqs.minTotalSpent) || 0) > 0) reqItems.push(`${Number(reqs.minTotalSpent).toLocaleString()}+ Spent`);
	if (Array.isArray(reqs.requiredDiscordRoleIds) && reqs.requiredDiscordRoleIds.length > 0) {
		const joiner = reqs.roleMatchMode === 'all' ? ' & ' : ' / ';
		reqItems.push(reqs.requiredDiscordRoleIds.map((r: string) => `<@&${r}>`).join(joiner));
	}
	if (Array.isArray(reqs.requiredBadgeOrItemIds) && reqs.requiredBadgeOrItemIds.length > 0) {
		reqItems.push(reqs.requiredBadgeOrItemIds.join(', '));
	}

	const bonusItems: string[] = [];
	if (Array.isArray(giveaway?.bonusEntries)) {
		for (const b of giveaway.bonusEntries) {
			if (!b || !b.extraEntries) continue;
			if (b.type === 'discord_role' && b.targetId) {
				bonusItems.push(`<@&${b.targetId}> (+${b.extraEntries})`);
			} else {
				bonusItems.push(`${b.label || b.type} (+${b.extraEntries})`);
			}
		}
	}

	const fields: Array<{ name: string; value: string; inline?: boolean }> = [
		{
			name: 'Prize',
			value: giveaway?.prize?.label || giveaway?.title || 'Prize',
			inline: true,
		},
		{
			name: 'Winners',
			value: String(giveaway?.winnerCount || 1),
			inline: true,
		},
		{
			name: isEnded ? 'Ended' : 'Ends',
			value: `<t:${endsUnix}:R>`,
			inline: true,
		},
	];

	if (reqItems.length > 0) {
		fields.push({
			name: 'Requirements (Checked at Draw)',
			value: reqItems.join(' • '),
			inline: false,
		});
	}

	if (bonusItems.length > 0) {
		fields.push({
			name: 'Bonus Entries',
			value: bonusItems.join(' • '),
			inline: false,
		});
	}

	if (isEnded) {
		const winnerMentions = winners.length > 0 ? winners.map((w: any) => `<@${w.userId}>`).join(', ') : isCancelled ? 'Cancelled' : 'No eligible winners drawn';
		fields.push({
			name: isCancelled ? 'Status' : 'Drawn Winners',
			value: winnerMentions,
			inline: false,
		});
	}

	const embed: Record<string, any> = {
		title: giveaway?.title || 'Xernerx Giveaway',
		...(giveaway?.description ? { description: giveaway.description } : {}),
		color: isCancelled ? 0xef4444 : isEnded ? 0x22c55e : 0x6366f1,
		fields,
		footer: {
			text: `${entries.length.toLocaleString()} ${entries.length === 1 ? 'Entry' : 'Entries'}`,
		},
		timestamp: new Date(giveaway?.endsAt || Date.now()).toISOString(),
	};

	if (giveaway?.bannerUrl && String(giveaway.bannerUrl).startsWith('http')) {
		embed.image = { url: String(giveaway.bannerUrl) };
	}

	const components = [
		{
			type: 1,
			components: [
				{
					type: 2,
					style: isEnded ? 2 : 1,
					label: isEnded ? `Ended (${entries.length.toLocaleString()})` : `Enter (${entries.length.toLocaleString()})`,
					custom_id: `giveaway:enter:${giveaway?.id}`,
					disabled: isEnded,
				},
				{
					type: 2,
					style: 2,
					label: 'My Status',
					custom_id: `giveaway:info:${giveaway?.id}`,
					disabled: false,
				},
				{
					type: 2,
					style: 5,
					label: 'Web',
					url: 'https://store.xernerx.com',
				},
			],
		},
	];

	let content = '';
	if (!isEnded && giveaway?.pingRoleId) {
		const ping = String(giveaway.pingRoleId).trim();
		if (ping === '@everyone' || ping === '@here') content = ping;
		else if (/^\d+$/.test(ping)) content = `<@&${ping}>`;
	}

	return {
		content,
		embeds: [embed],
		components,
	};
}

export async function syncGiveawayDiscordMessage(giveawayDoc: any): Promise<string | null> {
	const channelId = String(giveawayDoc?.channelId || '').trim();
	if (!channelId) return null;

	const payload = buildGiveawayDiscordPayload(giveawayDoc);
	const existingMessageId = giveawayDoc?.discordMessageId ? String(giveawayDoc.discordMessageId).trim() : '';

	if (existingMessageId) {
		const editRes = await discordApiFetch(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(existingMessageId)}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		});
		if (editRes && editRes.ok) {
			return existingMessageId;
		}
	}

	// Only post a brand new message if we don't already have one (or if creating while active)
	if (!existingMessageId && giveawayDoc?.status === 'active') {
		const postRes = await discordApiFetch(`/channels/${encodeURIComponent(channelId)}/messages`, {
			method: 'POST',
			body: JSON.stringify(payload),
		});
		if (postRes && postRes.ok) {
			const msgData = (await postRes.json().catch(() => null)) as any;
			if (msgData?.id) {
				const db = await database('xernerx');
				const GiveawayModel = (db.models.core as any)?.Giveaway;
				if (GiveawayModel) {
					await GiveawayModel.updateOne({ id: giveawayDoc.id }, { $set: { discordMessageId: String(msgData.id) } }).catch(() => null);
				}
				return String(msgData.id);
			}
		}
	}

	return existingMessageId || null;
}

export async function enterGiveaway(giveawayId: string, userId: string, source: 'discord' | 'web' = 'web', options?: GiveawayEligibilityOptions) {
	const db = await database('xernerx');
	const GiveawayModel = (db.models.core as any)?.Giveaway;
	if (!GiveawayModel) {
		return { ok: false, error: 'Giveaway model unavailable.' };
	}

	const giveaway = await GiveawayModel.findOne({ id: giveawayId }).lean();
	if (!giveaway) {
		return { ok: false, error: 'Giveaway not found.' };
	}

	const now = Date.now();
	if (giveaway.status !== 'active' || new Date(giveaway.endsAt).getTime() <= now) {
		return { ok: false, error: 'This giveaway has already ended or is not currently active.' };
	}

	const eligibility = await evaluateGiveawayEligibility(giveaway, userId, options);

	const existingEntries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
	const existingIndex = existingEntries.findIndex((e: any) => String(e.userId) === String(userId));
	const alreadyEntered = existingIndex !== -1;

	const entryObj = {
		userId: String(userId),
		username: eligibility.userSnapshot.username,
		avatar: eligibility.userSnapshot.avatar,
		weight: eligibility.weight,
		source,
		enteredAt: alreadyEntered ? existingEntries[existingIndex].enteredAt || new Date() : new Date(),
	};

	let updatedDoc: any;
	if (alreadyEntered) {
		updatedDoc = await GiveawayModel.findOneAndUpdate(
			{ id: giveawayId, 'entries.userId': String(userId) },
			{
				$set: {
					'entries.$.username': entryObj.username,
					'entries.$.avatar': entryObj.avatar,
					'entries.$.weight': entryObj.weight,
				},
			},
			{ returnDocument: 'after' }
		).lean();
	} else {
		updatedDoc = await GiveawayModel.findOneAndUpdate({ id: giveawayId, 'entries.userId': { $ne: String(userId) } }, { $push: { entries: entryObj } }, { returnDocument: 'after' }).lean();
	}

	const finalDoc = updatedDoc || giveaway;
	if (!alreadyEntered) {
		await syncGiveawayDiscordMessage(finalDoc).catch(() => null);
	}

	const allEntries = Array.isArray(finalDoc.entries) ? finalDoc.entries : [];
	const totalWeight = allEntries.reduce((sum: number, e: any) => sum + (Number(e.weight) || 1), 0);
	const winChancePercent = totalWeight > 0 ? Math.min(100, Math.round((eligibility.weight / totalWeight) * (Number(finalDoc.winnerCount) || 1) * 1000) / 10) : 100;

	return {
		ok: true,
		alreadyEntered,
		eligible: eligibility.eligible,
		reasons: eligibility.reasons,
		entry: entryObj,
		totalEntries: allEntries.length,
		totalWeight,
		winChancePercent,
		eligibility,
		giveaway: finalDoc,
	};
}

export async function leaveGiveaway(giveawayId: string, userId: string) {
	const db = await database('xernerx');
	const GiveawayModel = (db.models.core as any)?.Giveaway;
	if (!GiveawayModel) return { ok: false, error: 'Giveaway model unavailable.' };

	const giveaway = await GiveawayModel.findOne({ id: giveawayId }).lean();
	if (!giveaway) return { ok: false, error: 'Giveaway not found.' };
	if (giveaway.status !== 'active') return { ok: false, error: 'Cannot leave a giveaway that is no longer active.' };

	const updatedDoc = await GiveawayModel.findOneAndUpdate({ id: giveawayId }, { $pull: { entries: { userId: String(userId) } } }, { returnDocument: 'after' }).lean();

	if (updatedDoc) {
		await syncGiveawayDiscordMessage(updatedDoc).catch(() => null);
	}

	return {
		ok: true,
		totalEntries: Array.isArray(updatedDoc?.entries) ? updatedDoc.entries.length : 0,
		giveaway: updatedDoc,
	};
}

export async function fulfillGiveawayWinner(giveaway: any, winnerUserId: string): Promise<{ fulfilled: boolean; fulfillmentNote: string }> {
	const db = await database('xernerx');
	const CreditModel = (db.models.users as any)?.Credit;
	const SubscriptionModel = (db.models.users as any)?.Subscription;
	const UserModel = (db.models.users as any)?.User;
	const ItemModel = (db.models.store as any)?.Item;
	const DispatchModel = (db.models.dispatch as any)?.Invite;
	const SettingModel = (db.models.core as any)?.Setting;

	const prize = giveaway?.prize || {};
	const prizeType = prize.type || 'custom';
	let fulfilled = false;
	let fulfillmentNote = '';

	try {
		if (prizeType === 'credits') {
			const amount = Math.max(1, Number(prize.creditAmount) || 100);
			if (CreditModel) {
				await CreditModel.findOneAndUpdate(
					{ ownerId: winnerUserId },
					{
						$inc: { balance: amount },
						$push: {
							transactions: {
								id: crypto.randomUUID(),
								type: 'earn',
								amount,
								itemId: `giveaway_${giveaway.id}`,
								itemName: `Giveaway Prize: ${giveaway.title}`,
								createdAt: new Date(),
							},
						},
					},
					{ upsert: true }
				);
				fulfilled = true;
				fulfillmentNote = `Auto-credited ${amount.toLocaleString()} Xernerx Credits.`;
			}
		} else if (prizeType === 'store_item') {
			const itemId = String(prize.storeItemId || '').trim();
			const item =
				ItemModel && itemId
					? await ItemModel.findOne({ id: itemId })
							.lean()
							.catch(() => null)
					: null;

			if (item) {
				if (item.itemType === 'subscription' || item.perkType === 'trial_pass') {
					const durationDays = Math.max(1, Number(prize.durationDays) || Number(item.durationDays) || 30);
					const durationMs = durationDays * 24 * 60 * 60 * 1000;
					const targetItemId = item.perkType === 'trial_pass' ? String(item.perkValue || 'ultra') : item.id;
					const priceIdentifier = item.skuId || `giveaway_pass_${targetItemId}`;

					const existingSub = SubscriptionModel
						? await SubscriptionModel.findOne({
								ownerId: winnerUserId,
								priceId: priceIdentifier,
								status: { $in: ['active', 'trialing'] },
							})
						: null;

					const baseTime = existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd).getTime() > Date.now() ? new Date(existingSub.currentPeriodEnd).getTime() : Date.now();
					const nextEnd = new Date(baseTime + durationMs);
					const subId = existingSub?.stripeSubscriptionId || `giveaway_${targetItemId}_${crypto.randomBytes(4).toString('hex')}`;

					if (existingSub) {
						existingSub.currentPeriodEnd = nextEnd;
						await existingSub.save();
					} else if (SubscriptionModel) {
						await SubscriptionModel.create({
							ownerId: winnerUserId,
							stripeSubscriptionId: subId,
							priceId: priceIdentifier,
							status: 'active',
							currentPeriodEnd: nextEnd,
						});
					}

					if (UserModel) {
						await UserModel.findOneAndUpdate(
							{ id: winnerUserId },
							{
								$push: {
									'billing.subscriptions': {
										stripeSubscriptionId: subId,
										priceId: priceIdentifier,
										status: 'active',
										currentPeriodEnd: nextEnd,
									},
								},
							}
						).catch(() => null);
					}
					fulfilled = true;
					fulfillmentNote = `Granted ${item.name} (${durationDays} days).`;
				} else if (item.itemType === 'credit_pack') {
					const amount = Math.max(1, Number(item.creditAmount) || Number(prize.creditAmount) || 500);
					if (CreditModel) {
						await CreditModel.findOneAndUpdate(
							{ ownerId: winnerUserId },
							{
								$inc: { balance: amount },
								$push: {
									transactions: {
										id: crypto.randomUUID(),
										type: 'earn',
										amount,
										itemId: item.id,
										itemName: `Giveaway Prize: ${item.name}`,
										createdAt: new Date(),
									},
								},
							},
							{ upsert: true }
						);
						fulfilled = true;
						fulfillmentNote = `Granted ${item.name} (+${amount.toLocaleString()} Credits).`;
					}
				} else if (CreditModel) {
					let creditDoc = await CreditModel.findOne({ ownerId: winnerUserId });
					if (!creditDoc) {
						creditDoc = await CreditModel.create({ ownerId: winnerUserId, balance: 0, streak: 0 });
					}
					const updateInc: Record<string, number> = {};
					const badgesToUnlock = new Set<string>(creditDoc.unlockedBadges || []);
					const badgesToActivate = new Set<string>(creditDoc.activeBadges || []);

					if (item.perkType === 'cdn_slots') updateInc.extraCdnSlots = Math.max(1, Number(item.perkValue) || 1);
					else if (item.perkType === 'showcase_slots') updateInc.extraShowcaseSlots = Math.max(1, Number(item.perkValue) || 1);
					else if (item.perkType === 'vanity_url') updateInc.extraVanitySlots = Math.max(1, Number(item.perkValue) || 1);
					else if (item.perkType === 'bot_slots') updateInc.extraBotSlots = Math.max(1, Number(item.perkValue) || 1);
					else if (item.perkType === 'streak_shield') {
						const cur = creditDoc.streakShields || 0;
						if (cur < 3) updateInc.streakShields = Math.min(3 - cur, Math.max(1, Number(item.perkValue) || 1));
					} else {
						const badgeId = String(item.perkValue || item.id);
						badgesToUnlock.add(badgeId);
						if (BUNDLE_CHILD_UNLOCKS[badgeId]) {
							for (const childId of BUNDLE_CHILD_UNLOCKS[badgeId]) badgesToUnlock.add(childId);
						}
						if (item.perkType === 'vanity_badge') badgesToActivate.add(badgeId);
					}

					await CreditModel.updateOne(
						{ ownerId: winnerUserId },
						{
							...(Object.keys(updateInc).length > 0 ? { $inc: updateInc } : {}),
							$set: {
								unlockedBadges: Array.from(badgesToUnlock),
								activeBadges: Array.from(badgesToActivate),
							},
							$push: {
								transactions: {
									id: crypto.randomUUID(),
									type: 'earn',
									amount: 0,
									itemId: item.id,
									itemName: `Giveaway Prize: ${item.name}`,
									createdAt: new Date(),
								},
							},
						}
					);
					fulfilled = true;
					fulfillmentNote = `Unlocked Store Item: ${item.name}.`;
				}
			} else {
				fulfillmentNote = `Store item "${itemId}" pending manual review.`;
			}
		} else if (prizeType === 'discord_role') {
			const roleId = String(prize.discordRoleId || '').trim();
			const adminServerSetting = SettingModel
				? await SettingModel.findOne({ id: 'admin_server_id' })
						.lean()
						.catch(() => null)
				: null;
			const guildId = String(giveaway?.guildId || adminServerSetting?.value || '687429190165069838');
			if (roleId && guildId) {
				const roleRes = await discordApiFetch(`/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(winnerUserId)}/roles/${encodeURIComponent(roleId)}`, { method: 'PUT' });
				if (roleRes && (roleRes.ok || roleRes.status === 204)) {
					fulfilled = true;
					fulfillmentNote = `Assigned Discord Role (${roleId}).`;
				} else {
					fulfillmentNote = `Could not auto-assign Discord Role (${roleId}) — user may not be in the server or role is above bot hierarchy.`;
				}
			}
		} else {
			// Custom prize
			fulfilled = Boolean(prize.customPrizeValue);
			fulfillmentNote = prize.customPrizeValue ? `Delivered custom prize details via notification.` : `Awaiting manual staff fulfillment.`;
		}

		if (DispatchModel) {
			const customInstructions = prize.customPrizeValue ? ` Details: ${prize.customPrizeValue}` : '';
			await DispatchModel.create({
				id: crypto.randomUUID(),
				senderId: 'system',
				targetId: String(winnerUserId),
				category: 'announcement',
				type: 'success',
				data: {
					title: `🎉 You won: ${giveaway.title}!`,
					message: `Congratulations! You won "${prize.label || giveaway.title}". ${fulfillmentNote}${customInstructions}`,
					link: 'https://account.xernerx.com',
				},
				status: 'pending',
			}).catch(() => null);
		}
	} catch (err: any) {
		fulfillmentNote = `Fulfillment error: ${err?.message || 'Unknown error'}`;
	}

	return { fulfilled, fulfillmentNote };
}

function pickWeightedRandomWinners(entries: any[], count: number, excludeUserIds: Set<string>): any[] {
	const pool = entries.filter((e) => e?.userId && !excludeUserIds.has(String(e.userId)));
	const selected: any[] = [];
	const targetCount = Math.min(count, pool.length);

	while (selected.length < targetCount && pool.length > 0) {
		const totalWeight = pool.reduce((sum, e) => sum + Math.max(1, Number(e.weight) || 1), 0);
		let roll = Math.random() * totalWeight;
		let chosenIdx = 0;
		for (let i = 0; i < pool.length; i++) {
			roll -= Math.max(1, Number(pool[i].weight) || 1);
			if (roll <= 0) {
				chosenIdx = i;
				break;
			}
		}
		selected.push(pool[chosenIdx]);
		pool.splice(chosenIdx, 1);
	}

	return selected;
}

export async function drawGiveawayWinners(giveawayId: string, options?: { reroll?: boolean; replaceUserId?: string }): Promise<{ ok: boolean; giveaway?: any; newlyDrawn?: any[]; error?: string }> {
	const db = await database('xernerx');
	const GiveawayModel = (db.models.core as any)?.Giveaway;
	if (!GiveawayModel) return { ok: false, error: 'Giveaway model unavailable.' };

	const giveaway = await GiveawayModel.findOne({ id: giveawayId }).lean();
	if (!giveaway) return { ok: false, error: 'Giveaway not found.' };

	const rawEntries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
	const existingWinners = Array.isArray(giveaway.winners) ? giveaway.winners : [];
	const winnerCount = Math.max(1, Number(giveaway.winnerCount) || 1);

	// Evaluate all entrants' eligibility & live bonus weights at draw time (end of giveaway)
	const refreshedEntries: any[] = [];
	const eligibleEntries: any[] = [];
	const batchSize = 10;

	for (let i = 0; i < rawEntries.length; i += batchSize) {
		const batch = rawEntries.slice(i, i + batchSize);
		const batchResults = await Promise.all(
			batch.map(async (entry: any) => {
				if (!entry?.userId) return null;
				const eligibility = await evaluateGiveawayEligibility(giveaway, String(entry.userId), {
					username: entry.username,
					avatar: entry.avatar,
				}).catch(() => null);

				const updatedEntry = {
					...entry,
					username: eligibility?.userSnapshot?.username || entry.username || `User ${String(entry.userId).slice(-4)}`,
					avatar: eligibility?.userSnapshot?.avatar || entry.avatar || '',
					weight: eligibility ? eligibility.weight : Math.max(1, Number(entry.weight) || 1),
				};
				return {
					updatedEntry,
					eligible: eligibility ? eligibility.eligible : true,
				};
			})
		);

		for (const item of batchResults) {
			if (!item) continue;
			refreshedEntries.push(item.updatedEntry);
			if (item.eligible) {
				eligibleEntries.push(item.updatedEntry);
			}
		}
	}

	let nextWinners: any[] = [];
	const newlyDrawnEntries: any[] = [];

	if (options?.reroll && options.replaceUserId) {
		const excludeIds = new Set<string>(existingWinners.map((w: any) => String(w.userId)));
		const replacement = pickWeightedRandomWinners(eligibleEntries, 1, excludeIds);
		if (replacement.length === 0) {
			return { ok: false, error: 'No remaining eligible entrants who meet the giveaway requirements are available to reroll.' };
		}
		newlyDrawnEntries.push(replacement[0]);
		nextWinners = existingWinners.filter((w: any) => String(w.userId) !== String(options.replaceUserId));
	} else if (options?.reroll) {
		const excludeIds = new Set<string>(existingWinners.map((w: any) => String(w.userId)));
		let picked = pickWeightedRandomWinners(eligibleEntries, winnerCount, excludeIds);
		if (picked.length === 0) {
			picked = pickWeightedRandomWinners(eligibleEntries, winnerCount, new Set());
		}
		newlyDrawnEntries.push(...picked);
		nextWinners = [];
	} else {
		const picked = pickWeightedRandomWinners(eligibleEntries, winnerCount, new Set());
		newlyDrawnEntries.push(...picked);
		nextWinners = [];
	}

	const fulfilledNewWinners: any[] = [];
	for (const entry of newlyDrawnEntries) {
		const { fulfilled, fulfillmentNote } = await fulfillGiveawayWinner(giveaway, String(entry.userId));
		fulfilledNewWinners.push({
			userId: String(entry.userId),
			username: entry.username || `User ${String(entry.userId).slice(-4)}`,
			avatar: entry.avatar || '',
			weight: Number(entry.weight) || 1,
			fulfilled,
			fulfillmentNote,
			wonAt: new Date(),
		});
	}

	const finalWinners = [...nextWinners, ...fulfilledNewWinners];
	const now = new Date();

	const updatedGiveaway = await GiveawayModel.findOneAndUpdate(
		{ id: giveawayId },
		{
			$set: {
				status: 'ended',
				endedAt: giveaway.endedAt || now,
				entries: refreshedEntries,
				winners: finalWinners,
			},
		},
		{ returnDocument: 'after' }
	).lean();

	if (updatedGiveaway) {
		await syncGiveawayDiscordMessage(updatedGiveaway).catch(() => null);

		const channelId = String(updatedGiveaway.channelId || '').trim();
		if (channelId && fulfilledNewWinners.length > 0) {
			const mentions = fulfilledNewWinners.map((w) => `<@${w.userId}>`).join(', ');
			const prizeName = updatedGiveaway.prize?.label || updatedGiveaway.title;
			await discordApiFetch(`/channels/${encodeURIComponent(channelId)}/messages`, {
				method: 'POST',
				body: JSON.stringify({
					content: mentions,
					embeds: [
						{
							title: options?.reroll ? 'Giveaway Rerolled' : 'Giveaway Ended',
							description: `Congratulations ${mentions} — you won **${prizeName}**!`,
							color: 0x22c55e,
						},
					],
					...(updatedGiveaway.discordMessageId ? { message_reference: { message_id: String(updatedGiveaway.discordMessageId), fail_if_not_exists: false } } : {}),
				}),
			}).catch(() => null);
		}
	}

	return {
		ok: true,
		giveaway: updatedGiveaway,
		newlyDrawn: fulfilledNewWinners,
	};
}

let processingGiveaways = false;

export async function processDueGiveaways(): Promise<void> {
	if (processingGiveaways) return;
	processingGiveaways = true;

	try {
		const db = await database('xernerx');
		const GiveawayModel = (db.models.core as any)?.Giveaway;
		if (!GiveawayModel) return;

		const now = new Date();

		// 1. Activate any scheduled giveaways whose startsAt <= now
		const scheduledDue = await GiveawayModel.find({
			status: 'scheduled',
			startsAt: { $lte: now },
		})
			.limit(10)
			.lean()
			.catch(() => []);

		for (const doc of scheduledDue) {
			const activated = await GiveawayModel.findOneAndUpdate({ id: doc.id, status: 'scheduled' }, { $set: { status: 'active' } }, { returnDocument: 'after' })
				.lean()
				.catch(() => null);

			if (activated) {
				await syncGiveawayDiscordMessage(activated).catch(() => null);
			}
		}

		// 2. Draw winners & end any active giveaways whose endsAt <= now
		const activeDue = await GiveawayModel.find({
			status: 'active',
			endsAt: { $lte: now },
		})
			.limit(10)
			.lean()
			.catch(() => []);

		for (const doc of activeDue) {
			await drawGiveawayWinners(doc.id).catch(() => null);
		}
	} catch (err) {
		console.error('[Giveaways] Error processing due giveaways:', err);
	} finally {
		processingGiveaways = false;
	}
}

export async function handleGiveawayDiscordInteraction(interaction: any): Promise<boolean> {
	if (!interaction || typeof interaction.isButton !== 'function' || !interaction.isButton()) return false;
	if (!interaction.customId || !String(interaction.customId).startsWith('giveaway:')) return false;

	const [, action, giveawayId] = String(interaction.customId).split(':');
	if (!giveawayId) return true;

	await interaction.deferReply({ flags: 64 });

	const rawRoles = interaction.member?.roles;
	const memberRoleIds: string[] | undefined = Array.isArray(rawRoles) ? rawRoles.map(String) : rawRoles?.cache ? Array.from(rawRoles.cache.keys()).map(String) : undefined;
	const username = interaction.user?.globalName || interaction.user?.username || '';
	const avatar = typeof interaction.user?.displayAvatarURL === 'function' ? interaction.user.displayAvatarURL({ size: 128 }) : '';

	if (action === 'enter') {
		const result = await enterGiveaway(giveawayId, String(interaction.user.id), 'discord', {
			memberRoleIds,
			username,
			avatar,
		});

		if (!result.ok) {
			await interaction.editReply({
				content: '',
				embeds: [
					{
						title: 'Cannot Enter Giveaway',
						description: result.error || 'Unable to enter giveaway.',
						color: 0xef4444,
					},
				],
			});
			return true;
		}

		if (result.giveaway && interaction.message && typeof interaction.message.edit === 'function') {
			await interaction.message.edit(buildGiveawayDiscordPayload(result.giveaway)).catch(() => null);
		}

		const qualified = result.eligibility ? result.eligibility.eligible : true;
		const fields: Array<{ name: string; value: string; inline?: boolean }> = [
			{
				name: 'Tickets',
				value: `${result.entry?.weight || 1}x (${result.winChancePercent}% odds)`,
				inline: true,
			},
			{
				name: 'Draw Status',
				value: qualified ? 'Qualified' : 'Pending Requirements',
				inline: true,
			},
		];

		if (result.eligibility && result.eligibility.matchedBonuses.length > 0) {
			fields.push({
				name: 'Bonus Entries',
				value: result.eligibility.matchedBonuses.map((b) => `${b.label} (+${b.extraEntries})`).join(' • '),
				inline: false,
			});
		}

		if (result.eligibility && !result.eligibility.eligible && result.eligibility.reasons.length > 0) {
			fields.push({
				name: 'Complete Before Draw',
				value: result.eligibility.reasons.join(' • '),
				inline: false,
			});
		}

		await interaction.editReply({
			content: '',
			embeds: [
				{
					title: result.alreadyEntered ? 'Already Entered' : 'Entry Confirmed',
					description: result.giveaway?.title || 'Giveaway',
					color: qualified ? 0x22c55e : 0xf59e0b,
					fields,
				},
			],
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 4,
							label: 'Leave',
							custom_id: `giveaway:leave:${giveawayId}`,
						},
					],
				},
			],
		});
		return true;
	}

	if (action === 'leave') {
		const result = await leaveGiveaway(giveawayId, String(interaction.user.id));
		if (!result.ok) {
			await interaction.editReply({
				content: '',
				embeds: [
					{
						title: 'Cannot Leave Giveaway',
						description: result.error || 'Could not leave giveaway.',
						color: 0xef4444,
					},
				],
			});
			return true;
		}
		await interaction.editReply({
			content: '',
			embeds: [
				{
					title: 'Left Giveaway',
					description: 'Your entry has been removed.',
					color: 0x71717a,
				},
			],
			components: [],
		});
		return true;
	}

	if (action === 'info') {
		const db = await database('xernerx');
		const GiveawayModel = (db.models.core as any)?.Giveaway;
		const giveaway = GiveawayModel ? await GiveawayModel.findOne({ id: giveawayId }).lean() : null;
		if (!giveaway) {
			await interaction.editReply({
				content: '',
				embeds: [{ title: 'Giveaway Not Found', color: 0xef4444 }],
			});
			return true;
		}

		const eligibility = await evaluateGiveawayEligibility(giveaway, String(interaction.user.id), {
			memberRoleIds,
			username,
			avatar,
		});
		const entries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
		const myEntry = entries.find((e: any) => String(e.userId) === String(interaction.user.id));
		const totalWeight = entries.reduce((sum: number, e: any) => sum + (Number(e.weight) || 1), 0);
		const effectiveWeight = myEntry ? Number(myEntry.weight) || eligibility.weight : eligibility.weight;
		const denom = myEntry ? totalWeight : totalWeight + effectiveWeight;
		const odds = denom > 0 ? Math.min(100, Math.round((effectiveWeight / denom) * (Number(giveaway.winnerCount) || 1) * 1000) / 10) : 100;

		const fields: Array<{ name: string; value: string; inline?: boolean }> = [
			{
				name: 'Entered',
				value: myEntry ? 'Yes' : 'No',
				inline: true,
			},
			{
				name: 'Tickets',
				value: `${effectiveWeight}x (${odds}% odds)`,
				inline: true,
			},
			{
				name: 'Draw Status',
				value: eligibility.eligible ? 'Qualified' : 'Pending Requirements',
				inline: true,
			},
		];

		if (eligibility.matchedBonuses.length > 0) {
			fields.push({
				name: 'Bonus Entries',
				value: eligibility.matchedBonuses.map((b) => `${b.label} (+${b.extraEntries})`).join(' • '),
				inline: false,
			});
		}

		if (!eligibility.eligible && eligibility.reasons.length > 0) {
			fields.push({
				name: 'Complete Before Draw',
				value: eligibility.reasons.join(' • '),
				inline: false,
			});
		}

		await interaction.editReply({
			content: '',
			embeds: [
				{
					title: giveaway.title || 'Giveaway Status',
					color: eligibility.eligible ? 0x6366f1 : 0xf59e0b,
					fields,
					footer: {
						text: `Lv. ${eligibility.profileStats.globalLevel} • ${eligibility.profileStats.streak}d Streak`,
					},
				},
			],
		});
		return true;
	}

	return true;
}
