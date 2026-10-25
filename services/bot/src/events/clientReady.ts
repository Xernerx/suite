/** @format */

import { database } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { DEFAULT_XERNERX_COLOR, syncBotCommands, updateBotPresence } from '../lib/botUtils.js';

const SUITE_SERVICES = [
	{ id: 'www', host: 'www.xernerx.com', devPort: 4000 },
	{ id: 'app', host: 'app.xernerx.com', devPort: 4004 },
	{ id: 'account', host: 'account.xernerx.com', devPort: 4003 },
	{ id: 'store', host: 'store.xernerx.com', devPort: 4008 },
	{ id: 'info', host: 'info.xernerx.com', devPort: 4007 },
	{ id: 'docs', host: 'docs.xernerx.com', devPort: 4005 },
	{ id: 'admin', host: 'admin.xernerx.com', devPort: 4006 },
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
		return { ok: true, ping: Date.now() - start };
	} catch {
		return { ok: false, ping: null };
	}
}

export default class BotClientReadyEvent extends EventBuilder {
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
		syncBotCommands(this.client, process.env.XERNERX_TOKEN);

		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		this.updateStats();
		this.updateGuilds();
	}

	async updateBotStatuses() {
		try {
			const db = await database('xernerx');
			const SettingModel = (db.models.core as any).Setting;
			const BotModel = (db.models.bots as any).Bot;

			const [mainOrgSetting, adminServerSetting] = await Promise.all([SettingModel.findOne({ id: 'main_org_id' }).lean(), SettingModel.findOne({ id: 'admin_server_id' }).lean()]);

			const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
			const adminServerId = adminServerSetting?.value ? String(adminServerSetting.value) : null;

			const orgBots = mainOrgId && BotModel ? await BotModel.find({ organization: mainOrgId }).lean() : [];
			const botIds = orgBots.map((b: any) => String(b.id)).filter(Boolean);

			// Prioritize fetching presences from the main admin server, then any other cached guild
			const orderedGuilds = [
				...(adminServerId && this.client.guilds.cache.has(adminServerId) ? [this.client.guilds.cache.get(adminServerId)!] : []),
				...Array.from(this.client.guilds.cache.values()).filter((g) => g.id !== adminServerId),
			];

			if (botIds.length > 0) {
				for (const guild of orderedGuilds.slice(0, 5)) {
					await guild.members.fetch({ user: botIds, withPresences: true }).catch(() => null);
				}
			}

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

			// Probe all 9 suite web services and record current 30m bucket
			const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development';
			await Promise.all(
				SUITE_SERVICES.map(async (svc) => {
					const urls = isDevEnv
						? [`http://127.0.0.1:${svc.devPort}/api/version`, `https://${svc.id}.canary.xernerx.com/api/version`, `https://${svc.host}/api/version`]
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
					for (const tsKey of Object.keys(storedHistory.services[svc.id])) {
						if (Number(tsKey) < cutoffTs) delete storedHistory.services[svc.id][tsKey];
					}
				})
			);

			for (const botDoc of orgBots) {
				const botId = String(botDoc.id);
				let status: 'online' | 'idle' | 'dnd' | 'offline' = 'offline';
				let activity = '';

				if (botId === this.client.user?.id) {
					const rawSelfStatus = this.client.user?.presence?.status;
					status = rawSelfStatus === 'idle' || rawSelfStatus === 'dnd' ? rawSelfStatus : 'online';
					activity = this.client.user?.presence?.activities?.[0]?.state || this.client.user?.presence?.activities?.[0]?.name || '';
				} else {
					for (const guild of orderedGuilds) {
						const presence = guild.presences?.cache?.get(botId) || guild.members.cache.get(botId)?.presence;
						if (presence && presence.status && presence.status !== 'offline' && presence.status !== 'invisible') {
							status = presence.status === 'idle' || presence.status === 'dnd' ? presence.status : 'online';
							activity = presence.activities?.[0]?.state || presence.activities?.[0]?.name || '';
							break;
						}
					}
					const recentlySelfReported = botDoc.statusUpdatedAt && Date.now() - new Date(botDoc.statusUpdatedAt).getTime() < 2 * 60 * 1000 && botDoc.status && botDoc.status !== 'offline';
					if (status === 'offline' && recentlySelfReported) {
						status = botDoc.status;
						activity = botDoc.activity || '';
					}
				}

				storedHistory.bots[botId] = storedHistory.bots[botId] || {};
				storedHistory.bots[botId][currentBucket] = { status, ping: null };
				for (const tsKey of Object.keys(storedHistory.bots[botId])) {
					if (Number(tsKey) < cutoffTs) delete storedHistory.bots[botId][tsKey];
				}

				await BotModel.findOneAndUpdate(
					{ id: botId },
					{
						$set: {
							status,
							statusUpdatedAt: new Date(),
							activity,
						},
					}
				);
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
		} catch (error) {
			console.error('Failed to sync main org bot statuses:', error);
		}

		setTimeout(() => this.updateBotStatuses(), 60_000);
	}

	async updateGuilds() {
		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		const stats = {
			created: 0,
			updated: 0,
			deleted: 0,
		};

		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;

			const existingGuilds = await GuildModel.find({ bot: true }).lean();

			for (const guildData of existingGuilds) {
				const profile = this.client.guilds.cache.get(guildData.id);

				if (!profile) {
					await GuildModel.findOneAndUpdate({ id: guildData.id }, { $set: { bot: false } });
					stats.deleted++;
				}
			}

			for (const [, guild] of this.client.guilds.cache) {
				const result = await GuildModel.findOneAndUpdate(
					{ id: guild.id },
					{
						$set: {
							name: guild.name,
							icon: guild.icon || '',
							banner: guild.banner || '',
							locale: guild.preferredLocale || '',
							bot: true,
						},
					},
					{ upsert: true, rawResult: true }
				);

				if (result?.lastErrorObject?.updatedExisting) {
					stats.updated++;
				} else {
					stats.created++;
				}
			}
		} catch (error) {
			console.error('Failed to sync guilds:', error);
		}

		try {
			const channel = await this.client.channels.fetch('1497567150750175232').catch(() => null);
			const cooldown = new Date().setHours(24, 0, 0, 0) - new Date().getTime();
			const embed = new EmbedBuilder()
				.setColor(DEFAULT_XERNERX_COLOR)
				.setTitle('Guild Scrape')
				.setDescription(`Performed a successful guild scrape on ${stats.updated + stats.created + stats.deleted} guilds.`)
				.addFields([
					{
						name: 'New',
						value: `${stats.created}`,
						inline: true,
					},
					{
						name: 'Updated',
						value: `${stats.updated}`,
						inline: true,
					},
					{
						name: 'Deleted',
						value: `${stats.deleted}`,
						inline: true,
					},
				])
				.setFooter({
					text: `${this.client.user?.username || 'Xernerx Bot'} • Running again in ${Math.round(cooldown / 1000 / 60)}m`,
					iconURL: this.client.user?.displayAvatarURL(),
				})
				.setTimestamp(new Date().setHours(24, 0, 0, 0));

			if (channel && channel.isTextBased && channel.isTextBased()) {
				(channel as any).send({ embeds: [embed] });
			}

			setTimeout(this.updateGuilds.bind(this), cooldown);
		} catch (err) {
			console.error('Failed to send stats embed', err);
			const cooldown = new Date().setHours(24, 0, 0, 0) - new Date().getTime();
			setTimeout(this.updateGuilds.bind(this), cooldown);
		}
	}

	async updateStats() {
		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;
			const StatModel = db.models.guilds.Stat;

			const bucketSize = 10 * 60 * 1000; // 10 minutes
			const timestamp = new Date(Math.floor(Date.now() / bucketSize) * bucketSize);

			for (const [, guild] of this.client.guilds.cache) {
				const members = guild.memberCount;
				const bots = guild.members.cache.filter((m) => m.user.bot).size;
				const realMembers = members - bots;
				const boosts = guild.premiumSubscriptionCount || 0;

				const guildProfile = await GuildModel.findOneAndUpdate({ id: guild.id }, { $set: { memberCount: realMembers } }, { returnDocument: 'after', upsert: true }).lean();
				const currentMessages = guildProfile?.messages || 0;

				await StatModel.findOneAndUpdate(
					{ id: guild.id, timestamp },
					{
						$set: {
							members: realMembers,
							bots,
							boosts,
						},
						$setOnInsert: {
							messages: currentMessages,
						},
					},
					{ upsert: true }
				);
			}
		} catch (error) {
			console.error('Failed to sync guild stats:', error);
		}

		setTimeout(this.updateStats.bind(this), 10 * 60 * 1000);
	}
}
