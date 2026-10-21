/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSuiteVersionsMap, SUITE_APPS } from '@/lib/suiteVersions';

export const dynamic = 'force-dynamic';

const BUCKET_MS = 30 * 60 * 1000; // 30 minutes
const BUCKET_COUNT = 48; // 48 * 30m = 24 hours
const SETTING_KEY = 'system_status_history_24h';

export interface StatusBucketPoint {
	timestamp: number;
	status: 'operational' | 'degraded' | 'down' | 'online' | 'idle' | 'dnd' | 'offline' | 'empty';
	ping: number | null;
}

interface StoredHistory {
	services: Record<string, Record<string, { status: string; ping: number | null }>>;
	bots: Record<string, Record<string, { status: string; ping: number | null }>>;
}

function getCurrentBucketTs(now = Date.now()): number {
	return Math.floor(now / BUCKET_MS) * BUCKET_MS;
}

function get24hBucketTimestamps(now = Date.now()): number[] {
	const currentBucket = getCurrentBucketTs(now);
	const buckets: number[] = [];
	for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
		buckets.push(currentBucket - i * BUCKET_MS);
	}
	return buckets;
}

function pruneOldBuckets(map: Record<string, Record<string, { status: string; ping: number | null }>>, cutoffTs: number) {
	for (const key of Object.keys(map)) {
		const series = map[key];
		if (!series || typeof series !== 'object') continue;
		for (const tsKey of Object.keys(series)) {
			if (Number(tsKey) < cutoffTs) {
				delete series[tsKey];
			}
		}
	}
}

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;
		const BotModel = (models.bots as any).Bot;
		const StatModel = (models.bots as any).Stat;

		const now = Date.now();
		const currentBucket = getCurrentBucketTs(now);
		const buckets = get24hBucketTimestamps(now);
		const cutoffTs = buckets[0];

		const [settingDoc, mainOrgSetting, versionsMap] = await Promise.all([
			SettingModel.findOne({ id: SETTING_KEY }).lean(),
			SettingModel.findOne({ id: 'main_org_id' }).lean(),
			getSuiteVersionsMap().catch(() => ({}) as Record<string, any>),
		]);

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

		// Record current bucket for Suite Apps from versionsMap
		for (const app of SUITE_APPS) {
			const info = versionsMap[app.id];
			if (!info) continue;
			const ping = info.devLatencyMs ?? info.prodLatencyMs ?? info.canaryLatencyMs ?? null;
			const isUp = Boolean(info.devVersion || info.prodVersion || info.canaryVersion);
			if (!isUp && ping === null) continue;

			const status = !isUp ? 'down' : ping && ping > 1200 ? 'degraded' : 'operational';
			stored.services[app.id] = stored.services[app.id] || {};
			stored.services[app.id][String(currentBucket)] = { status, ping };
		}

		// Record & backfill Main Org Bots
		const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
		const orgBots = mainOrgId && BotModel ? await BotModel.find({ organization: mainOrgId }).lean() : [];
		const botIds = orgBots.map((b: any) => String(b.id)).filter(Boolean);

		if (botIds.length > 0 && StatModel) {
			const recentStats = await StatModel.find({
				id: { $in: botIds },
				timestamp: { $gte: new Date(cutoffTs) },
			})
				.select('id timestamp')
				.lean()
				.catch(() => []);

			for (const stat of recentStats) {
				const botId = String(stat.id);
				const ts = new Date(stat.timestamp).getTime();
				if (isNaN(ts)) continue;
				const bTs = getCurrentBucketTs(ts);
				stored.bots[botId] = stored.bots[botId] || {};
				if (!stored.bots[botId][String(bTs)]) {
					stored.bots[botId][String(bTs)] = { status: 'online', ping: null };
				}
			}
		}

		for (const bot of orgBots) {
			const botId = String(bot.id);
			stored.bots[botId] = stored.bots[botId] || {};
			if (bot.status) {
				stored.bots[botId][String(currentBucket)] = {
					status: bot.status,
					ping: null,
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
		).catch(() => null);

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
		for (const botId of botIds) {
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

		if (Array.isArray(body?.services)) {
			for (const svc of body.services) {
				if (!svc?.id || !svc?.status || svc.status === 'checking') continue;
				stored.services[svc.id] = stored.services[svc.id] || {};
				stored.services[svc.id][String(currentBucket)] = {
					status: String(svc.status),
					ping: typeof svc.ping === 'number' ? svc.ping : null,
				};
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
