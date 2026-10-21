/** @format */

import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { enrichIssuesWithVersionStatus } from '@/lib/suiteVersions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');

		const url = new URL(req.url);
		const acknowledged = url.searchParams.get('acknowledged');
		const status = url.searchParams.get('status');

		const filter: any = {};
		if (acknowledged === 'true') {
			filter.acknowledged = true;
		} else if (acknowledged === 'false') {
			filter.acknowledged = false;
		}

		if (status && status !== 'open') {
			if (status === 'submitted') {
				filter.status = { $ne: 'resolved' };
				filter.acknowledged = false;
			} else if (status === 'verified') {
				filter.status = { $ne: 'resolved' };
				filter.acknowledged = true;
			} else {
				filter.status = status;
			}
		}

		const rawIssues = await models.core.Issue.find(filter).sort({ createdAt: -1 }).lean();
		const enriched = await enrichIssuesWithVersionStatus(rawIssues);

		const issues =
			status === 'open' ? enriched.filter((issue: any) => issue.status !== 'resolved' || (issue.resolvedApp && issue.resolvedVersion && issue.releaseStatus !== 'production')) : enriched;

		return NextResponse.json({ data: issues });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();

		if (!body.title?.trim() || !body.description?.trim() || !body.productId) {
			return NextResponse.json({ error: 'Title, description, and product are required' }, { status: 400 });
		}

		const { models } = await database('xernerx');

		// Prevent duplicates
		const existing = await models.core.Issue.findOne({ title: body.title });
		if (existing) {
			return NextResponse.json({ error: 'A bug report with this title already exists' }, { status: 409 });
		}

		const issue = await models.core.Issue.create({
			id: crypto.randomUUID(),
			authorId: session.user.id,
			title: body.title,
			description: body.description,
			productId: body.productId,
			botId: body.botId || null,
			status: 'open',
			acknowledged: false, // Default to unacknowledged for admin review
		});

		return NextResponse.json({ data: issue });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
