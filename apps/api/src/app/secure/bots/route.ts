/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(request: Request) {
	try {
		const db = await database('xernerx');
		const BotModel = db.models.profiles.bots;
		const StatModel = db.models.stats.bots;

		const url = new URL(request.url);
		const category = url.searchParams.get('category');
		const limit = parseInt(url.searchParams.get('limit') || '3');
		const now = new Date();

		let bots = [];

		if (category === 'promoted') {
			bots = await BotModel.find({ promotedUntil: { $gt: now } })
				.select(['id', 'name', 'avatar', 'description', 'voteCount'])
				.limit(limit)
				.lean();
		} else if (category === 'newcomers') {
			bots = await BotModel.find({}).sort({ createdAt: -1 }).select(['id', 'name', 'avatar', 'description', 'voteCount']).limit(limit).lean();
		} else if (category === 'top_voted') {
			bots = await BotModel.find({}).sort({ voteCount: -1 }).select(['id', 'name', 'avatar', 'description', 'voteCount']).limit(limit).lean();
		} else if (category === 'biggest') {
			const biggestStats = await StatModel.aggregate([
				{ $sort: { timestamp: -1 } },
				{ $group: { _id: '$id', guildCount: { $first: '$guildCount' } } },
				{ $sort: { guildCount: -1 } },
				{ $limit: limit },
			]);

			const biggestBotIds = biggestStats.map((stat: any) => stat._id);
			const rawBiggestProfiles = await BotModel.find({ id: { $in: biggestBotIds } })
				.select(['id', 'name', 'avatar', 'description', 'voteCount'])
				.lean();

			bots = biggestStats.map((stat: any) => rawBiggestProfiles.find((p: any) => p.id === stat._id)).filter(Boolean);
		} else if (url.searchParams.get('search')) {
			const query = url.searchParams.get('search');
			bots = await BotModel.find({
				$or: [{ id: { $regex: query, $options: 'i' } }, { name: { $regex: query, $options: 'i' } }, { tags: { $regex: query, $options: 'i' } }],
			})
				.select(['id', 'name', 'avatar', 'description', 'voteCount'])
				.limit(limit)
				.lean();
		} else if (url.searchParams.get('tag')) {
			// Fetch bots by a specific tag
			const tag = url.searchParams.get('tag');
			bots = await BotModel.find({ tags: tag }).select(['id', 'name', 'avatar', 'description', 'voteCount']).limit(limit).lean();
		} else {
			// Default list behavior
			bots = await BotModel.find({}).lean().select(['id', 'name', 'avatar', 'description', 'voteCount']);
		}

		return NextResponse.json(bots, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bots:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
