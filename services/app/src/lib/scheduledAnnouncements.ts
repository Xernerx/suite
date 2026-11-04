/** @format */

import crypto from 'crypto';
import { ChannelType, Client } from 'discord.js';
import { createLogger, database } from '@xernerx/lib/core';

const appBotLog = createLogger('APP-BOT');

const DEFAULT_BLOG_ANNOUNCEMENT_CHANNEL_ID = '941426815854055484';

let processingScheduled = false;

export async function processDueScheduledAnnouncements(client: Client): Promise<void> {
	if (processingScheduled) return;
	processingScheduled = true;

	try {
		const db = await database('xernerx');
		const Announcement = (db.models.core as any)?.Announcement;
		const Dispatch = (db.models.dispatch as any)?.Invite;
		if (!Announcement) return;

		const now = new Date();
		const dueDocs = await Announcement.find({
			sentAt: null,
			scheduledFor: { $lte: now },
		})
			.limit(15)
			.lean()
			.catch(() => []);

		for (const doc of dueDocs) {
			const claimed = await Announcement.findOneAndUpdate({ id: doc.id, sentAt: null }, { $set: { sentAt: now } }, { returnDocument: 'before' })
				.lean()
				.catch(() => null);

			if (!claimed) continue;

			try {
				const rawMsg = claimed.message ? JSON.parse(JSON.stringify(claimed.message)) : {};
				if (Array.isArray(rawMsg.components) && rawMsg.components.length === 0) delete rawMsg.components;
				if (Array.isArray(rawMsg.embeds) && rawMsg.embeds.length === 0) delete rawMsg.embeds;

				let discordMessageId: string | null = null;
				const webhookUrl = String(claimed.webhookUrl || '').trim();
				const isDiscordWebhook = /^https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\//i.test(webhookUrl);

				if (isDiscordWebhook) {
					const webhookRes = await fetch(`${webhookUrl}?wait=true`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(rawMsg),
					});
					if (webhookRes.ok) {
						const webhookData = (await webhookRes.json().catch(() => null)) as any;
						if (webhookData?.id) {
							discordMessageId = String(webhookData.id);
						}
					}
				} else {
					const targetChannelId = String(claimed.channelId || (claimed.blogSlug ? DEFAULT_BLOG_ANNOUNCEMENT_CHANNEL_ID : '')).trim();
					if (targetChannelId) {
						const channel = client.channels.cache.get(targetChannelId) || (await client.channels.fetch(targetChannelId).catch(() => null));

						if (channel && 'send' in channel && typeof (channel as any).send === 'function') {
							const sentMessage = await (channel as any).send(rawMsg);
							discordMessageId = sentMessage?.id || null;

							if (channel.type === ChannelType.GuildAnnouncement && sentMessage?.crosspostable) {
								await sentMessage.crosspost().catch(() => null);
							}
						}
					}
				}

				if (discordMessageId) {
					await Announcement.updateOne({ id: claimed.id }, { $set: { discordMessageId } }).catch(() => null);
				}

				if (Dispatch) {
					await Dispatch.create({
						id: crypto.randomUUID(),
						senderId: 'system',
						targetId: 'global',
						category: 'announcement',
						type: 'info',
						data: {
							title: claimed.title,
							message: rawMsg.content || 'Read the latest announcement on Xernerx.',
							link: claimed.link || (claimed.blogSlug ? `https://blog.xernerx.com/${claimed.blogSlug}` : null),
							startsAt: claimed.startsAt ? new Date(claimed.startsAt).toISOString() : now.toISOString(),
							expiresAt: claimed.expiresAt ? new Date(claimed.expiresAt).toISOString() : null,
							targetApps: Array.isArray(claimed.targetApps) && claimed.targetApps.length > 0 ? claimed.targetApps : ['all'],
						},
						status: 'pending',
					}).catch(() => null);
				}

				appBotLog.info(`Dispatched scheduled announcement "${claimed.title}" (${claimed.id})`);
			} catch (err) {
				appBotLog.error(`Failed dispatching scheduled announcement ${claimed.id}: ${(err as any)?.message || err}`);
			}
		}
	} catch (error) {
		appBotLog.error(`Error in processDueScheduledAnnouncements: ${(error as any)?.message || error}`);
	} finally {
		processingScheduled = false;
	}
}
