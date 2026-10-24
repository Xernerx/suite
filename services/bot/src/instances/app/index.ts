/** @format */

import { XernerxClient } from '@xernerx/framework';

const SUPPORT_GUILD_IDS = ['687429190165069838', '784094726432489522'];

export class XernerxAppClient extends XernerxClient {
	constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences'],
			token: process.env.DISCORD_CLIENT_TOKEN as string,
			guildId: SUPPORT_GUILD_IDS,
			global: false,
		});
	}

	async init() {
		await this.modules.commandHandler.loadSlashCommands({
			directory: 'dist/instances/app/commands/slash',
		});

		await this.modules.eventHandler.loadEvents({
			directory: 'dist/instances/app/events',
		});

		await this.connect();
	}
}
