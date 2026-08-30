import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		// Vercel Cron secures the endpoint automatically using the CRON_SECRET if configured.
		// For local testing, we can just allow it or manually check a custom secret header.
		const authHeader = req.headers.get('authorization');
		const cronSecret = process.env.CRON_SECRET;
		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { models } = await database('xernerx');
		const Announcement = models.core.Announcement as any;
		const Dispatch = models.dispatch.Invite as any;

		// Find pending announcements that are due
		const pendingAnnouncements = await Announcement.find({
			sentAt: null,
			scheduledFor: { $lte: new Date() },
		});

		const results = [];

		for (const announcement of pendingAnnouncements) {
			try {
				const payload = announcement.message ? (announcement.message.toJSON ? announcement.message.toJSON() : JSON.parse(JSON.stringify(announcement.message))) : {};
				if (payload.components && payload.components.length === 0) delete payload.components;
				if (payload.embeds && payload.embeds.length === 0) delete payload.embeds;

				const webhookRes = await fetch(announcement.webhookUrl + '?wait=true', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (webhookRes.ok) {
					const webhookData = await webhookRes.json();
					announcement.discordMessageId = webhookData.id;
					announcement.sentAt = new Date();
					await announcement.save();

					// Dispatch global notification
					await Dispatch.create({
						id: crypto.randomUUID(),
						senderId: 'system',
						targetId: 'global',
						category: 'announcement',
						type: 'info',
						data: {
							title: announcement.title,
							message: announcement.message?.content || 'New platform announcement.',
							link: null,
						},
						status: 'pending',
					});

					results.push({ id: announcement.id, status: 'sent' });
				} else {
					console.error('Failed to send webhook', await webhookRes.text());
					results.push({ id: announcement.id, status: 'failed' });
				}
			} catch (err) {
				console.error('Webhook execution failed:', err);
				results.push({ id: announcement.id, status: 'error' });
			}
		}

		return NextResponse.json({ success: true, processed: results });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
