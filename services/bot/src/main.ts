/** @format */

import { XernerxClient } from '@xernerx/framework';
import { XernerxStats } from '@xernerx/stats';
import path from 'path';

for (const envPath of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')]) {
	try {
		process.loadEnvFile(envPath);
	} catch {}
}

export class Client extends XernerxClient {
	constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences'],
			token: process.env.DISCORD_CLIENT_TOKEN as string,
			guildId: '687429190165069838',
			global: process.env.ENVIRONMENT === 'production',
		});

		this.init();
	}

	async init() {
		await this.modules.commandHandler.loadSlashCommands({
			directory: 'dist/commands/slash',
		});

		await this.modules.eventHandler.loadEvents({
			directory: 'dist/events',
		});

		await this.connect();
	}
}

export const client = new Client();

new XernerxStats(client as any, { token: process.env.XERNERX_TOKEN! });
