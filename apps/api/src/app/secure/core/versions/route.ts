/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getSuiteVersionsMap, SUITE_APPS } from '@/lib/suiteVersions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const changelogUrl = req.nextUrl.searchParams.get('changelogUrl');
		if (changelogUrl) {
			const parsed = new URL(changelogUrl);
			const host = parsed.hostname.toLowerCase();
			const isAllowed = host === 'xernerx.com' || host.endsWith('.xernerx.com') || host === 'localhost' || host === '127.0.0.1';
			if (!isAllowed) {
				return NextResponse.json({ error: 'Disallowed host' }, { status: 400 });
			}
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);
			const res = await fetch(`${parsed.origin}/api/changelog`, {
				signal: controller.signal,
				cache: 'no-store',
			});
			clearTimeout(timeout);
			if (!res.ok) {
				return NextResponse.json({ error: 'Changelog unavailable' }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json({ data });
		}

		const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
		const versionsMap = await getSuiteVersionsMap(refresh);
		const apps = SUITE_APPS.map((app) => versionsMap[app.id]);
		return NextResponse.json({ data: apps, map: versionsMap });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
