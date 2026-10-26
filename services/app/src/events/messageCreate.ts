/** @format */

import { database } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { ChannelType, Message } from 'discord.js';
import { handleSupportMessageCreate } from '../lib/supportTickets.js';

const DEFAULT_MAIN_SERVER_ID = '687429190165069838';

export default class AppMessageCreateEvent extends EventBuilder {
	constructor() {
		super('messageCreate', {
			name: 'messageCreate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(message: Message) {
		if (!message.guild) return;

		if (message.channel.type === ChannelType.GuildAnnouncement) {
			try {
				const db = await database('xernerx');
				const adminServerSetting = await db.models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
				const mainServerId = String(adminServerSetting?.value || DEFAULT_MAIN_SERVER_ID);

				if (message.guild.id === mainServerId && message.crosspostable) {
					await message.crosspost();
				}
			} catch (error) {
				console.error(`[Announcement] Failed to crosspost message ${message.id} in ${message.channel.id}:`, error);
			}
		}

		if (process.env.ENVIRONMENT?.toUpperCase() !== 'PRODUCTION') return;
		await handleSupportMessageCreate(message);
	}
}
