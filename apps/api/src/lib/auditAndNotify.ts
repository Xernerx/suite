/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

export interface AuditLogInput {
	actorId?: string | null;
	actorName?: string | null;
	action: string;
	targetType?: string;
	category?: string;
	targetId?: string | null;
	summary?: string;
	targetLabel?: string;
	metadata?: Record<string, any>;
	details?: Record<string, any>;
}

export async function recordAuditLog(reqOrInput: Request | AuditLogInput, maybeInput?: AuditLogInput): Promise<void> {
	const input: AuditLogInput = (maybeInput ? maybeInput : reqOrInput) as AuditLogInput;
	if (!input || !input.action) return;

	try {
		let actorId = input.actorId || null;
		let actorName = input.actorName || null;

		if (!actorId) {
			try {
				const session = (await getServerSession(auth)) as any;
				if (session?.user) {
					actorId = session.user.id || 'staff';
					actorName = session.user.name || session.user.username || null;
				}
			} catch {}
		}

		const resolvedTargetType = input.targetType || input.category || 'system';
		const resolvedSummary = input.summary || input.targetLabel || `${input.action} (${input.targetId || resolvedTargetType})`;
		const resolvedMetadata = input.metadata || input.details || {};

		const { models } = await database('xernerx');
		const entry = await models.core.AuditLog.create({
			id: crypto.randomUUID(),
			actorId: actorId || 'staff',
			actorName,
			action: input.action,
			targetType: resolvedTargetType,
			targetId: input.targetId || null,
			summary: resolvedSummary,
			metadata: resolvedMetadata,
		});

		// Fire-and-forget Discord Webhook dispatch if admin_audit_webhook_url is configured
		setTimeout(async () => {
			try {
				const Setting = models.core.Setting as any;
				const webhookSetting = await Setting.findOne({ id: 'admin_audit_webhook_url' }).lean();
				const webhookUrl = webhookSetting?.value;
				if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
					const fields = [
						{ name: 'Actor', value: `${actorName || 'Staff'} (\`${actorId || 'staff'}\`)`, inline: true },
						{ name: 'Action', value: `\`${input.action}\``, inline: true },
						{ name: 'Category', value: `\`${resolvedTargetType}\``, inline: true },
					];
					if (input.targetId) {
						fields.push({ name: 'Target ID', value: `\`${input.targetId}\``, inline: true });
					}
					const metaKeys = Object.keys(resolvedMetadata).filter((k) => resolvedMetadata[k] !== undefined && resolvedMetadata[k] !== null && resolvedMetadata[k] !== '');
					if (metaKeys.length > 0) {
						const formattedMeta = metaKeys
							.slice(0, 5)
							.map((k) => `**${k}:** ${typeof resolvedMetadata[k] === 'object' ? JSON.stringify(resolvedMetadata[k]) : String(resolvedMetadata[k])}`)
							.join('\n');
						fields.push({ name: 'Metadata', value: formattedMeta.slice(0, 1024), inline: false });
					}

					await fetch(webhookUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							embeds: [
								{
									title: `🛡️ Audit Log: ${resolvedSummary}`,
									color: 0x6366f1,
									fields,
									timestamp: new Date(entry.createdAt || Date.now()).toISOString(),
									footer: { text: 'Xernerx Suite • Admin Security Audit' },
								},
							],
						}),
					});
				}
			} catch (webhookErr) {
				console.warn('[AuditLog] Failed to dispatch Discord webhook:', webhookErr);
			}
		}, 0);
	} catch (err) {
		console.warn('[AuditLog] Failed to record audit log:', err);
	}
}

import React from 'react';
import { BasicTemplate, sendMail } from '@xernerx/lib/server';

export interface UserNotificationInput {
	targetId: string;
	type: 'success' | 'error' | 'info' | 'warning';
	title: string;
	message: string;
	link?: string | null;
	eventKey?: string;
	prefCategory?: string;
	prefKey?: string;
}

function resolveNotificationPrefKeys(input: UserNotificationInput): { category: string; key: string } {
	if (input.prefCategory && input.prefKey) {
		return { category: input.prefCategory, key: input.prefKey };
	}
	const ev = (input.eventKey || '').toLowerCase();
	if (ev.startsWith('roadmap')) return { category: 'community', key: 'roadmapReleased' };
	if (ev.startsWith('issue')) return { category: 'community', key: 'issueStatusUpdate' };
	if (ev.startsWith('suggestion')) return { category: 'community', key: 'suggestionStatusUpdate' };
	if (ev.startsWith('application')) return { category: 'community', key: 'applicationReviewed' };
	return { category: 'general', key: 'system' };
}

export async function sendUserNotification(input: UserNotificationInput): Promise<void> {
	if (!input.targetId || input.targetId === 'anonymous') return;
	try {
		const { models } = await database('xernerx');
		const user = (await models.users.User.findOne({ id: input.targetId })
			.lean()
			.catch(() => null)) as any;

		const { category, key } = resolveNotificationPrefKeys(input);
		const channelPrefs = user?.notifications?.[category]?.[key] || {};
		const allowInApp = channelPrefs.inApp !== false;
		const allowMail = channelPrefs.mail === true;

		if (allowInApp) {
			const Dispatch = models.dispatch.Invite as any;
			await Dispatch.create({
				id: crypto.randomUUID(),
				senderId: 'system',
				targetId: input.targetId,
				category: 'notification',
				type: input.eventKey || `system_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
				status: 'unread',
				data: {
					title: input.title,
					message: input.message,
					type: input.type,
					link: input.link || null,
				},
			});
		}

		if (allowMail && user?.email) {
			await sendMail({
				to: user.email,
				subject: `Xernerx — ${input.title}`,
				template: React.createElement(BasicTemplate, {
					title: input.title,
					message: input.message,
					actionUrl: input.link || 'https://info.xernerx.com',
					actionText: 'Open Xernerx',
				}),
			}).catch((mailErr) => {
				console.warn('[Notification] Postmark email dispatch failed:', mailErr);
			});
		}
	} catch (err) {
		console.warn('[Notification] Failed to send user notification:', err);
	}
}
