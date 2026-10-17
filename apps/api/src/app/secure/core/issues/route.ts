/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichIssuesWithVersionStatus } from '@/lib/suiteVersions';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const items = await models.core.Issue.find().sort({ createdAt: -1 }).lean();
		const enriched = await enrichIssuesWithVersionStatus(items);
		return NextResponse.json({ data: enriched });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const item = await models.core.Issue.create({
			id: crypto.randomUUID(),
			acknowledged: true,
			...body,
		});
		return NextResponse.json({ data: item });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
