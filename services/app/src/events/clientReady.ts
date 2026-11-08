/** @format */

import { createLogger, database, dispatchBotStatusWebhooks, processDueGiveaways } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { syncBotCommands, updateBotPresence } from '../lib/botUtils.js';
import { syncMainServerBotIconEmojis } from '../lib/botIconEmojis.js';
import { processDueScheduledAnnouncements } from '../lib/scheduledAnnouncements.js';

const appBotLog = createLogger('APP-BOT');

const SUITE_SERVICES = [
	{ id: 'www', host: 'www.xernerx.com', devPort: 4000 },
	{ id: 'app', host: 'app.xernerx.com', devPort: 4004 },
	{ id: 'portal', host: 'portal.xernerx.com', devPort: 4009 },
	{ id: 'account', host: 'account.xernerx.com', devPort: 4003 },
	{ id: 'store', host: 'store.xernerx.com', devPort: 4008 },
	{ id: 'info', host: 'info.xernerx.com', devPort: 4007 },
	{ id: 'docs', host: 'docs.xernerx.com', devPort: 4005 },
	{ id: 'admin', host: 'admin.xernerx.com', devPort: 4006 },
	{ id: 'hosting', host: 'hosting.xernerx.com', devPort: 4010 },
	{ id: 'haste', host: 'haste.xernerx.com', devPort: 4011 },
	{ id: 'api', host: 'api.xernerx.com', devPort: 4001 },
	{ id: 'cdn', host: 'cdn.xernerx.com', devPort: 4002 },
] as const;

async function probeServiceEndpoint(url: string, timeoutMs = 4500): Promise<{ ok: boolean; ping: number | null }> {
	const start = Date.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, {
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!res.ok) return { ok: false, ping: null };
		const data = (await res.json().catch(() => null)) as any;
		if (!data?.version) return { ok: false, ping: null };
		return { ok: true, ping: Date.now() - start };
	} catch {
		return { ok: false, ping: null };
	}
}

export default class AppClientReadyEvent extends EventBuilder {
	constructor() {
		super('clientReady', {
			name: 'clientReady',
			emitter: 'client',
			once: false,
		});
	}

	override async run() {
		updateBotPresence(this.client);
		this.updateBotStatuses();
		syncMainServerBotIconEmojis(this.client);
		syncBotCommands(this.client, process.env.XERNERX_APP_TOKEN || process.env.XERNERX_TOKEN);
	}

