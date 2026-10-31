/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { SUITE_APPS } from '@/lib/suiteVersions';
import {
	ensureStatusMonitorCronStarted,
	get24hBucketTimestamps,
	getCurrentBucketTs,
	pruneOldBuckets,
	recordAndGetStatusHistory,
	SETTING_KEY,
	type StatusBucketPoint,
	type StoredHistory,
} from '@/lib/statusMonitor';

export const dynamic = 'force-dynamic';

ensureStatusMonitorCronStarted();

export type { StatusBucketPoint };

export async function GET(req: NextRequest) {
	try {
		const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true' || req.nextUrl.searchParams.get('cron') === 'true';
		const result = await recordAndGetStatusHistory({ forceRefresh });
		return NextResponse.json(result);
	} catch (err) {
		console.error('Failed to GET 24h status history:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;

		const now = Date.now();
		const currentBucket = getCurrentBucketTs(now);
		const buckets = get24hBucketTimestamps(now);
		const cutoffTs = buckets[0];

		const settingDoc = await SettingModel.findOne({ id: SETTING_KEY }).lean();
		let stored: StoredHistory = { services: {}, bots: {} };
		if (settingDoc?.value) {
			try {
				const parsed = JSON.parse(settingDoc.value);
				if (parsed && typeof parsed === 'object') {
					stored = {
						services: parsed.services && typeof parsed.services === 'object' ? parsed.services : {},
						bots: parsed.bots && typeof parsed.bots === 'object' ? parsed.bots : {},
					};
				}
			} catch {}
		}

		const recordedBuckets = new Set<string>();
		for (const series of [...Object.values(stored.services), ...Object.values(stored.bots)]) {
			if (!series || typeof series !== 'object') continue;
			for (const [tsKey, pt] of Object.entries(series)) {
				if (Number(tsKey) >= cutoffTs && pt && pt.status && pt.status !== 'down' && pt.status !== 'offline' && pt.status !== 'empty') {
					recordedBuckets.add(tsKey);
				}
			}
		}

		if (Array.isArray(body?.services)) {
			for (const svc of body.services) {
				if (!svc?.id || !svc?.status || svc.status === 'checking') continue;
				stored.services[svc.id] = stored.services[svc.id] || {};
				const pingVal = typeof svc.ping === 'number' ? svc.ping : null;
				stored.services[svc.id][String(currentBucket)] = {
					status: String(svc.status),
					ping: pingVal,
				};
				if (svc.status === 'operational' || svc.status === 'degraded') {
					for (const bTsKey of recordedBuckets) {
						if (!stored.services[svc.id][bTsKey]) {
							stored.services[svc.id][bTsKey] = {
								status: 'operational',
								ping: pingVal,
							};
						}
					}
				}
			}
		}

		if (Array.isArray(body?.bots)) {
			for (const b of body.bots) {
				if (!b?.id || !b?.status) continue;
				stored.bots[b.id] = stored.bots[b.id] || {};
				stored.bots[b.id][String(currentBucket)] = {
					status: String(b.status),
					ping: typeof b.ping === 'number' ? b.ping : null,
				};
			}
		}

		pruneOldBuckets(stored.services, cutoffTs);
		pruneOldBuckets(stored.bots, cutoffTs);

		await SettingModel.findOneAndUpdate(
			{ id: SETTING_KEY },
			{
				$set: {
					id: SETTING_KEY,
					value: JSON.stringify(stored),
					valueType: 'json',
					description: 'Rolling 24-hour status & latency history for suite services and main org bots',
				},
			},
			{ upsert: true }
		);

		const servicesSeries: Record<string, StatusBucketPoint[]> = {};
		for (const app of SUITE_APPS) {
			const appMap = stored.services[app.id] || {};
			servicesSeries[app.id] = buckets.map((bTs) => {
				const pt = appMap[String(bTs)];
				return {
					timestamp: bTs,
					status: (pt?.status as StatusBucketPoint['status']) || 'empty',
					ping: pt?.ping ?? null,
				};
			});
		}

		const botsSeries: Record<string, StatusBucketPoint[]> = {};
		for (const botId of Object.keys(stored.bots)) {
			const botMap = stored.bots[botId] || {};
			botsSeries[botId] = buckets.map((bTs) => {
				const pt = botMap[String(bTs)];
				return {
					timestamp: bTs,
					status: (pt?.status as StatusBucketPoint['status']) || 'empty',
					ping: pt?.ping ?? null,
				};
			});
		}

		return NextResponse.json({
			buckets,
			services: servicesSeries,
			bots: botsSeries,
		});
	} catch (err) {
		console.error('Failed to POST 24h status history:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
