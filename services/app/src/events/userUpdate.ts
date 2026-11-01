/** @format */

import { User } from 'discord.js';
import { EventBuilder } from '@xernerx/framework';
import { isExcludedEnvironmentBot, syncMainServerBotIconEmojis } from '../lib/botIconEmojis.js';

export default class AppUserUpdateEvent extends EventBuilder {
	constructor() {
		super('userUpdate', {
			name: 'userUpdate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(oldUser: User, newUser: User) {
		if (!newUser?.bot) return;
		if (isExcludedEnvironmentBot(newUser.username)) return;
		if (oldUser?.avatar === newUser?.avatar && oldUser?.username === newUser?.username) return;

		await syncMainServerBotIconEmojis(this.client);
	}
}
