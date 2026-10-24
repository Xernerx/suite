/** @format */

import { XernerxClient } from '@xernerx/framework';
import { XernerxStats } from '@xernerx/stats';

const DEV_GUILD_IDS = ['687429190165069838', '784094726432489522'];

export class XernerxBotClient extends XernerxClient {
	constructor() {
		const origClear = console.clear;
		console.clear = () => {};
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences'],
			token: process.env.DISCORD_BOT_TOKEN as string,
			guildId: DEV_GUILD_IDS,
			global: process.env.ENVIRONMENT?.toUpperCase() === 'PRODUCTION',
		});
		console.clear = origClear;
	}

	async init() {
		await this.modules.commandHandler.loadSlashCommands({
			directory: 'dist/instances/bot/commands/slash',
		});

		await this.modules.commandHandler.loadContextCommands({
			directory: 'dist/instances/bot/commands/context',
		});

		await this.modules.eventHandler.loadEvents({
			directory: 'dist/instances/bot/events',
		});

		await this.connect();

		if (process.env.XERNERX_TOKEN) {
			new XernerxStats(this as any, { token: process.env.XERNERX_TOKEN });
		}
	}
}
