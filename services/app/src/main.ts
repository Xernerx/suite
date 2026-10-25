/** @format */

import fs from 'fs';
import path from 'path';
import { XernerxClient } from '@xernerx/framework';

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

const SUPPORT_GUILD_IDS = ['687429190165069838', '784094726432489522'];

const APP_BOT_TOKEN = process.env.DISCORD_CLIENT_TOKEN || process.env.DISCORD_BOT_TOKEN;

export class XernerxAppClient extends XernerxClient {
	constructor() {
		const origClear = console.clear;
		console.clear = () => {};
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences', 'MessageContent'],
			token: APP_BOT_TOKEN as string,
			guildId: SUPPORT_GUILD_IDS,
			global: false,
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

		await this.modules.eventHandler.loadEvents({
			directory: `${baseDir}/events`,
		});

		await this.connect();
	}
}

export const client = APP_BOT_TOKEN ? new XernerxAppClient() : null;

if (client) {
	client.init();
} else {
	console.warn('[XernerxApp] DISCORD_CLIENT_TOKEN / DISCORD_BOT_TOKEN is not set; skipping startup.');
}
