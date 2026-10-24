/** @format */

import fs from 'fs';
import path from 'path';
import { XernerxAppClient } from './instances/app/index.js';
import { XernerxBotClient } from './instances/bot/index.js';

for (const envPath of [path.resolve(process.cwd(), '../../.env'), path.resolve(process.cwd(), '.env')]) {
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
					if (val) process.env[key] = val;
				}
			}
		}
	} catch {}
}

export const appClient = process.env.DISCORD_CLIENT_TOKEN ? new XernerxAppClient() : null;
export const botClient = process.env.DISCORD_BOT_TOKEN ? new XernerxBotClient() : null;

async function startInstances() {
	if (appClient) {
		await appClient.init();
	}
	if (botClient) {
		await botClient.init();
	}
}

startInstances();
