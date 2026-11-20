/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { applyLiveDiscordToBot, buildDiscordAvatarUrl, fetchLiveDiscordUser, isBotDiscordCacheStale, isDiscordManagedMediaValue } from '@/lib/botDiscordSync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const url = new URL(request.url);
		const category = url.searchParams.get('category');
		const sortParam = url.searchParams.get('sort');
		const owner = url.searchParams.get('owner');
		const organization = url.searchParams.get('organization');
		const publicOnly = url.searchParams.get('publicOnly') === 'true';
		const all = url.searchParams.get('all') === 'true';
		const limit = parseInt(url.searchParams.get('limit') || (all ? '500' : owner || organization ? '100' : '3'));
		const now = new Date();

		let matchStage: any = {};

		if (all) {
			matchStage = {};
			if (url.searchParams.get('search')) {
				const query = url.searchParams.get('search');
				matchStage.$or = [{ id: { $regex: query, $options: 'i' } }, { name: { $regex: query, $options: 'i' } }, { tags: { $regex: query, $options: 'i' } }];
			}
		} else if (owner) {
			const TokenModel = (db.models.users as any)?.Token;
			let tokenBotIds: string[] = [];
			if (TokenModel) {
				const userTokens = await TokenModel.find({ owners: owner, botId: { $exists: true, $ne: null } })
					.select('botId')
					.lean()
					.catch(() => []);
				tokenBotIds = Array.from(new Set(userTokens.map((t: any) => String(t.botId || '').trim()).filter(Boolean)));
				if (tokenBotIds.length > 0) {
					await BotModel.updateMany({ id: { $in: tokenBotIds }, owners: { $ne: owner } }, { $addToSet: { owners: owner } }).catch(() => {});
				}
			}
			const session = publicOnly ? null : ((await getServerSession(auth).catch(() => null)) as any);
			const sessionUid = session?.user?.id ? String(session.user.id) : null;
			const isAuthorizedOwner = Boolean(!publicOnly && sessionUid && (sessionUid === owner || session?.user?.admin));
			matchStage = tokenBotIds.length > 0 ? { $or: [{ owners: owner }, { id: { $in: tokenBotIds } }] } : { owners: owner };
			if (!isAuthorizedOwner) {
				matchStage.privacy = 'public';
			}
		} else if (organization) {
			let resolvedOrgId = organization;
			let orgDoc: any = null;
			if (!/^[0-9a-fA-F]{24}$/.test(organization)) {
				orgDoc = await (db.models.organizations as any)?.Organization?.findOne({ vanitySlug: organization.toLowerCase() })
					.select('_id owner members')
					.lean()
					.catch(() => null);
				if (orgDoc?._id) resolvedOrgId = String(orgDoc._id);
			} else if (!publicOnly) {
				orgDoc = await (db.models.organizations as any)?.Organization?.findById(organization)
					.select('_id owner members')
					.lean()
					.catch(() => null);
			}
			const session = publicOnly ? null : ((await getServerSession(auth).catch(() => null)) as any);
			const sessionUid = session?.user?.id ? String(session.user.id) : null;
			const isAuthorizedOrgMember = Boolean(
				!publicOnly && sessionUid && (session?.user?.admin || (orgDoc && (orgDoc.owner === sessionUid || (Array.isArray(orgDoc.members) && orgDoc.members.includes(sessionUid)))))
			);
			matchStage = { organization: resolvedOrgId };
			if (!isAuthorizedOrgMember) {
				matchStage.privacy = 'public';
			}
		} else {
			matchStage.privacy = 'public';
			if (category === 'promoted') {
				matchStage.$or = [{ promotedUntil: { $gt: now } }, { boostedUntil: { $gt: now } }];
			} else if (url.searchParams.get('search')) {
				const query = url.searchParams.get('search');
				matchStage.$or = [
					{ id: { $regex: query, $options: 'i' } },
					{ name: { $regex: query, $options: 'i' } },
					{ description: { $regex: query, $options: 'i' } },
					{ tags: { $regex: query, $options: 'i' } },
				];
			} else if (url.searchParams.get('tag')) {
				matchStage.tags = url.searchParams.get('tag');
			}
		}

		let sortStage: any = { createdAt: -1 };
		const effectiveSort = sortParam || category;
		if (effectiveSort === 'top_voted' || effectiveSort === 'votes') {
			sortStage = { realVoteCount: -1, 'statsData.guildCount': -1 };
		} else if (effectiveSort === 'biggest' || effectiveSort === 'servers') {
			sortStage = { 'statsData.guildCount': -1, realVoteCount: -1 };
		} else if (effectiveSort === 'users') {
			sortStage = { 'statsData.userCount': -1, 'statsData.guildCount': -1 };
		} else if (effectiveSort === 'rating') {
			sortStage = { reviewAverage: -1, reviewCount: -1, 'statsData.guildCount': -1 };
		} else if (effectiveSort === 'newest' || effectiveSort === 'newcomers') {
			sortStage = { createdAt: -1 };
		}

		const bots = await BotModel.aggregate([
			{ $match: matchStage },
			{
				$lookup: {
					from: 'stats',
					let: { botId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$id', '$$botId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
					as: 'statsData',
				},
			},
			{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'votes',
					let: { botId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$botId', '$$botId'] } } }, { $count: 'count' }],
					as: 'voteAgg',
				},
			},
			{ $unwind: { path: '$voteAgg', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'reviews',
					let: { botId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$botId', '$$botId'] } } }, { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }],
					as: 'reviewAgg',
				},
			},
			{ $unwind: { path: '$reviewAgg', preserveNullAndEmptyArrays: true } },
			{
				$addFields: {
					realVoteCount: {
						$max: [{ $ifNull: ['$voteAgg.count', 0] }, { $ifNull: ['$voteCount', 0] }, { $ifNull: ['$statsData.voteCount', 0] }, { $ifNull: ['$statsData.votes', 0] }],
					},
					reviewCount: { $ifNull: ['$reviewAgg.count', 0] },
					reviewAverage: {
						$cond: {
							if: { $gt: [{ $ifNull: ['$reviewAgg.count', 0] }, 0] },
							then: { $round: [{ $ifNull: ['$reviewAgg.avg', 0] }, 1] },
							else: 0,
						},
					},
				},
			},
			{ $sort: sortStage },
			{ $limit: limit },
			{
				$project: {
					id: 1,
					name: 1,
					avatar: 1,
					banner: 1,
					discord: '$discordCache',
					vanitySlug: 1,
					vanityUnlocked: 1,
					verified: 1,
					status: 1,
					privacy: 1,
					widgets: 1,
					owners: 1,
					description: 1,
					organization: 1,
					tags: 1,
					links: 1,
					commandsCount: { $size: { $ifNull: ['$commands', []] } },
					promotedUntil: 1,
					boostedUntil: 1,
					boostedBy: 1,
					createdAt: 1,
					voteCount: '$realVoteCount',
					reviewCount: 1,
					reviewAverage: 1,
					stats: {
						$cond: {
							if: { $not: ['$statsData'] },
							then: null,
							else: {
								guildCount: { $ifNull: ['$statsData.guildCount', '$statsData.servers'] },
								userCount: { $ifNull: ['$statsData.userCount', '$statsData.users'] },
								shardCount: { $ifNull: ['$statsData.shardCount', '$statsData.shards'] },
								voteCount: '$realVoteCount',
							},
						},
					},
				},
			},
		]);

		const staleBots = bots.filter((b: any) => b?.id && isBotDiscordCacheStale(b)).slice(0, 25);
		if (staleBots.length > 0) {
			await Promise.all(
				staleBots.map(async (b: any) => {
					const discordUser = await fetchLiveDiscordUser(String(b.id));
					if (discordUser) {
						applyLiveDiscordToBot(b, String(b.id), discordUser, BotModel, 512);
					} else if (b.discord && isDiscordManagedMediaValue(b.avatar)) {
						b.avatar = b.discord.avatar || '';
						if (!b.discord.avatarUrl && b.discord.avatar) {
							b.discord.avatarUrl = buildDiscordAvatarUrl(String(b.id), b.discord.avatar, 512);
						}
					}
				})
			);
		}

		return NextResponse.json(bots, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bots:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
