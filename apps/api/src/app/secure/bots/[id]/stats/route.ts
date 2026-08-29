/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const limitParam = url.searchParams.get('limit');
		const afterParam = url.searchParams.get('after');

		const limit = limitParam !== null ? parseInt(limitParam, 10) : 5000;

		const db = await database('xernerx');
		const StatModel = (db.models.bots as any).Stat;

		const query: any = { id };
		if (afterParam) {
			const afterNumber = parseInt(afterParam, 10);
			query.$or = [{ timestamp: { $gte: afterNumber } }, { timestamp: { $gte: new Date(afterNumber) } }];
		}

		let rawStatsQuery = StatModel.find(query).select('timestamp createdAt guildCount servers userCount users shardCount voteCount votes onlineSince').sort({ timestamp: -1 });

		if (limitParam !== null) {
			rawStatsQuery = rawStatsQuery.limit(limit);
		}

		const rawStats = await rawStatsQuery.lean();

		// Downsample to max 'limit' items to avoid payload size limits and frontend lag
		const downsampled = [];
		const step = Math.max(1, Math.ceil(rawStats.length / limit));
		for (let i = 0; i < rawStats.length; i += step) {
			downsampled.push(rawStats[i]);
		}

		const stats = downsampled.reverse();

		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
