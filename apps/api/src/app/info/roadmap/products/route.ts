import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');

		// Fetch unique product IDs from both Issues and RoadmapItems
		const roadmapProducts = await models.core.RoadmapItem.distinct('productId');
		const issueProducts = await models.core.Issue.distinct('productId');

		const uniqueProducts = [...new Set([...roadmapProducts, ...issueProducts])].filter(Boolean);

		return NextResponse.json({ data: uniqueProducts });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
