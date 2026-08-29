import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { ActivityType, EmbedBuilder, PresenceData } from 'discord.js';

export default class ClientReadyEvent extends EventBuilder {
	constructor() {
		super('clientReady', {
			name: 'clientReady',
			emitter: 'client',
			once: false,
		});
	}

	override async run() {
		this.updateGuilds();
		this.updateStats();
		this.updatePresence();
	}

	async updateGuilds() {
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
				.setFooter({ text: `Running again in ${Math.round(cooldown / 1000 / 60)}m` })
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
}
