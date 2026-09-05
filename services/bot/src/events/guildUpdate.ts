import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Guild } from 'discord.js';

export default class GuildUpdateEvent extends EventBuilder {
	constructor() {
		super('guildUpdate', {
			name: 'guildUpdate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(oldGuild: Guild, newGuild: Guild) {
		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;

		if (oldGuild.name === newGuild.name && oldGuild.icon === newGuild.icon && oldGuild.preferredLocale === newGuild.preferredLocale) {
			return; // No changes to track
		}

		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;

			await GuildModel.findOneAndUpdate(
				{ id: newGuild.id },
				{
					$set: {
						name: newGuild.name,
						icon: newGuild.icon,
						locale: newGuild.preferredLocale,
					},
				},
				{ upsert: true }
			);
		} catch (error) {
			console.error(`Failed to update guild ${newGuild.id}:`, error);
		}
	}
}
