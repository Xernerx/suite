/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { fetchDiscordWithFallback } from './discordGuildResources';

const SIGN_IN_BONUS_AMOUNT = 1000;
const SNOWFLAKE_REGEX = /^\d{15,22}$/;
const NEGATIVE_DISCORD_GUILD_TTL_MS = 5 * 60 * 1000;

export interface UserBotProfileSummary {
	bots: ('virtue' | 'yourapps')[];
	serverCount: number;
}

export interface GuildBotProfileSummary {
	bots: ('virtue' | 'yourapps')[];
	virtueMembers: number;
	yourappsSubmissions: number;
}

function getMissingDiscordGuildCache(): Map<string, number> {
	const g = globalThis as any;
	if (!g.__xernerxMissingDiscordGuildCache) {
		g.__xernerxMissingDiscordGuildCache = new Map<string, number>();
	}
	return g.__xernerxMissingDiscordGuildCache;
}

export async function reconcileBotAndOrphanUsers(xernerxDb: any): Promise<Map<string, UserBotProfileSummary>> {
	const summaryMap = new Map<string, UserBotProfileSummary>();

	try {
		const UserModel = xernerxDb.models.users?.User;
		const LevelModel = xernerxDb.models.users?.Level;
		const CreditModel = xernerxDb.models.users?.Credit;
		const SettingModel = xernerxDb.models.core?.Setting;
		if (!UserModel) return summaryMap;

		const [virtueDb, yourappsDb] = await Promise.all([database('virtue').catch(() => null), database('yourapps').catch(() => null)]);

		const VUser = (virtueDb?.models?.profiles as any)?.User;
		const LLevel = (virtueDb?.models?.levels as any)?.Level;
		const LText = (virtueDb?.models?.levels as any)?.Text;
		const LVoice = (virtueDb?.models?.levels as any)?.Voice;
		const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
		const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;

		const groupUserGuilds = (model: any, userField: string) =>
			model ? model.aggregate([{ $group: { _id: `$${userField}`, guilds: { $addToSet: '$guild' } } }]).catch(() => []) : Promise.resolve([]);

		const [existingUserIds, optOutUserDocs, existingCreditOwnerIds, existingLevelOwnerIds, vUserIds, optOutVUserDocs, vLevelGroups, vTextGroups, vVoiceGroups, ySubGroups, yDraftGroups] =
			await Promise.all([
				UserModel.distinct('id').catch(() => []),
				UserModel.find({ $or: [{ services: false }, { blacklisted: true }] })
					.select('id')
					.lean()
					.catch(() => []),
				CreditModel ? CreditModel.distinct('ownerId').catch(() => []) : Promise.resolve([]),
				LevelModel ? LevelModel.distinct('ownerId').catch(() => []) : Promise.resolve([]),
				VUser ? VUser.distinct('id').catch(() => []) : Promise.resolve([]),
				VUser
					? VUser.find({ $or: [{ services: false }, { blacklisted: true }] })
							.select('id')
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				groupUserGuilds(LLevel, 'id'),
				groupUserGuilds(LText, 'id'),
				groupUserGuilds(LVoice, 'id'),
				groupUserGuilds(YSubmission, 'userId'),
				groupUserGuilds(YDraft, 'userId'),
			]);

		const userBots = new Map<string, Set<'virtue' | 'yourapps'>>();
		const userGuilds = new Map<string, Set<string>>();

		const recordBotActivity = (rawUid: any, bot: 'virtue' | 'yourapps', guildsList: any[] = []) => {
			const uid = String(rawUid || '').trim();
			if (!SNOWFLAKE_REGEX.test(uid)) return;
			if (!userBots.has(uid)) userBots.set(uid, new Set());
			userBots.get(uid)!.add(bot);
			if (!userGuilds.has(uid)) userGuilds.set(uid, new Set());
			const gSet = userGuilds.get(uid)!;
			for (const g of guildsList) {
				const gid = String(g || '').trim();
				if (SNOWFLAKE_REGEX.test(gid)) gSet.add(gid);
			}
		};

		for (const uid of vUserIds || []) recordBotActivity(uid, 'virtue');
		for (const grp of [...(vLevelGroups || []), ...(vTextGroups || []), ...(vVoiceGroups || [])]) {
			recordBotActivity(grp?._id, 'virtue', grp?.guilds || []);
		}
		for (const grp of [...(ySubGroups || []), ...(yDraftGroups || [])]) {
			recordBotActivity(grp?._id, 'yourapps', grp?.guilds || []);
		}

		for (const [uid, botsSet] of userBots.entries()) {
			summaryMap.set(uid, {
				bots: Array.from(botsSet),
				serverCount: userGuilds.get(uid)?.size || 0,
			});
		}

		const existingUserSet = new Set((existingUserIds || []).map((id: any) => String(id)));
		const existingCreditSet = new Set((existingCreditOwnerIds || []).map((id: any) => String(id)));
		const existingLevelSet = new Set((existingLevelOwnerIds || []).map((id: any) => String(id)));
		const optOutSet = new Set([...(optOutUserDocs || []).map((d: any) => String(d?.id || '')), ...(optOutVUserDocs || []).map((d: any) => String(d?.id || ''))]);

		const candidateIds = new Set<string>();
		for (const rawId of [...(existingUserIds || []), ...(existingCreditOwnerIds || []), ...(existingLevelOwnerIds || []), ...userBots.keys()]) {
			const uid = String(rawId || '').trim();
			if (SNOWFLAKE_REGEX.test(uid) && !optOutSet.has(uid)) {
				candidateIds.add(uid);
			}
		}

		const missingUsers: string[] = [];
		const missingCredits: string[] = [];
		const missingLevels: string[] = [];

		for (const uid of candidateIds) {
			if (!existingUserSet.has(uid)) missingUsers.push(uid);
			if (!existingCreditSet.has(uid)) missingCredits.push(uid);
			if (!existingLevelSet.has(uid)) missingLevels.push(uid);
		}

		if (missingUsers.length === 0 && missingCredits.length === 0 && missingLevels.length === 0) {
			return summaryMap;
		}

		let candidateRoles: string[] = [];
		if (SettingModel) {
			const joinRolesSetting = await SettingModel.findOne({ id: 'join_roles' })
				.lean()
				.catch(() => null);
			if (joinRolesSetting?.value) {
				try {
					const parsed = JSON.parse(joinRolesSetting.value);
					if (Array.isArray(parsed)) {
						candidateRoles = Array.from(new Set(parsed.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)));
					}
				} catch {}
			}
		}

		const RoleModel = xernerxDb.models.core?.Role;
		let defaultRoles: string[] = [];
		if (RoleModel && candidateRoles.length > 0) {
			const existingRoleDocs = await RoleModel.find({ id: { $in: candidateRoles } })
				.select('id')
				.lean()
				.catch(() => []);
			defaultRoles = (existingRoleDocs || []).map((r: any) => String(r.id)).filter(Boolean);
		}

		await Promise.all([
			...missingUsers.map((uid) =>
				UserModel.create({
					id: uid,
					roles: defaultRoles,
				}).catch(() => {})
			),
			...(CreditModel
				? missingCredits.map((uid) =>
						CreditModel.create({
							ownerId: uid,
							balance: SIGN_IN_BONUS_AMOUNT,
							signInBonusClaimed: true,
							transactions: [
								{
									id: crypto.randomUUID(),
									type: 'earn',
									amount: SIGN_IN_BONUS_AMOUNT,
									multiplierPercent: 100,
									itemId: 'signin_bonus',
									itemName: 'Welcome Sign-In Bonus',
									createdAt: new Date(),
								},
							],
						}).catch(() => {})
					)
				: []),
			...(LevelModel
				? missingLevels.map((uid) =>
						LevelModel.create({
							id: crypto.randomUUID(),
							ownerId: uid,
							level: 1,
							xp: 0,
						}).catch(() => {})
					)
				: []),
		]);
	} catch {}

	return summaryMap;
}

