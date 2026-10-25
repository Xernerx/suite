/** @format */

import { EventBuilder } from '@xernerx/framework';
import { Message } from 'discord.js';
import { handleSupportMessageCreate } from '../lib/supportTickets.js';

export default class AppMessageCreateEvent extends EventBuilder {
	constructor() {
		super('messageCreate', {
			name: 'messageCreate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(message: Message) {
		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;
		await handleSupportMessageCreate(message);
	}
}