	async updateBotStatuses() {
		try {
			const db = await database('xernerx');
			const SettingModel = (db.models.core as any).Setting;
			const BotModel = (db.models.bots as any).Bot;
			const HookModel = (db.models.bots as any).Hook;

			const [mainOrgSetting, adminServerSetting, statusHookBotIds] = await Promise.all([
				SettingModel.findOne({ id: 'main_org_id' }).lean(),
				SettingModel.findOne({ id: 'admin_server_id' }).lean(),
				HookModel ? HookModel.distinct('botId', { events: { $in: ['POST online', 'POST offline'] } }).catch(() => []) : Promise.resolve([]),
			]);

			const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
			const adminServerId = adminServerSetting?.value ? String(adminServerSetting.value) : null;

			const bucketMs = 30 * 60 * 1000;
			const currentBucket = String(Math.floor(Date.now() / bucketMs) * bucketMs);
			const cutoffTs = Number(currentBucket) - 48 * bucketMs;

			const historyDoc = await SettingModel.findOne({ id: 'system_status_history_24h' }).lean();
			let storedHistory: { services: Record<string, any>; bots: Record<string, any> } = { services: {}, bots: {} };
			if (historyDoc?.value) {
				try {
					const parsed = JSON.parse(historyDoc.value);
					if (parsed && typeof parsed === 'object') {
						storedHistory = {
							services: parsed.services || {},
							bots: parsed.bots || {},
						};
					}
				} catch {}
			}

			const recordedBuckets = new Set<string>();
			for (const series of [...Object.values(storedHistory.services), ...Object.values(storedHistory.bots)]) {
				if (!series || typeof series !== 'object') continue;
				for (const [tsKey, pt] of Object.entries(series as Record<string, any>)) {
					if (Number(tsKey) >= cutoffTs && pt && pt.status && pt.status !== 'down' && pt.status !== 'offline' && pt.status !== 'empty') {
						recordedBuckets.add(tsKey);
					}
				}
			}

			const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development';
			const isCanaryEnv = process.env.ENVIRONMENT?.toLowerCase() === 'canary';
			await Promise.all(
				SUITE_SERVICES.map(async (svc) => {
					const urls = isDevEnv
						? [`http://127.0.0.1:${svc.devPort}/api/version`, `https://${svc.id}.canary.xernerx.com/api/version`, `https://${svc.host}/api/version`]
						: isCanaryEnv
							? [`https://${svc.id}.canary.xernerx.com/api/version`, `https://${svc.host}/api/version`]
							: [`https://${svc.host}/api/version`, `https://${svc.id}.canary.xernerx.com/api/version`];

					let ok = false;
					let ping: number | null = null;
					for (const url of urls) {
						const probe = await probeServiceEndpoint(url, isDevEnv && url.includes('127.0.0.1') ? 2000 : 4500);
						if (probe.ok) {
							ok = true;
							ping = probe.ping;
							break;
						}
					}

					const status = !ok ? 'down' : ping !== null && ping > 1200 ? 'degraded' : 'operational';
					storedHistory.services[svc.id] = storedHistory.services[svc.id] || {};
					storedHistory.services[svc.id][currentBucket] = { status, ping };
					if (ok) {
						for (const bTsKey of recordedBuckets) {
							if (!storedHistory.services[svc.id][bTsKey]) {
								storedHistory.services[svc.id][bTsKey] = { status: 'operational', ping };
							}
						}
					}
					for (const tsKey of Object.keys(storedHistory.services[svc.id])) {
						if (Number(tsKey) < cutoffTs) delete storedHistory.services[svc.id][tsKey];
					}
				})
			);

			const botQueryOr: any[] = [];
			if (mainOrgId) botQueryOr.push({ organization: mainOrgId });
			if (Array.isArray(statusHookBotIds) && statusHookBotIds.length > 0) {
				botQueryOr.push({ id: { $in: statusHookBotIds.map(String) } });
			}

			const orgBots = botQueryOr.length > 0 && BotModel ? await BotModel.find({ $or: botQueryOr }).lean() : [];
			const botIds = orgBots.map((b: any) => String(b.id)).filter(Boolean);

			const orderedGuilds = [
				...(adminServerId && this.client.guilds.cache.has(adminServerId) ? [this.client.guilds.cache.get(adminServerId)!] : []),
				...Array.from(this.client.guilds.cache.values()).filter((g) => g.id !== adminServerId),
			];

			if (botIds.length > 0) {
				for (const guild of orderedGuilds.slice(0, 5)) {
					await guild.members.fetch({ user: botIds, withPresences: true }).catch(() => null);
				}
			}

			for (const botDoc of orgBots) {
				const botId = String(botDoc.id);
				let status: 'online' | 'idle' | 'dnd' | 'offline' = 'offline';
				let activity = '';
				let isMemberInAnyGuild = false;

				if (botId === this.client.user?.id) {
					isMemberInAnyGuild = true;
					const rawSelfStatus = this.client.user?.presence?.status;
					status = rawSelfStatus === 'idle' || rawSelfStatus === 'dnd' ? rawSelfStatus : 'online';
					activity = this.client.user?.presence?.activities?.[0]?.state || this.client.user?.presence?.activities?.[0]?.name || '';
				} else {
					for (const guild of orderedGuilds) {
						if (guild.members.cache.has(botId) || guild.presences?.cache?.has(botId)) {
							isMemberInAnyGuild = true;
						}
						const presence = guild.presences?.cache?.get(botId) || guild.members.cache.get(botId)?.presence;
						if (presence && presence.status && presence.status !== 'offline' && presence.status !== 'invisible') {
							status = presence.status === 'idle' || presence.status === 'dnd' ? presence.status : 'online';
							activity = presence.activities?.[0]?.state || presence.activities?.[0]?.name || '';
							break;
						}
					}
					if (!isMemberInAnyGuild && botDoc.status) {
						status = botDoc.status;
						activity = botDoc.activity || '';
					}
				}

				if (mainOrgId && String(botDoc.organization) === mainOrgId) {
					storedHistory.bots[botId] = storedHistory.bots[botId] || {};
					storedHistory.bots[botId][currentBucket] = { status, ping: null };
					for (const tsKey of Object.keys(storedHistory.bots[botId])) {
						if (Number(tsKey) < cutoffTs) delete storedHistory.bots[botId][tsKey];
					}
				}

				if (isMemberInAnyGuild) {
					const prevBot = await BotModel.findOneAndUpdate(
						{ id: botId },
						{
							$set: {
								status,
								statusUpdatedAt: new Date(),
								activity,
							},
						},
						{ returnDocument: 'before' }
					).lean();

					if (prevBot) {
						await dispatchBotStatusWebhooks(prevBot, status, prevBot.status, activity);
					}
				}
			}

			await SettingModel.findOneAndUpdate(
				{ id: 'system_status_history_24h' },
				{
					$set: {
						id: 'system_status_history_24h',
						value: JSON.stringify(storedHistory),
						valueType: 'json',
						description: 'Rolling 24-hour status & latency history for suite services and main org bots',
					},
				},
				{ upsert: true }
			);
			await processDueScheduledAnnouncements(this.client);
			await processDueGiveaways();
		} catch (error) {
			appBotLog.error(`Failed to sync main org bot statuses: ${(error as any)?.message || error}`);
		}

		setTimeout(() => this.updateBotStatuses(), 60_000);
	}
}
