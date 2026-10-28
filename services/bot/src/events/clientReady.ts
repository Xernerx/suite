/** @format */

import { createLogger, database } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { DEFAULT_XERNERX_COLOR, syncBotCommands, updateBotPresence } from '../lib/botUtils.js';
import { syncMilestoneApplicationEmojis } from '../lib/milestoneEmojis.js';

const botLog = createLogger('BOT');

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
		syncBotCommands(this.client, process.env.XERNERX_TOKEN);
		syncMilestoneApplicationEmojis(this.client);

		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		this.updateStats();
		this.updateGuilds();
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
			botLog.error(`Failed to sync guilds: ${(error as any)?.message || error}`);
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
			botLog.error(`Failed to send stats embed: ${(err as any)?.message || err}`);
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
			botLog.error(`Failed to sync guild stats: ${(error as any)?.message || error}`);
		}

		setTimeout(this.updateStats.bind(this), 10 * 60 * 1000);
	}
}
