import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Guild } from 'discord.js';

export default class GuildCreateEvent extends EventBuilder {
	constructor() {
		super('guildCreate', {
			name: 'guildCreate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(guild: Guild) {
		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		this.updateGuild(guild);
	}

	async updateGuild(guild: Guild) {
		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;

			await GuildModel.findOneAndUpdate(
				{ id: guild.id },
				{
					$set: {
						name: guild.name,
						icon: guild.icon,
						locale: guild.preferredLocale,
						bot: true,
					},
				},
				{ upsert: true }
			);
		} catch (error) {
			console.error(`Failed to update guild ${guild.id}:`, error);
		}
	}
}
