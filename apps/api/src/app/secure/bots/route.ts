/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const url = new URL(request.url);
		const category = url.searchParams.get('category');
		const owner = url.searchParams.get('owner');
		const limit = parseInt(url.searchParams.get('limit') || (owner ? '100' : '3'));
		const now = new Date();

		let matchStage: any = {};

		if (owner) {
			matchStage = { owners: owner };
		} else {
			matchStage.privacy = 'public';
			if (category === 'promoted') {
				matchStage.promotedUntil = { $gt: now };
			} else if (url.searchParams.get('search')) {
				const query = url.searchParams.get('search');
				matchStage.$or = [{ id: { $regex: query, $options: 'i' } }, { name: { $regex: query, $options: 'i' } }, { tags: { $regex: query, $options: 'i' } }];
			} else if (url.searchParams.get('tag')) {
				matchStage.tags = url.searchParams.get('tag');
			}
		}

		let sortStage: any = { createdAt: -1 };
		if (category === 'top_voted') {
			sortStage = { 'statsData.voteCount': -1 };
		} else if (category === 'biggest') {
			sortStage = { 'statsData.guildCount': -1 };
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
			{ $sort: sortStage },
			{ $limit: limit },
			{
				$project: {
					id: 1,
					name: 1,
					avatar: 1,
					description: 1,
					organization: 1,
					voteCount: { $ifNull: ['$statsData.voteCount', '$statsData.votes', 0] },
					stats: {
						$cond: {
							if: { $not: ['$statsData'] },
							then: null,
							else: {
								guildCount: { $ifNull: ['$statsData.guildCount', '$statsData.servers'] },
								userCount: { $ifNull: ['$statsData.userCount', '$statsData.users'] },
								shardCount: { $ifNull: ['$statsData.shardCount', '$statsData.shards'] },
								voteCount: { $ifNull: ['$statsData.voteCount', '$statsData.votes'] },
							},
						},
					},
				},
			},
		]);

		return NextResponse.json(bots, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bots:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
