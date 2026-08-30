import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Guild } from 'discord.js';

export default class GuildDeleteEvent extends EventBuilder {
	constructor() {
		super('guildDelete', {
			name: 'guildDelete',
			emitter: 'client',
			once: false,
		});
	}

	override async run(guild: Guild) {
		try {
			const db = await database('xernerx');
			const GuildModel = db.models.guilds.Guild;

			await GuildModel.findOneAndDelete({ id: guild.id });
		} catch (error) {
			console.error(`Failed to delete guild ${guild.id}:`, error);
		}
	}
}
