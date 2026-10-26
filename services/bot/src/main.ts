/** @format */

import fs from 'fs';
import path from 'path';
import { XernerxCommands } from '@xernerx/commands';
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
		const owners = (process.env.DISCORD_OWNER_IDS || process.env.OWNER_ID || '482513687417061376')
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);
		const origClear = console.clear;
		console.clear = () => {};
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences', 'MessageContent'],
			token: process.env.DISCORD_BOT_TOKEN as string,
			guildId: DEV_GUILD_IDS,
			owners,
			global: process.env.ENVIRONMENT?.toUpperCase() === 'PRODUCTION',
		});
		console.clear = origClear;

		const loadTsOrJsFiles = (dir: string) => {
			try {
				return fs
					.readdirSync(dir)
					.filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
					.map((file) => path.join(dir, file));
			} catch {
				return [];
			}
		};
		(this.modules.commandHandler as any).loadFiles = loadTsOrJsFiles;
		(this.modules.eventHandler as any).loadFiles = loadTsOrJsFiles;
	}

	async init() {
		const baseDir = fs.existsSync(path.resolve(process.cwd(), 'src/commands')) ? 'src' : 'dist';

		await this.modules.commandHandler.loadSlashCommands({
			directory: `${baseDir}/commands/slash`,
		});

		await this.modules.commandHandler.loadContextCommands({
			directory: `${baseDir}/commands/context`,
		});

		await this.modules.eventHandler.loadEvents({
			directory: `${baseDir}/events`,
		});

		const isDev = process.env.ENVIRONMENT?.toUpperCase() === 'DEVELOPMENT';

		await this.modules.extensionHandler.loadExtensions(
			new XernerxCommands(this as any, {
				token: process.env.XERNERX_TOKEN,
				dev: isDev,
			}) as any
		);

		await this.connect();

		if (process.env.XERNERX_TOKEN) {
			new XernerxStats(this as any, {
				token: process.env.XERNERX_TOKEN,
				dev: isDev,
			});
		}
	}
}

export const client = process.env.DISCORD_BOT_TOKEN ? new XernerxBotClient() : null;

if (client) {
	client.init();
} else {
	console.warn('[XernerxBot] DISCORD_BOT_TOKEN is not set; skipping startup.');
}