export async function reconcileBotGuildProfiles(xernerxDb: any): Promise<Map<string, GuildBotProfileSummary>> {
	const summaryMap = new Map<string, GuildBotProfileSummary>();

	try {
		const GuildModel = xernerxDb.models.guilds?.Guild;
		if (!GuildModel) return summaryMap;

		const [virtueDb, yourappsDb] = await Promise.all([database('virtue').catch(() => null), database('yourapps').catch(() => null)]);

		const VGuild = (virtueDb?.models?.profiles as any)?.Guild;
		const LLevel = (virtueDb?.models?.levels as any)?.Level;
		const LText = (virtueDb?.models?.levels as any)?.Text;
		const LVoice = (virtueDb?.models?.levels as any)?.Voice;
		const YProfile = (yourappsDb?.models?.guilds as any)?.Profile;
		const YForm = (yourappsDb?.models?.guilds as any)?.Form;
		const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
		const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;

		const [existingGuildDocs, vGuildIds, vLevelGroups, vTextIds, vVoiceIds, yProfileIds, yFormIds, ySubGroups, yDraftIds] = await Promise.all([
			GuildModel.find({})
				.select('id name icon')
				.lean()
				.catch(() => []),
			VGuild ? VGuild.distinct('id').catch(() => []) : Promise.resolve([]),
			LLevel ? LLevel.aggregate([{ $group: { _id: '$guild', count: { $sum: 1 } } }]).catch(() => []) : Promise.resolve([]),
			LText ? LText.distinct('guild').catch(() => []) : Promise.resolve([]),
			LVoice ? LVoice.distinct('guild').catch(() => []) : Promise.resolve([]),
			YProfile ? YProfile.distinct('id').catch(() => []) : Promise.resolve([]),
			YForm ? YForm.distinct('guild').catch(() => []) : Promise.resolve([]),
			YSubmission ? YSubmission.aggregate([{ $group: { _id: '$guild', count: { $sum: 1 } } }]).catch(() => []) : Promise.resolve([]),
			YDraft ? YDraft.distinct('guild').catch(() => []) : Promise.resolve([]),
		]);

		const guildBots = new Map<string, Set<'virtue' | 'yourapps'>>();
		const virtueCounts = new Map<string, number>();
		const yourappsCounts = new Map<string, number>();

		const markGuildBot = (rawGid: any, bot: 'virtue' | 'yourapps') => {
			const gid = String(rawGid || '').trim();
			if (!SNOWFLAKE_REGEX.test(gid)) return;
			if (!guildBots.has(gid)) guildBots.set(gid, new Set());
			guildBots.get(gid)!.add(bot);
		};

		for (const gid of [...(vGuildIds || []), ...(vTextIds || []), ...(vVoiceIds || [])]) markGuildBot(gid, 'virtue');
		for (const grp of vLevelGroups || []) {
			markGuildBot(grp?._id, 'virtue');
			if (SNOWFLAKE_REGEX.test(String(grp?._id || ''))) {
				virtueCounts.set(String(grp._id), Number(grp.count) || 0);
			}
		}

		for (const gid of [...(yProfileIds || []), ...(yFormIds || []), ...(yDraftIds || [])]) markGuildBot(gid, 'yourapps');
		for (const grp of ySubGroups || []) {
			markGuildBot(grp?._id, 'yourapps');
			if (SNOWFLAKE_REGEX.test(String(grp?._id || ''))) {
				yourappsCounts.set(String(grp._id), Number(grp.count) || 0);
			}
		}

		for (const [gid, botsSet] of guildBots.entries()) {
			summaryMap.set(gid, {
				bots: Array.from(botsSet),
				virtueMembers: virtueCounts.get(gid) || 0,
				yourappsSubmissions: yourappsCounts.get(gid) || 0,
			});
		}

		const existingMap = new Map<string, any>();
		for (const doc of existingGuildDocs || []) {
			if (doc?.id) existingMap.set(String(doc.id), doc);
		}

		const missingCache = getMissingDiscordGuildCache();
		const now = Date.now();
		const toReconcile: string[] = [];

		for (const gid of guildBots.keys()) {
			const existing = existingMap.get(gid);
			const isPlaceholder = !existing || !existing.name || existing.name === 'Unknown Guild' || existing.name === 'Server' || existing.name === `Server ${gid}`;

			if (!existing) {
				toReconcile.push(gid);
			} else if (isPlaceholder) {
				const lastMiss = missingCache.get(gid) || 0;
				if (now - lastMiss > NEGATIVE_DISCORD_GUILD_TTL_MS) {
					toReconcile.push(gid);
				}
			}
		}

		const batch = toReconcile.slice(0, 25);
		for (let i = 0; i < batch.length; i += 5) {
			const chunk = batch.slice(i, i + 5);
			await Promise.all(
				chunk.map(async (gid) => {
					const existing = existingMap.get(gid);
					const lastMiss = missingCache.get(gid) || 0;
					const discordGuild =
						now - lastMiss > NEGATIVE_DISCORD_GUILD_TTL_MS ? await fetchDiscordWithFallback(`/guilds/${encodeURIComponent(gid)}?with_counts=true`).catch(() => null) : null;

					if (!discordGuild) {
						missingCache.set(gid, Date.now());
						if (!existing) {
							await GuildModel.create({
								id: gid,
								name: `Server ${gid}`,
								privacy: 'private',
								bot: false,
							}).catch(() => {});
						}
						return;
					}

					missingCache.delete(gid);
					const setFields: Record<string, any> = {
						name: discordGuild.name || existing?.name || `Server ${gid}`,
						bot: true,
					};
					if (discordGuild.icon) setFields.icon = discordGuild.icon;
					if (discordGuild.banner) setFields.banner = discordGuild.banner;
					if (discordGuild.owner_id && !existing?.owner) setFields.owner = String(discordGuild.owner_id);
					if (typeof discordGuild.approximate_member_count === 'number' && discordGuild.approximate_member_count > 0) {
						setFields.memberCount = discordGuild.approximate_member_count;
					}

					await GuildModel.findOneAndUpdate(
						{ id: gid },
						{
							$set: setFields,
							$setOnInsert: {
								id: gid,
								privacy: 'private',
							},
						},
						{ upsert: true }
					).catch(() => {});
				})
			);
		}
	} catch {}

	return summaryMap;
}
