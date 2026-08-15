import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Message } from 'discord.js';

export default class MessageCreateEvent extends EventBuilder {
	constructor() {
		super('messageCreate', {
			name: 'messageCreate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(message: Message) {
		if (!message.inGuild() || message.author.bot) return;

		this.recordMessageStat(message.guildId, message.channelId);
	}

	async recordMessageStat(guildId: string, channelId: string) {
		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;
			const StatModel = db.models.guilds.Stat;

			// Update the master count on the Guild
			const guildProfile = await GuildModel.findOneAndUpdate({ id: guildId }, { $inc: { messages: 1 } }, { returnDocument: 'after', upsert: true });

			// 10 minute buckets
			const bucketSize = 10 * 60 * 1000;
			const timestamp = new Date(Math.floor(Date.now() / bucketSize) * bucketSize);

			await StatModel.findOneAndUpdate(
				{ id: guildId, timestamp },
				{
					$set: {
						messages: guildProfile.messages,
					},
					$inc: {
						[`data.channels.${channelId}`]: 1,
					},
				},
				{ upsert: true }
			);
		} catch (error) {
			console.error(`Failed to update message stat for guild ${guildId}:`, error);
		}
	}
}
