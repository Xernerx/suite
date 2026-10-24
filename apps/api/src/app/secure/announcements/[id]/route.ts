/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const resolvedParams = await params;
		const { id } = resolvedParams;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Announcement = models.core.Announcement as any;

		const announcement = await Announcement.findOne({ id });
		if (!announcement) {
			return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
		}

		// Update fields
		if (body.title) announcement.title = body.title;
		if (body.channelId !== undefined) announcement.channelId = body.channelId;
		if (body.webhookUrl) announcement.webhookUrl = body.webhookUrl;
		if (body.message) announcement.message = body.message;
		if (body.scheduledFor !== undefined) announcement.scheduledFor = body.scheduledFor;
		if (body.startsAt !== undefined) {
			announcement.startsAt = body.startsAt;
			if (body.scheduledFor === undefined) announcement.scheduledFor = body.startsAt;
		}
		if (body.expiresAt !== undefined) announcement.expiresAt = body.expiresAt;
		if (Array.isArray(body.targetApps)) announcement.targetApps = body.targetApps;

		await announcement.save();

		// If it was already sent, we should attempt to edit the Discord message
		if (announcement.sentAt && announcement.discordMessageId) {
			try {
				const editUrl = `${announcement.webhookUrl}/messages/${announcement.discordMessageId}`;
				const payload = announcement.message ? (announcement.message.toJSON ? announcement.message.toJSON() : JSON.parse(JSON.stringify(announcement.message))) : {};
				if (payload.components && payload.components.length === 0) delete payload.components;
				if (payload.embeds && payload.embeds.length === 0) delete payload.embeds;

				await fetch(editUrl, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
			} catch (e) {
				console.error('Failed to edit discord message', e);
			}
		}

		const responseDoc = announcement.toObject ? announcement.toObject() : announcement;
		return NextResponse.json({
			...responseDoc,
			startsAt: responseDoc.startsAt ?? responseDoc.scheduledFor ?? null,
			expiresAt: responseDoc.expiresAt ?? null,
			targetApps: Array.isArray(responseDoc.targetApps) && responseDoc.targetApps.length > 0 ? responseDoc.targetApps : ['all'],
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const resolvedParams = await params;
		const { id } = resolvedParams;
		const { models } = await database('xernerx');
		const Announcement = models.core.Announcement as any;

		const announcement = await Announcement.findOne({ id });
		if (!announcement) {
			return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
		}

		// Optional: also delete the Discord message if it was sent?
		// if (announcement.discordMessageId) { ... DELETE webhook message ... }

		await Announcement.deleteOne({ id });

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
