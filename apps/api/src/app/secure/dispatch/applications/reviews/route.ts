/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['applications_review', 'applications_manage']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Application review permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const { models } = await database('xernerx');
		const Application = models.dispatch.Application as any;

		// Fetch all applications, sorted by newest
		const applications = await Application.find({}).sort({ createdAt: -1 }).lean();

		return NextResponse.json(applications);
	} catch (err: any) {
		console.error('[API] Failed to fetch applications:', err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
