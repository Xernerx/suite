/** @format */

import { applyLiveDiscordToBot, buildDiscordAvatarUrl, fetchLiveDiscordUser, isDiscordManagedMediaValue } from '@/lib/botDiscordSync';

export const OFFICIAL_BOT_SLUG_TO_ID: Record<string, string> = {
	virtue: '1484880634844287138',
	yourapps: '619328560141697036',
	todo: '782105629572464652',
	'to-do-list': '782105629572464652',
	'to-do-list-bot': '782105629572464652',
	todolistbot: '782105629572464652',
	tdl: '782105629572464652',
	metamorphosis: '881678826906730547',
	zodiac: '950251264095162418',
};

export const OFFICIAL_BOT_ID_TO_SLUG: Record<string, string> = {
	'1484880634844287138': 'virtue',
	'619328560141697036': 'yourapps',
	'782105629572464652': 'todo',
	'881678826906730547': 'metamorphosis',
	'950251264095162418': 'zodiac',
};

async function attachBotTelemetryStats(bot: any, botId: string, StatModel: any): Promise<void> {
	if (!StatModel) return;
	const [latestStat, peakAgg] = await Promise.all([
		StatModel.findOne({ id: botId })
			.sort({ timestamp: -1 })
			.lean()
			.catch(() => null),
		StatModel.aggregate([
			{ $match: { id: botId } },
			{
				$group: {
					_id: null,
					maxGuilds: { $max: '$guildCount' },
					maxUsers: { $max: '$userCount' },
				},
			},
		]).catch(() => []),
	]);

	if (latestStat) {
		bot.latestStat = latestStat;
		bot.guildCount = latestStat.guildCount ?? latestStat.servers ?? 0;
		bot.userCount = latestStat.userCount ?? latestStat.users ?? 0;
		bot.shardCount = latestStat.shardCount ?? (Array.isArray(latestStat.shards) ? latestStat.shards.length : 0);
		bot.onlineSince = latestStat.onlineSince ?? 0;
	}
	bot.peakStats = {
		guildCount: Math.max(Number(peakAgg?.[0]?.maxGuilds) || 0, Number(bot.guildCount) || 0),
		userCount: Math.max(Number(peakAgg?.[0]?.maxUsers) || 0, Number(bot.userCount) || 0),
	};
}

async function attachBotReviewSummary(bot: any, botId: string, ReviewModel: any, UserModel: any): Promise<void> {
	if (!ReviewModel) return;
	const allReviews = await ReviewModel.find({ botId })
		.sort({ createdAt: -1 })
		.lean()
		.catch(() => []);
	const totalCount = allReviews.length;
	const avgRating = totalCount > 0 ? Number((allReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0) / totalCount).toFixed(1)) : 0;
	const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
	for (const r of allReviews) {
		const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
		breakdown[star] = (breakdown[star] || 0) + 1;
	}

	const topReviewsRaw = [...allReviews]
		.sort((a: any, b: any) => {
			const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
			const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
			if (scoreB !== scoreA) return scoreB - scoreA;
			return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
		})
		.slice(0, 2);

	const reviewerIds = Array.from(new Set(topReviewsRaw.map((r: any) => r.userId).filter(Boolean)));
	const userDocs =
		UserModel && reviewerIds.length > 0
			? await UserModel.find({ id: { $in: reviewerIds } })
					.lean()
					.catch(() => [])
			: [];
	const userDocMap = new Map<string, any>((userDocs || []).map((u: any) => [u.id, u]));

	const recentReviews = await Promise.all(
		topReviewsRaw.map(async (r: any) => {
			const stored = userDocMap.get(r.userId);
			if (stored) {
				return {
					...r,
					user: {
						id: stored.id,
						username: stored.username || stored.name,
						global_name: stored.globalName || stored.global_name || stored.username || stored.name,
						avatar: stored.avatar,
						avatarUrl: stored.avatarUrl || stored.image,
					},
				};
			}
			if (process.env.DISCORD_CLIENT_TOKEN && r.userId) {
				try {
					const dRes = await fetch(`https://discord.com/api/v10/users/${r.userId}`, {
						headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
						next: { revalidate: 3600 },
					});
					if (dRes.ok) {
						return { ...r, user: await dRes.json() };
					}
				} catch {}
			}
			return { ...r, user: { id: r.userId } };
		})
	);

	bot.reviewSummary = {
		count: totalCount,
		average: avgRating,
		breakdown,
		recent: recentReviews,
	};
}

