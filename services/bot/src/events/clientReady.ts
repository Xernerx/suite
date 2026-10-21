/** @format */

import { database } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { ActivityType, EmbedBuilder, PresenceData } from 'discord.js';
import { getApiBaseUrl } from '../lib/api.js';

export default class ClientReadyEvent extends EventBuilder {
	constructor() {
		super('clientReady', {
			name: 'clientReady',
			emitter: 'client',
			once: false,
		});
	}

	override async run() {
		this.updatePresence();
		this.updateBotStatuses();
		this.uploadCommands();

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

			if (!mainOrgId || !BotModel) return;

			const orgBots = await BotModel.find({ organization: mainOrgId }).lean();
			if (!orgBots.length) return;

			const botIds = orgBots.map((b: any) => String(b.id)).filter(Boolean);

			// Prioritize fetching presences from the main admin server, then any other cached guild
			const orderedGuilds = [
				...(adminServerId && this.client.guilds.cache.has(adminServerId) ? [this.client.guilds.cache.get(adminServerId)!] : []),
				...Array.from(this.client.guilds.cache.values()).filter((g) => g.id !== adminServerId),
			];

			for (const guild of orderedGuilds.slice(0, 5)) {
				await guild.members.fetch({ user: botIds, withPresences: true }).catch(() => null);
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

				// Fallback to update count since rawResult can be tricky in newer mongoose versions without native MongoDB types
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

	private async updatePresence() {
		const status: any = await fetch(`${process.env.URL}/api/version`)
			.then((res) => res.json())
			.catch(() => null);

		const presence: PresenceData = {
			status: 'dnd',
			activities: [],
		};

		if (!status || !status.version) {
			presence.status = 'dnd';
			presence.activities = [{ name: 'Xernerx API offline', state: 'API is offline, some features may not respond as intended.' }];
		} else {
			presence.status = 'online';
			presence.activities = [{ name: `Xernerx API online`, state: `API is online, all features are working. (v${status.version})` }];
		}

		if (process.env.ENVIRONMENT === 'DEVELOPMENT') {
			presence.activities = [
				{
					type: ActivityType.Streaming,
					name: `Xernerx API (Development)`,
					url: `https://www.youtube.com/watch?v=nOv9HorOcJo`,
					state: `API: ${status ? 'Online' : 'Offline'} - Version: ${status?.version || 'Unknown'}`,
				},
			];
			presence.status = 'online';
		}

		this.client.user?.setPresence(presence);

		setTimeout(() => this.updatePresence(), 60000);
	}

	async uploadCommands() {
		const token = process.env.XERNERX_TOKEN;
		const botId = this.client.user?.id;
		if (!botId) return;

		const commands = Array.from(this.client.commands.slash.values()).map((cmd) => cmd.data.toJSON());
		if (!commands.length) return;

		if (token) {
			try {
				const apiUrl = `${getApiBaseUrl()}/v1/bots/${botId}/commands`;
				const res = await fetch(apiUrl, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(commands),
				});

				if (res.ok) {
					console.log(`[Commands] Synced ${commands.length} slash commands to Xernerx API (${apiUrl})`);
					return;
				}
				console.warn(`[Commands] API returned ${res.status} when syncing commands to ${apiUrl}`);
			} catch (err: any) {
				console.error('[Commands] Failed to sync commands via API:', err?.message || err);
			}
		}

		// Fallback: If XERNERX_TOKEN is not configured or API is unreachable, sync directly to DB if connected
		try {
			const db = await database('xernerx');
			const CommandModel = (db.models.bots as any)?.Command;
			if (CommandModel) {
				await CommandModel.deleteMany({ botId });
				const insertPayload = commands.map((cmd: any) => ({
					botId,
					commandId: cmd.id || cmd.name,
					name: cmd.name,
					description: cmd.description,
					type: cmd.type || 1,
					body: cmd,
				}));
				if (insertPayload.length > 0) {
					await CommandModel.insertMany(insertPayload);
					console.log(`[Commands] Synced ${insertPayload.length} slash commands directly to database.`);
				}
			}
		} catch (dbErr: any) {
			console.error('[Commands] Direct database sync fallback failed:', dbErr?.message || dbErr);
		}
	}
}
