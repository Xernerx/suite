/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getSuiteVersionsMap, SUITE_APPS } from '@/lib/suiteVersions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
		const versionsMap = await getSuiteVersionsMap(refresh);
		const apps = SUITE_APPS.map((app) => versionsMap[app.id]);
		return NextResponse.json({ data: apps, map: versionsMap });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
