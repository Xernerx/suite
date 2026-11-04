/** @format */

import { database, dispatchBotStatusWebhooks } from '@xernerx/lib/core';
import { EventBuilder } from '@xernerx/framework';
import { Presence } from 'discord.js';

export default class PresenceUpdateEvent extends EventBuilder {
	constructor() {
		super('presenceUpdate', {
			name: 'presenceUpdate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(oldPresence: Presence | null, newPresence: Presence) {
		try {
			const userId = newPresence?.userId;
			if (!userId) return;
			if (newPresence.user && !newPresence.user.bot) return;

			const rawStatus = newPresence.status;
			const status: 'online' | 'idle' | 'dnd' | 'offline' = rawStatus === 'online' || rawStatus === 'idle' || rawStatus === 'dnd' ? rawStatus : 'offline';

			const db = await database('xernerx');
			const BotModel = (db.models.bots as any).Bot;
			if (!BotModel) return;

			const activity = newPresence.activities?.[0]?.state || newPresence.activities?.[0]?.name || '';

			const previousBot = await BotModel.findOneAndUpdate(
				{ id: userId },
				{
					$set: {
						status,
						statusUpdatedAt: new Date(),
						activity,
					},
				},
				{ returnDocument: 'before' }
			).lean();

			if (previousBot) {
				const fallbackOldStatus =
					oldPresence?.status === 'online' || oldPresence?.status === 'idle' || oldPresence?.status === 'dnd' ? oldPresence.status : oldPresence?.status ? 'offline' : undefined;
				const prevStatus = fallbackOldStatus || previousBot.status;
				await dispatchBotStatusWebhooks(previousBot, status, prevStatus, activity);
			}
		} catch (error) {
			console.error('Failed to handle presenceUpdate for bot:', error);
		}
	}
}
