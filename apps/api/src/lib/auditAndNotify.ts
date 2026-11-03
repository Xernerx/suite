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

export interface CallerAuthResult {
	authenticated: boolean;
	authorized: boolean;
	isSystemToken: boolean;
	isStaff: boolean;
	userId: string | null;
	permissions: Record<string, boolean>;
}

export async function resolveCallerAuth(req: Request, requiredPermissions?: string[]): Promise<CallerAuthResult> {
	const isSystemToken = Boolean(req.headers.get('x-token-id'));
	if (isSystemToken) {
		return {
			authenticated: true,
			authorized: true,
			isSystemToken: true,
			isStaff: true,
			userId: 'system',
			permissions: {
				access: true,
				hosting: true,
				users: true,
				bots: true,
				servers: true,
				roles: true,
				tokens: true,
				translations: true,
				applications_review: true,
				applications_manage: true,
				settings: true,
				invites: true,
				announcements: true,
				manageMedia: true,
				uploadMedia: true,
				manageRoadmap: true,
				manageSuggestions: true,
				manageIssues: true,
				manageStore: true,
				manageSupport: true,
			},
		};
	}

	let userId: string | null = null;
	try {
		const session = (await getServerSession(auth)) as any;
		if (session?.user?.id) {
			userId = String(session.user.id);
		}
	} catch {}

	if (!userId && process.env.ENVIRONMENT?.toLowerCase() === 'development') {
		const origin = req.headers.get('origin') || '';
		const host = req.headers.get('host') || '';
		if (origin.includes('localhost') || origin.includes('127.0.0.1') || host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
			const headerActor = req.headers.get('x-actor-id');
			if (headerActor) userId = String(headerActor);
		}
	}

	if (!userId) {
		return {
			authenticated: false,
			authorized: false,
			isSystemToken: false,
			isStaff: false,
			userId: null,
			permissions: {},
		};
	}

	const mergedPermissions: Record<string, boolean> = {};
	try {
		const { models } = await database('xernerx');
		const userDoc = (await models.users.User.findOne({ id: userId }).select('roles blacklisted').lean()) as any;
		if (userDoc?.blacklisted) {
			return {
				authenticated: true,
				authorized: false,
				isSystemToken: false,
				isStaff: false,
				userId,
				permissions: {},
			};
		}
		const roleIds = Array.isArray(userDoc?.roles) ? userDoc.roles.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean) : [];
		if (roleIds.length > 0 && models.core?.Role) {
			const roleDocs = await models.core.Role.find({ id: { $in: roleIds } })
				.select('permissions')
				.lean();
			for (const roleDoc of roleDocs as any[]) {
				if (roleDoc?.permissions && typeof roleDoc.permissions === 'object') {
					for (const [k, v] of Object.entries(roleDoc.permissions)) {
						if (v === true) mergedPermissions[k] = true;
					}
				}
			}
		}
	} catch {}

	const isStaff = Boolean(mergedPermissions.access || Object.values(mergedPermissions).some(Boolean));
	const authorized = !requiredPermissions || requiredPermissions.length === 0 ? true : requiredPermissions.some((perm) => Boolean(mergedPermissions[perm]));

	return {
		authenticated: true,
		authorized,
		isSystemToken: false,
		isStaff,
		userId,
		permissions: mergedPermissions,
	};
}

export async function recordAuditLog(reqOrInput: Request | AuditLogInput, maybeInput?: AuditLogInput): Promise<void> {
	const input: AuditLogInput = (maybeInput ? maybeInput : reqOrInput) as AuditLogInput;
	if (!input || !input.action) return;

	try {
		let actorId = input.actorId || null;
		let actorName = input.actorName || null;

		if (!actorId && maybeInput && typeof (reqOrInput as Request)?.headers?.get === 'function') {
			const req = reqOrInput as Request;
			actorId = req.headers.get('x-actor-id') || null;
			actorName = req.headers.get('x-actor-name') || null;
		}

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
		if (actorId && actorId !== 'staff' && actorId !== 'system' && !actorName) {
			try {
				const actorDoc = (await models.users.User.findOne({ id: actorId }).select('name').lean()) as any;
				if (actorDoc?.name) actorName = actorDoc.name;
			} catch {}
		}
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
