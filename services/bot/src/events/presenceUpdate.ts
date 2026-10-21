/** @format */

import { database } from '@xernerx/lib/core';
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

			if (oldPresence?.status === rawStatus) return;

			const db = await database('xernerx');
			const SettingModel = (db.models.core as any).Setting;
			const BotModel = (db.models.bots as any).Bot;
			if (!BotModel) return;

			const mainOrgSetting = await SettingModel.findOne({ id: 'main_org_id' }).lean();
			const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
			if (!mainOrgId) return;

			const activity = newPresence.activities?.[0]?.state || newPresence.activities?.[0]?.name || '';

			await BotModel.findOneAndUpdate(
				{ id: userId, organization: mainOrgId },
				{
					$set: {
						status,
						statusUpdatedAt: new Date(),
						activity,
					},
				}
			);
		} catch (error) {
			console.error('Failed to handle presenceUpdate for main org bot:', error);
		}
	}
}