async function attachRelatedBots(bot: any, botId: string, BotModel: any, StatModel: any, VoteModel: any): Promise<void> {
	try {
		const ownerList = Array.isArray(bot.owners) ? bot.owners.filter(Boolean) : [];
		const tagList = Array.isArray(bot.tags) ? bot.tags.filter(Boolean) : [];

		const devConditions: any[] = [];
		if (ownerList.length > 0) devConditions.push({ owners: { $in: ownerList } });
		if (bot.organization) devConditions.push({ organization: bot.organization });

		const developerBotsRaw =
			devConditions.length > 0
				? await BotModel.find({
						id: { $ne: botId },
						privacy: 'public',
						$or: devConditions,
					})
						.select('id vanitySlug name avatar description verified tags voteCount status discordCache')
						.limit(4)
						.lean()
						.catch(() => [])
				: [];

		const devBotIds = new Set<string>([botId, ...developerBotsRaw.map((b: any) => b.id)]);

		const similarBotsRaw =
			tagList.length > 0
				? await BotModel.find({
						id: { $nin: Array.from(devBotIds) },
						privacy: 'public',
						tags: { $in: tagList },
					})
						.select('id vanitySlug name avatar description verified tags voteCount status discordCache')
						.limit(4)
						.lean()
						.catch(() => [])
				: [];

		const allRelatedIds = Array.from(new Set([...developerBotsRaw.map((b: any) => b.id), ...similarBotsRaw.map((b: any) => b.id)]));
		const [relatedStats, relatedVotes] = await Promise.all([
			StatModel && allRelatedIds.length > 0
				? StatModel.aggregate([
						{ $match: { id: { $in: allRelatedIds } } },
						{ $sort: { timestamp: -1 } },
						{
							$group: {
								_id: '$id',
								guildCount: { $first: '$guildCount' },
								userCount: { $first: '$userCount' },
							},
						},
					]).catch(() => [])
				: [],
			VoteModel && allRelatedIds.length > 0 ? VoteModel.aggregate([{ $match: { botId: { $in: allRelatedIds } } }, { $group: { _id: '$botId', count: { $sum: 1 } } }]).catch(() => []) : [],
		]);

		const statMap = new Map<string, any>((relatedStats || []).map((s: any) => [s._id, s]));
		const voteMap = new Map<string, any>((relatedVotes || []).map((v: any) => [v._id, v.count]));

		const enrichBotSummary = (b: any) => {
			const st = statMap.get(b.id);
			const dc = b.discordCache;
			const freshAvatar = !isDiscordManagedMediaValue(b.avatar) ? b.avatar : dc?.avatarUrl || buildDiscordAvatarUrl(b.id, dc?.avatar || b.avatar, 512);
			return {
				...b,
				name: dc?.globalName || dc?.username || b.name,
				avatar: freshAvatar || null,
				discord: dc?.username
					? {
							id: b.id,
							username: dc.username,
							global_name: dc.globalName || dc.username,
							avatar: dc.avatar || null,
							avatarUrl: dc.avatarUrl || freshAvatar || null,
						}
					: undefined,
				guildCount: st?.guildCount ?? 0,
				userCount: st?.userCount ?? 0,
				voteCount: voteMap.get(b.id) ?? b.voteCount ?? 0,
			};
		};

		bot.relatedBots = {
			developerBots: developerBotsRaw.map(enrichBotSummary),
			similarBots: similarBotsRaw.map(enrichBotSummary),
		};
	} catch {}
}

