/** @format */

import fs from 'fs';
import path from 'path';
import { XernerxClient } from '@xernerx/framework';
import { XernerxStats } from '@xernerx/stats';

for (const envPath of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')]) {
	try {
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			for (const line of content.split('\n')) {
				const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
				if (match) {
					const key = match[1];
					let val = (match[2] || '').trim();
					if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
						val = val.slice(1, -1);
					}
					if (val && !process.env[key]) process.env[key] = val;
				}
			}
		}
	} catch {}
}

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
			directory: 'dist/commands/slash',
		});

		await this.modules.commandHandler.loadContextCommands({
			directory: 'dist/commands/context',
		});

		await this.modules.eventHandler.loadEvents({
			directory: 'dist/events',
		});

		await this.connect();

		if (process.env.XERNERX_TOKEN && process.env.ENVIRONMENT?.toUpperCase() === 'PRODUCTION') {
			new XernerxStats(this as any, { token: process.env.XERNERX_TOKEN });
		}
	}
}

export const client = process.env.DISCORD_BOT_TOKEN ? new XernerxBotClient() : null;

if (client) {
	client.init();
} else {
	console.warn('[XernerxBot] DISCORD_BOT_TOKEN is not set; skipping startup.');
}
