/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const caller = await resolveCallerAuth(req);
		if (!caller.isStaff && !caller.isSystemToken) {
			return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: caller.userId ? 403 : 401 });
		}

		const limitParam = parseInt(req.nextUrl.searchParams.get('limit') || '150', 10);
		const limit = Math.min(Math.max(limitParam || 150, 10), 500);
		const targetType = req.nextUrl.searchParams.get('targetType') || req.nextUrl.searchParams.get('category');

		const filter: Record<string, any> = {};
		if (targetType && targetType !== 'all') {
			filter.targetType = targetType;
		}

		const { models } = await database('xernerx');
		const logs = await models.core.AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
		return NextResponse.json({ data: logs });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