async function attachBotDiscordAndOwners(bot: any, botId: string, BotModel: any, UserModel: any): Promise<void> {
	try {
		const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
		const discordUser = await fetchLiveDiscordUser(botId);

		if (discordUser) {
			applyLiveDiscordToBot(bot, botId, discordUser, BotModel, 1024);
		} else if (bot.discordCache?.username || bot.name) {
			const dc = bot.discordCache || {};
			const fallbackAvatarUrl = !isDiscordManagedMediaValue(bot.avatar) ? bot.avatar : dc.avatarUrl || buildDiscordAvatarUrl(botId, dc.avatar || bot.avatar, 1024);
			bot.discord = {
				id: botId,
				username: dc.username || bot.name || botId,
				global_name: dc.globalName || bot.name || dc.username || botId,
				avatar: dc.avatar || null,
				banner: dc.banner || null,
				avatarUrl: fallbackAvatarUrl,
				bannerUrl: dc.bannerUrl || null,
				bot: true,
			};
		}

		if (Array.isArray(bot.owners) && bot.owners.length > 0) {
			const ownerDocs = UserModel
				? await UserModel.find({ id: { $in: bot.owners } })
						.select('id name icon vanitySlug discordCache')
						.lean()
						.catch(() => [])
				: [];
			const ownerDocMap = new Map<string, any>((ownerDocs || []).map((u: any) => [String(u.id), u]));

			const ownersData = await Promise.all(
				bot.owners.map(async (ownerId: string) => {
					const doc = ownerDocMap.get(String(ownerId));
					const dc = doc?.discordCache;
					if (dc?.username) {
						return {
							id: ownerId,
							vanitySlug: doc?.vanitySlug || undefined,
							username: dc.username,
							global_name: dc.globalName || dc.username,
							avatar: dc.avatar || null,
							avatarUrl: dc.avatarUrl || (dc.avatar ? `https://cdn.discordapp.com/avatars/${ownerId}/${dc.avatar}.png?size=128` : doc?.icon || null),
							discriminator: '0',
						};
					}
					for (const token of tokens) {
						try {
							const res = await fetch(`https://discord.com/api/v10/users/${ownerId}`, {
								headers: { Authorization: `Bot ${token}` },
								next: { revalidate: 3600 },
							});
							if (res.ok) {
								const dJson = await res.json();
								return { ...dJson, vanitySlug: doc?.vanitySlug || undefined };
							}
						} catch {}
					}
					if (doc?.name) {
						return {
							id: ownerId,
							vanitySlug: doc?.vanitySlug || undefined,
							username: doc.name,
							global_name: doc.name,
							avatar: null,
							avatarUrl: doc.icon || null,
							discriminator: '0',
						};
					}
					return null;
				})
			);
			bot.ownersData = ownersData.filter(Boolean);
		}
	} catch (e) {
		console.error('Failed to fetch Discord user:', e);
	}
}

export async function enrichBotProfileDocument(bot: any, botId: string, db: any): Promise<void> {
	if (!bot.vanitySlug && OFFICIAL_BOT_ID_TO_SLUG[botId]) {
		bot.vanitySlug = OFFICIAL_BOT_ID_TO_SLUG[botId];
	}

	const BotModel = (db.models.bots as any).Bot;
	const VoteModel = (db.models.bots as any).Vote;
	const CommandModel = (db.models.bots as any).Command;
	const StatModel = (db.models.bots as any).Stat;
	const ReviewModel = (db.models.bots as any).Review;
	const UserModel = (db.models.users as any)?.User;

	bot.voteCount = await VoteModel.countDocuments({ botId });

	await attachBotTelemetryStats(bot, botId, StatModel);
	await attachBotReviewSummary(bot, botId, ReviewModel, UserModel);
	await attachRelatedBots(bot, botId, BotModel, StatModel, VoteModel);

	if (CommandModel && (!Array.isArray(bot.commands) || bot.commands.length === 0)) {
		const syncedCmds = await CommandModel.find({ botId })
			.sort({ type: 1, name: 1 })
			.lean()
			.catch(() => []);
		if (syncedCmds.length > 0) {
			bot.commands = syncedCmds.map((c: any) => ({
				...(c.body && typeof c.body === 'object' ? c.body : {}),
				name: c.name || c.body?.name,
				description: c.description || c.body?.description || '',
				type: c.type || c.body?.type || 1,
			}));
		}
	}

	if (bot.organization) {
		const OrganizationModel = (db.models.organizations as any).Organization;
		const org = await OrganizationModel.findById(bot.organization).lean();
		if (org) {
			bot.organizationData = org;
		}
	}

	const [mainOrgSetting, appInviteExists] = await Promise.all([
		(db.models.core as any)?.Setting?.findOne({ id: 'main_org_id' })
			.lean()
			.catch(() => null),
		(db.models.core as any)?.AppInvite?.exists({ clientId: botId }).catch(() => null),
	]);
	const mainOrgId = String(mainOrgSetting?.value || '').trim();
	const orgNameLower = String(bot.organizationData?.name || '').toLowerCase();
	bot.isMainOrgBot = Boolean((mainOrgId && String(bot.organization || '') === mainOrgId) || OFFICIAL_BOT_ID_TO_SLUG[botId] || appInviteExists || orgNameLower.includes('xernerx'));
	const slugLower = String(bot.vanitySlug || '').toLowerCase();
	bot.hasSuiteDashboard = Boolean(botId === '1484880634844287138' || botId === '619328560141697036' || slugLower === 'virtue' || slugLower === 'yourapps' || bot.links?.dashboard);

	await attachBotDiscordAndOwners(bot, botId, BotModel, UserModel);
	bot.vanityUnlocked = Boolean(bot.vanityUnlocked || bot.vanitySlug || bot.verified);
}
