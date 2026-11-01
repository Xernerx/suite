/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichIssuesWithVersionStatus } from '@/lib/suiteVersions';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

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
		const caller = await resolveCallerAuth(req, ['manageIssues']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Issue management permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const body = await req.json();
		const { models } = await database('xernerx');
		const item = await models.core.Issue.create({
			id: crypto.randomUUID(),
			acknowledged: true,
			...body,
		});
		await recordAuditLog(req, {
			action: 'issue.created',
			targetType: 'issue',
			targetId: item.id,
			summary: `Logged issue "${item.title || item.id}"`,
		});
		return NextResponse.json({ data: item });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
