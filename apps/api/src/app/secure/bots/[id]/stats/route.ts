/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const limitParam = url.searchParams.get('limit');
		const afterParam = url.searchParams.get('after');

		const limit = limitParam ? parseInt(limitParam, 10) : 5000;

		const db = (await database('xernerx')).models.stats.bots;

		let query: any = { id };
		if (afterParam) {
			query.timestamp = { $gte: Number(afterParam) };
		}

		const stats = await db.find(query).sort({ timestamp: -1 }).limit(limit).lean();

		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();

		const db = (await database('xernerx')).models.stats.bots;

		// Create a new stat snapshot
		const stat = await db.create({
			id,
			timestamp: body.timestamp || Date.now(),
			onlineSince: body.onlineSince || 0,
			guildCount: body.guildCount || 0,
			userCount: body.userCount || 0,
			shardCount: body.shardCount || 0,
			voteCount: body.voteCount || 0,
			shards: body.shards || [],
		});

		return NextResponse.json(stat, { status: 201 });
	} catch (error) {
		console.error('Failed to post bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
