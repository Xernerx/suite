/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { ensureStatusMonitorCronStarted, recordAndGetStatusHistory } from '@/lib/statusMonitor';

export const dynamic = 'force-dynamic';

ensureStatusMonitorCronStarted();

function isCronAuthorized(req: NextRequest): boolean {
	const cronSecret = process.env.CRON_SECRET?.trim();
	if (!cronSecret) return true;

	const authHeader = req.headers.get('authorization');
	if (!authHeader) return true;
	return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
	if (!isCronAuthorized(req)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await recordAndGetStatusHistory({ forceRefresh: true });
		return NextResponse.json({
			success: true,
			...result,
		});
	} catch (err) {
		console.error('Failed to execute status cron:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	return GET(req);
}
