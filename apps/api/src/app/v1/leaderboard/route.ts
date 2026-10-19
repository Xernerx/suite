/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const { models } = await database('xernerx');

		// 1. Strictly fetch ONLY users who have explicitly set privacy === 'public'
		const publicUsers = (await models.users.User.find({ privacy: 'public' }).select('id name icon verified description').lean()) as any[];
		const publicUserMap = new Map<string, any>();
		for (const u of publicUsers) {
			if (u?.id) publicUserMap.set(String(u.id), u);
		}
		const publicUserIds = Array.from(publicUserMap.keys());

		const BotModel = (models.bots as any).Bot;
		const GuildModel = (models.guilds as any).Guild;

		// 2. Fetch Top Public Bots, Top Public Servers, and Top Public User Streaks in parallel
		// Strictly enforce { privacy: 'public' } across bots, servers, and users
		const [bots, servers, rawCredits] = await Promise.all([
			BotModel.aggregate([
				{ $match: { privacy: 'public' } },
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
						as: 'voteData',
					},
				},
				{
					$addFields: {
						computedVoteCount: {
							$max: [
								{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] },
								{ $ifNull: ['$statsData.voteCount', 0] },
								{ $ifNull: ['$statsData.votes', 0] },
								{ $ifNull: ['$voteCount', 0] },
							],
						},
						computedGuildCount: {
							$ifNull: ['$statsData.guildCount', { $ifNull: ['$statsData.servers', 0] }],
						},
						computedUserCount: {
							$ifNull: ['$statsData.userCount', { $ifNull: ['$statsData.users', 0] }],
						},
					},
				},
				{ $sort: { computedVoteCount: -1, computedGuildCount: -1, computedUserCount: -1 } },
				{ $limit: 30 },
				{
					$project: {
						_id: 0,
						id: 1,
						name: 1,
						avatar: 1,
						description: 1,
						verified: { $ifNull: ['$verified', false] },
						tags: { $ifNull: ['$tags', []] },
						voteCount: '$computedVoteCount',
						guildCount: '$computedGuildCount',
						userCount: '$computedUserCount',
					},
				},
			]),
			GuildModel.aggregate([
				{ $match: { privacy: 'public' } },
				{
					$lookup: {
						from: 'stats',
						let: { guildId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$id', '$$guildId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
						as: 'statsData',
					},
				},
				{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'votes',
						let: { guildId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$guildId', '$$guildId'] } } }, { $count: 'count' }],
						as: 'voteData',
					},
				},
				{
					$addFields: {
						computedVoteCount: {
							$max: [{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] }, { $ifNull: ['$statsData.voteCount', 0] }, { $ifNull: ['$voteCount', 0] }],
						},
						computedMemberCount: {
							$max: [{ $ifNull: ['$statsData.members', 0] }, { $ifNull: ['$memberCount', 0] }],
						},
					},
				},
				{ $sort: { computedVoteCount: -1, computedMemberCount: -1 } },
				{ $limit: 30 },
				{
					$project: {
						_id: 0,
						id: 1,
						name: 1,
						icon: 1,
						banner: 1,
						description: 1,
						verified: { $ifNull: ['$verified', false] },
						bot: { $ifNull: ['$bot', false] },
						voteCount: '$computedVoteCount',
						memberCount: '$computedMemberCount',
					},
				},
			]),
			publicUserIds.length > 0
				? (models.users.Credit.find({ ownerId: { $in: publicUserIds } })
						.sort({ streak: -1, balance: -1 })
						.limit(30)
						.lean() as Promise<any[]>)
				: Promise.resolve([]),
		]);

		const streaks = (rawCredits || [])
			.filter((c: any) => publicUserMap.has(String(c.ownerId)))
			.map((c: any) => {
				const u = publicUserMap.get(String(c.ownerId));
				return {
					id: String(c.ownerId),
					name: u?.name || null,
					icon: u?.icon || null,
					description: u?.description || '',
					verified: Boolean(u?.verified),
					streak: c.streak || 0,
					balance: c.balance || 0,
				};
			});

		return NextResponse.json({
			bots: bots || [],
			servers: servers || [],
			streaks,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
