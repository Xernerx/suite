/** @format */

import { XernerxClient } from '@xernerx/framework';
import { XernerxStats } from '@xernerx/stats';

export class Client extends XernerxClient {
	constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'GuildMembers'],
			token: process.env.DISCORD_CLIENT_TOKEN as string,
		});

		this.modules.eventHandler.loadEvents({
			directory: 'dist/events',
		});

		this.connect();
	}
}

export const client = new Client();

new XernerxStats(client as any, { token: process.env.XERNERX_TOKEN! });
