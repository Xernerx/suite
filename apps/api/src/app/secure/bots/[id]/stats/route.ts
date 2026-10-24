/** @format */

import { NextResponse } from 'next/server';
import { MEMBER_MILESTONE_THRESHOLDS, SERVER_MILESTONE_THRESHOLDS } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const limitParam = url.searchParams.get('limit');
		const afterParam = url.searchParams.get('after');

		const limit = limitParam !== null ? Math.max(1, parseInt(limitParam, 10) || 5000) : 5000;

		const db = await database('xernerx');
		const StatModel = (db.models.bots as any).Stat;

		const query: any = { id };
		if (afterParam) {
			const afterNumber = parseInt(afterParam, 10);
			query.$or = [{ timestamp: { $gte: afterNumber } }, { timestamp: { $gte: new Date(afterNumber) } }];
		}

		// Sort ascending by timestamp so milestone threshold crossings and downsampling cover the full history from oldest to newest
		const rawStats = await StatModel.find(query).select('timestamp guildCount servers userCount users shardCount voteCount votes onlineSince').sort({ timestamp: 1 }).lean();

		// Always preserve the exact first snapshot that crossed each server or member milestone threshold
		const mustKeepIndices = new Set<number>();
		if (rawStats.length > 0) {
			mustKeepIndices.add(0);
			mustKeepIndices.add(rawStats.length - 1);

			let nextServerIdx = 0;
			let nextMemberIdx = 0;

			for (let i = 0; i < rawStats.length; i++) {
				const s = rawStats[i] as any;
				const guilds = Number(s.guildCount ?? s.servers ?? 0) || 0;
				const users = Number(s.userCount ?? s.users ?? 0) || 0;

				while (nextServerIdx < SERVER_MILESTONE_THRESHOLDS.length && guilds >= SERVER_MILESTONE_THRESHOLDS[nextServerIdx]) {
					mustKeepIndices.add(i);
					nextServerIdx++;
				}
				while (nextMemberIdx < MEMBER_MILESTONE_THRESHOLDS.length && users >= MEMBER_MILESTONE_THRESHOLDS[nextMemberIdx]) {
					mustKeepIndices.add(i);
					nextMemberIdx++;
				}
			}
		}

		// Downsample to max 'limit' items to avoid payload size limits and frontend lag while keeping milestone crossings
		const stats = [];
		const step = Math.max(1, Math.ceil(rawStats.length / limit));
		for (let i = 0; i < rawStats.length; i++) {
			if (i % step === 0 || mustKeepIndices.has(i)) {
				stats.push(rawStats[i]);
			}
		}

		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
