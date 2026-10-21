/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const session = (await getServerSession(auth)) as any;
		const userId = session?.user?.id || body.userId;

		if (!userId) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
		}

		const action = body.action === 'watch' ? 'watch' : 'upvote';
		const { models } = await database('xernerx');
		const item = (await models.core.RoadmapItem.findOne({ id }).lean()) as any;

		if (!item) {
			return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 });
		}

		const currentUpvotes: string[] = Array.isArray(item.upvotes) ? item.upvotes : [];
		const currentWatchers: string[] = Array.isArray(item.watchers) ? item.watchers : [];

		let nextUpvotes = currentUpvotes;
		let nextWatchers = currentWatchers;

		if (action === 'upvote') {
			if (currentUpvotes.includes(userId)) {
				nextUpvotes = currentUpvotes.filter((u) => u !== userId);
			} else {
				nextUpvotes = [...currentUpvotes, userId];
			}
		} else {
			if (currentWatchers.includes(userId)) {
				nextWatchers = currentWatchers.filter((u) => u !== userId);
			} else {
				nextWatchers = [...currentWatchers, userId];
			}
		}

		const updated = await models.core.RoadmapItem.findOneAndUpdate({ id }, { $set: { upvotes: nextUpvotes, watchers: nextWatchers } }, { returnDocument: 'after' }).lean();

		return NextResponse.json({
			data: updated,
			upvoted: nextUpvotes.includes(userId),
			watching: nextWatchers.includes(userId),
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
