/** @format */

import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function resolvePageSpeedApiKey(): string | null {
	if (process.env.PAGESPEED_API_KEY) return process.env.PAGESPEED_API_KEY;
	if (process.env.NEXT_PUBLIC_PAGESPEED_API_KEY) return process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
	try {
		const candidates = [path.join(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '..', '.env')];
		for (const envPath of candidates) {
			if (fs.existsSync(envPath)) {
				const content = fs.readFileSync(envPath, 'utf8');
				const match = content.match(/^PAGESPEED_API_KEY=["']?([^"'\r\n]+)["']?/m);
				if (match?.[1]) return match[1].trim();
			}
		}
	} catch {}
	return null;
}

export async function GET(req: NextRequest) {
	try {
		const targetUrl = req.nextUrl.searchParams.get('url');
		if (!targetUrl) {
			return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
		}

		const apiKey = resolvePageSpeedApiKey();
		if (!apiKey) {
			return NextResponse.json({ error: 'PAGESPEED_API_KEY is not configured' }, { status: 500 });
		}

		const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=SEO&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&strategy=desktop&key=${encodeURIComponent(apiKey)}`;
		const psiRes = await fetch(psiUrl, { cache: 'no-store' });
		const psiData = await psiRes.json().catch(() => null);

		const cats = psiData?.lighthouseResult?.categories;
		if (!psiRes.ok || !cats) {
			return NextResponse.json({ error: psiData?.error?.message || 'PageSpeed Insights request failed' }, { status: psiRes.status || 502 });
		}

		return NextResponse.json({
			data: {
				seo: Math.round((cats.seo?.score ?? 0) * 100),
				perf: Math.round((cats.performance?.score ?? 0) * 100),
				a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
				bp: Math.round((cats['best-practices']?.score ?? 0) * 100),
				updatedAt: Date.now(),
			},
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
	}
}
