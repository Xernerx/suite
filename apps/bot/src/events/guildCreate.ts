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
		this.updateGuild(guild);
	}

	async updateGuild(guild: Guild) {
		await fetch(`https://dev.xernerx.com/api/v1/guilds/${guild.id}/profile`, {
			method: 'PATCH',
			body: JSON.stringify({
				name: guild.name,
				icon: guild.icon,
				locale: guild.preferredLocale,
				bot: true,
			}),
		})
			.then((res) => res.json())
			.catch(() => null);
	}
}
