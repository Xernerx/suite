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
			query.$or = [
				{ timestamp: { $gte: afterNumber } },
				{ timestamp: { $gte: new Date(afterNumber) } }
			];
		}

		// Fetch historical stats, sort descending to get newest first, then limit, then reverse to chronological order
		// Only select necessary fields to avoid hitting Vercel's 4.5MB payload limit
		const rawStats = await StatModel.find(query)
			.select('timestamp createdAt guildCount servers userCount users shardCount voteCount votes onlineSince')
			.sort({ timestamp: -1 })
			.limit(limit)
			.lean();
		const stats = rawStats.reverse();
		
		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
