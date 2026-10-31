/** @format */

import { database } from '@xernerx/lib/server';
import { getSuiteVersionsMap, SUITE_APPS } from '@/lib/suiteVersions';

export const BUCKET_MS = 30 * 60 * 1000; // 30 minutes
export const BUCKET_COUNT = 48; // 48 * 30m = 24 hours
export const SETTING_KEY = 'system_status_history_24h';
const CRON_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface StatusBucketPoint {
	timestamp: number;
	status: 'operational' | 'degraded' | 'down' | 'online' | 'idle' | 'dnd' | 'offline' | 'empty';
	ping: number | null;
}

export interface LiveServiceSnapshot {
	id: string;
	name: string;
	domain: string;
	status: 'operational' | 'degraded' | 'down';
	version: string | null;
	ping: number | null;
}

export interface StoredHistory {
	services: Record<string, Record<string, { status: string; ping: number | null }>>;
	bots: Record<string, Record<string, { status: string; ping: number | null }>>;
}

export function getCurrentBucketTs(now = Date.now()): number {
	return Math.floor(now / BUCKET_MS) * BUCKET_MS;
}

export function get24hBucketTimestamps(now = Date.now()): number[] {
	const currentBucket = getCurrentBucketTs(now);
	const buckets: number[] = [];
	for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
		buckets.push(currentBucket - i * BUCKET_MS);
	}
	return buckets;
}

export function pruneOldBuckets(map: Record<string, Record<string, { status: string; ping: number | null }>>, cutoffTs: number) {
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

export async function recordAndGetStatusHistory(options?: { forceRefresh?: boolean }) {
	const forceRefresh = Boolean(options?.forceRefresh);
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
		getSuiteVersionsMap(forceRefresh).catch(() => ({}) as Record<string, any>),
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

	// Collect timestamps where the daemon already recorded service or bot heartbeats in the last 24h
	const daemonRecordedBuckets = new Set<string>();
	for (const series of [...Object.values(stored.services), ...Object.values(stored.bots)]) {
		if (!series || typeof series !== 'object') continue;
		for (const [tsKey, pt] of Object.entries(series)) {
			if (Number(tsKey) >= cutoffTs && pt && pt.status && pt.status !== 'down' && pt.status !== 'offline' && pt.status !== 'empty') {
				daemonRecordedBuckets.add(tsKey);
			}
		}
	}

	const liveServices: Record<string, LiveServiceSnapshot> = {};

	// Record current bucket for Suite Apps from versionsMap (falling back to daemon telemetry if edge fetch is blocked)
	for (const app of SUITE_APPS) {
		const info = versionsMap[app.id];
		const existingSeries = stored.services[app.id] || {};
		const existingKeys = Object.keys(existingSeries).sort((a, b) => Number(b) - Number(a));
		const latestStored = existingKeys.length > 0 ? existingSeries[existingKeys[0]] : null;

		const ping = info ? (info.devLatencyMs ?? info.prodLatencyMs ?? info.canaryLatencyMs ?? latestStored?.ping ?? null) : (latestStored?.ping ?? null);
		const version = info ? (info.localVersion ?? info.devVersion ?? info.prodVersion ?? info.canaryVersion ?? null) : null;
		const isUp = Boolean(version || (latestStored?.status && latestStored.status !== 'down') || daemonRecordedBuckets.size > 0);
		const status: 'operational' | 'degraded' | 'down' = !isUp ? 'down' : ping && ping > 1200 ? 'degraded' : 'operational';

		liveServices[app.id] = {
			id: app.id,
			name: app.name,
			domain: app.domain,
			status,
			version,
			ping,
		};

		stored.services[app.id] = existingSeries;
		if (isUp || ping !== null) {
			if (version || !stored.services[app.id][String(currentBucket)]) {
				stored.services[app.id][String(currentBucket)] = { status, ping };
			}

			// Backfill missing buckets where the suite daemon was active before website cron tracking began
			if (isUp) {
				for (const bTsKey of daemonRecordedBuckets) {
					if (!stored.services[app.id][bTsKey]) {
						stored.services[app.id][bTsKey] = { status: 'operational', ping };
					}
				}
			}
		}
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

	return {
		timestamp: now,
		currentBucket,
		buckets,
		services: servicesSeries,
		bots: botsSeries,
		liveServices,
	};
}

const globalForStatusCron = globalThis as unknown as {
	__xernerxStatusCronStarted?: boolean;
	__xernerxStatusCronTimer?: ReturnType<typeof setInterval>;
};

export function ensureStatusMonitorCronStarted() {
	if (globalForStatusCron.__xernerxStatusCronStarted) return;
	globalForStatusCron.__xernerxStatusCronStarted = true;

	const timer = setInterval(() => {
		recordAndGetStatusHistory({ forceRefresh: true }).catch(() => null);
	}, CRON_INTERVAL_MS);

	if (typeof (timer as any)?.unref === 'function') {
		(timer as any).unref();
	}
	globalForStatusCron.__xernerxStatusCronTimer = timer;
}
