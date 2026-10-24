/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const channelId = searchParams.get('channelId');
		const app = searchParams.get('app');
		const activeOnly = searchParams.get('activeOnly') === 'true';

		const { models } = await database('xernerx');
		const Announcement = models.core.Announcement as any;

		const query: any = {};
		if (channelId) query.channelId = channelId;
		if (app && app !== 'all') {
			query.$or = [{ targetApps: { $in: ['all', app] } }, { targetApps: { $exists: false } }, { targetApps: { $size: 0 } }];
		}

		let announcements = await Announcement.find(query).sort({ createdAt: -1 }).lean();

		if (activeOnly) {
			const now = Date.now();
			announcements = announcements.filter((a: any) => {
				const startsMs = a.startsAt ? new Date(a.startsAt).getTime() : a.scheduledFor ? new Date(a.scheduledFor).getTime() : null;
				const expiresMs = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
				if (startsMs && !Number.isNaN(startsMs) && startsMs > now) return false;
				if (expiresMs && !Number.isNaN(expiresMs) && expiresMs <= now) return false;
				return true;
			});
		}

		const normalized = announcements.map((a: any) => ({
			...a,
			startsAt: a.startsAt ?? a.scheduledFor ?? null,
			expiresAt: a.expiresAt ?? null,
			targetApps: Array.isArray(a.targetApps) && a.targetApps.length > 0 ? a.targetApps : ['all'],
		}));

		return NextResponse.json(normalized);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Announcement = models.core.Announcement as any;
		const Dispatch = models.dispatch.Invite as any;

		const resolvedStartsAt = body.startsAt || body.scheduledFor || null;
		const resolvedScheduledFor = body.scheduledFor || body.startsAt || null;
		const resolvedExpiresAt = body.expiresAt || null;
		const resolvedTargetApps = Array.isArray(body.targetApps) && body.targetApps.length > 0 ? body.targetApps : ['all'];

		// Quick in-app system incident/maintenance broadcast mode
		if (body.broadcastOnly) {
			const dispatchDoc = await Dispatch.create({
				id: crypto.randomUUID(),
				senderId: 'system',
				targetId: 'global',
				category: 'announcement',
				type: body.severity || 'warning',
				data: {
					title: body.title || 'System Status Update',
					message: body.content || 'Please check info.xernerx.com/status for live updates.',
					type: body.severity || 'warning',
					link: body.link || 'https://info.xernerx.com/status',
					startsAt: resolvedStartsAt,
					expiresAt: resolvedExpiresAt,
					targetApps: resolvedTargetApps,
				},
				status: 'pending',
			});

			await recordAuditLog(req, {
				action: 'system.incident_broadcast',
				targetType: 'system',
				targetId: dispatchDoc.id,
				summary: `Broadcasted global status alert: "${body.title}"`,
				metadata: {
					severity: body.severity || 'warning',
					link: body.link || 'https://info.xernerx.com/status',
					startsAt: resolvedStartsAt,
					expiresAt: resolvedExpiresAt,
					targetApps: resolvedTargetApps,
				},
			});

			return NextResponse.json(dispatchDoc, { status: 201 });
		}

		const newAnnouncement = await Announcement.create({
			id: crypto.randomUUID(),
			...body,
			scheduledFor: resolvedScheduledFor,
			startsAt: resolvedStartsAt,
			expiresAt: resolvedExpiresAt,
			targetApps: resolvedTargetApps,
		});

		await recordAuditLog(req, {
			action: 'announcement.created',
			targetType: 'system',
			targetId: newAnnouncement.id,
			summary: `Created announcement "${newAnnouncement.title || newAnnouncement.id}"`,
		});

		// If scheduledFor/startsAt is not provided or is in the past, send it immediately
		const effectiveSchedule = newAnnouncement.startsAt || newAnnouncement.scheduledFor;
		if (!effectiveSchedule || new Date(effectiveSchedule).getTime() <= Date.now()) {
			try {
				const payload = newAnnouncement.message ? (newAnnouncement.message.toJSON ? newAnnouncement.message.toJSON() : JSON.parse(JSON.stringify(newAnnouncement.message))) : {};
				if (payload.components && payload.components.length === 0) delete payload.components;
				if (payload.embeds && payload.embeds.length === 0) delete payload.embeds;

				const webhookRes = await fetch(newAnnouncement.webhookUrl + '?wait=true', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (webhookRes.ok) {
					const webhookData = await webhookRes.json();
					newAnnouncement.discordMessageId = webhookData.id;
					newAnnouncement.sentAt = new Date();
					await newAnnouncement.save();

					// Dispatch global notification
					await Dispatch.create({
						id: crypto.randomUUID(),
						senderId: 'system',
						targetId: 'global',
						category: 'announcement',
						type: 'info',
						data: {
							title: newAnnouncement.title,
							message: newAnnouncement.message?.content || 'New platform announcement.',
							link: null,
							startsAt: resolvedStartsAt,
							expiresAt: resolvedExpiresAt,
							targetApps: resolvedTargetApps,
						},
						status: 'pending',
					});
				} else {
					const errorText = await webhookRes.text();
					console.error('Failed to send webhook', errorText);
				}
			} catch (err) {
				console.error('Webhook execution failed:', err);
			}
		}

		const responseDoc = newAnnouncement.toObject ? newAnnouncement.toObject() : newAnnouncement;
		return NextResponse.json(
			{
				...responseDoc,
				startsAt: responseDoc.startsAt ?? resolvedStartsAt,
				expiresAt: responseDoc.expiresAt ?? resolvedExpiresAt,
				targetApps: Array.isArray(responseDoc.targetApps) && responseDoc.targetApps.length > 0 ? responseDoc.targetApps : resolvedTargetApps,
			},
			{ status: 201 }
		);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
