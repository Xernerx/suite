/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const limit = parseInt(url.searchParams.get('limit') || '50', 10);
		const privacy = url.searchParams.get('privacy') || 'public';
		const category = url.searchParams.get('category');
		const search = url.searchParams.get('search');
		const idsParam = url.searchParams.get('ids');

		const db = await database('xernerx');
		const GuildModel = db.models.guilds.Guild as any;

		let query: any = { privacy };

		if (idsParam) {
			const ids = idsParam.split(',').map((id) => id.trim());
			query = { id: { $in: ids } }; // If querying by explicit IDs, bypass privacy check
		} else if (search) {
			query.name = { $regex: search, $options: 'i' };
		}

		let sortOptions: any = { createdAt: -1 };

		if (category === 'top_voted') {
			sortOptions = { 'statsData.voteCount': -1 };
		} else if (category === 'biggest') {
			sortOptions = { 'statsData.members': -1 };
		} else if (category === 'newcomers') {
			sortOptions = { createdAt: -1 };
		} else if (category === 'promoted') {
			sortOptions = { 'statsData.voteCount': -1 };
			query.promoted = true;
		}

		const guilds = await GuildModel.aggregate([
			{ $match: query },
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
					computedVoteCount: { $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] },
				},
			},
			{ $sort: category === 'top_voted' || category === 'promoted' ? { computedVoteCount: -1 } : sortOptions },
			{ $limit: limit },
			{
				$project: {
					id: 1,
					name: 1,
					icon: 1,
					banner: 1,
					description: 1,
					voteCount: '$computedVoteCount',
					memberCount: { $ifNull: ['$statsData.members', 0] },
				},
			},
		]);

		return NextResponse.json(guilds, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch guilds list:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
