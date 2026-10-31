/** @format */

import fs from 'fs';
import path from 'path';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'lighthouse_scores';

export interface LighthouseScoreRecord {
	seo: number;
	perf: number;
	a11y: number;
	bp: number;
	prevSeo?: number;
	prevPerf?: number;
	prevA11y?: number;
	prevBp?: number;
	updatedAt: number;
}

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

async function readStoredScores(): Promise<Record<string, LighthouseScoreRecord>> {
	try {
		const { models } = await database('xernerx');
		const doc = await models.core.Setting.findOne({ id: SETTING_KEY }).lean();
		if (doc && typeof (doc as any).value === 'string') {
			const parsed = JSON.parse((doc as any).value);
			if (parsed && typeof parsed === 'object') return parsed;
		}
	} catch {}
	return {};
}

async function writeStoredScores(scores: Record<string, LighthouseScoreRecord>): Promise<void> {
	try {
		const { models } = await database('xernerx');
		await models.core.Setting.findOneAndUpdate(
			{ id: SETTING_KEY },
			{
				id: SETTING_KEY,
				value: JSON.stringify(scores),
				valueType: 'json',
				description: 'Cached Chrome Lighthouse audit scores across Suite subdomains and environments.',
			},
			{ upsert: true, returnDocument: 'after' }
		);
	} catch {}
}

export async function GET(req: NextRequest) {
	try {
		const targetUrl = req.nextUrl.searchParams.get('url');
		const envKey = req.nextUrl.searchParams.get('key');

		// If no targetUrl is passed, return all stored Lighthouse scores from MongoDB
		if (!targetUrl) {
			const map = await readStoredScores();
			return NextResponse.json({ data: map });
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

		const currentMap = await readStoredScores();
		const storageKey = envKey || targetUrl;
		const previous = currentMap[storageKey];

		const entry: LighthouseScoreRecord = {
			seo: Math.round((cats.seo?.score ?? 0) * 100),
			perf: Math.round((cats.performance?.score ?? 0) * 100),
			a11y: Math.round((cats.accessibility?.score ?? 0) * 100),
			bp: Math.round((cats['best-practices']?.score ?? 0) * 100),
			...(previous
				? {
						prevSeo: previous.seo,
						prevPerf: previous.perf,
						prevA11y: previous.a11y,
						prevBp: previous.bp,
					}
				: {}),
			updatedAt: Date.now(),
		};

		currentMap[storageKey] = entry;
		await writeStoredScores(currentMap);

		return NextResponse.json({
			data: entry,
			map: currentMap,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
	}
}
