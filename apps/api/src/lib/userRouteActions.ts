/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, sendUserNotification } from '@/lib/auditAndNotify';
import { syncUserRoles } from '@/lib/sync/users';
import { unlockVanityWithUserCredits } from '@/lib/vanityUnlock';

export interface TrackedUserDevice {
	id: string;
	browser: string;
	os: string;
	deviceType: 'desktop' | 'mobile';
	lastActive: Date | string;
}

export const SIGN_IN_BONUS_AMOUNT = 1000;
export const BOT_INVITE_BONUS_AMOUNT = 100;

export function parseUserAgentDevice(ua?: string | null): TrackedUserDevice | null {
	if (!ua || typeof ua !== 'string') return null;
	if (/^node|^undici|Next\.js|vercel|curl|postman/i.test(ua.trim())) return null;
	if (!/Mozilla\/|Electron\/|Dalvik\//i.test(ua)) return null;

	let browser = 'Browser';
	if (ua.includes('XernerxDesktop') || ua.includes('Electron/')) browser = 'Xernerx Desktop';
	else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
	else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
	else if (ua.includes('Chrome/')) browser = 'Google Chrome';
	else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
	else if (ua.includes('Safari/')) browser = 'Apple Safari';

	let os = 'Unknown OS';
	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
	else if (ua.includes('Linux')) os = 'Linux';

	const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
	const id = `${os}-${browser}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

	return {
		id,
		browser,
		os,
		deviceType: isMobile ? 'mobile' : 'desktop',
		lastActive: new Date(),
	};
}

export function mergeUserDevices(existingRaw: any, nextDevice: TrackedUserDevice): { devices: TrackedUserDevice[]; shouldPersist: boolean } {
	const existing: TrackedUserDevice[] = Array.isArray(existingRaw) ? existingRaw : [];
	const prevMatch = existing.find((d) => d?.id === nextDevice.id);
	const hadPlaceholder = existing.some((d) => d?.id === 'web-oauth-session');
	const prevActiveMs = prevMatch?.lastActive ? new Date(prevMatch.lastActive).getTime() : 0;
	const shouldPersist = !prevMatch || hadPlaceholder || !Number.isFinite(prevActiveMs) || Date.now() - prevActiveMs > 5 * 60 * 1000;
	const devices = [nextDevice, ...existing.filter((d) => d && d.id !== nextDevice.id && d.id !== 'web-oauth-session')].slice(0, 10);
	return { devices, shouldPersist };
}

export async function handleUserPatchAction(params: {
	req: NextRequest;
	models: any;
	resolvedId: string;
	existingDoc: any;
	userBody: Record<string, any>;
	isVanityAlreadyUnlocked: boolean;
}): Promise<NextResponse | null> {
	const { req, models, resolvedId, existingDoc, userBody, isVanityAlreadyUnlocked } = params;

	if (userBody.action === 'sync_roles') {
		const db = await database('xernerx');
		await syncUserRoles(resolvedId, db);
		await recordAuditLog(req, {
			action: 'user.roles.sync',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Synced Discord roles for user "${existingDoc?.name || resolvedId}"`,
		});
		return NextResponse.json({ success: true });
	}

	if (userBody.action === 'unverify') {
		const prevOnboarding = (existingDoc as any)?.onboarding || {};
		const resetOnboarding = {
			persona: prevOnboarding.persona || 'user',
			suiteIntroCompleted: false,
			dashboardTourCompleted: false,
			supportPromptCompleted: false,
			tourPostponed: false,
			tourPostponedPhase: null,
			completedAt: null,
			onboardedBots: Array.isArray(prevOnboarding.onboardedBots) ? prevOnboarding.onboardedBots : [],
		};
		const updated = await models.users.User.findOneAndUpdate(
			{ id: resolvedId },
			{
				$set: {
					verified: false,
					agreedTerms: null,
					agreedPrivacy: null,
					onboarding: resetOnboarding,
				},
			},
			{ returnDocument: 'after', runValidators: true, strict: false }
		).lean();
		await recordAuditLog(req, {
			action: 'user.unverify',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Unverified user "${existingDoc?.name || resolvedId}" and reset ToS & Privacy Policy dates`,
		});
		return NextResponse.json({
			...updated,
			verified: false,
			agreedTerms: null,
			agreedPrivacy: null,
			onboarding: resetOnboarding,
		});
	}

	if (userBody.action === 'revoke_sessions') {
		const now = new Date();
		const updated = await models.users.User.findOneAndUpdate(
			{ id: resolvedId },
			{
				$inc: { sessionVersion: 1 },
				$set: { sessionRevokedAt: now, devices: [] },
			},
			{ returnDocument: 'after', upsert: true }
		).lean();
		await recordAuditLog(req, {
			action: 'user.sessions.revoke',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Revoked all active device sessions for user "${existingDoc?.name || resolvedId}"`,
			metadata: { sessionVersion: (updated as any)?.sessionVersion || 2 },
		});
		return NextResponse.json({
			success: true,
			sessionVersion: Number((updated as any)?.sessionVersion) || 2,
			sessionRevokedAt: now.toISOString(),
		});
	}

	if (userBody.action === 'reset_data') {
		let wasBlacklisted = Boolean((existingDoc as any)?.blacklisted);
		let wasServicesOptOut = (existingDoc as any)?.services === false;

		try {
			const virtueDb = await database('virtue');
			const VUserModel = (virtueDb.models.profiles as any)?.User;
			if (VUserModel) {
				const vDoc = (await VUserModel.findOne({ id: resolvedId })
					.lean()
					.catch(() => null)) as any;
				if (vDoc?.blacklisted) wasBlacklisted = true;
				if (vDoc?.services === false) wasServicesOptOut = true;
			}
		} catch {}

		const DispatchInvite = (models.dispatch as any)?.Invite;
		await Promise.all([
			models.users.Appearance.deleteMany({ ownerId: resolvedId }).catch(() => null),
			models.users.Credit.deleteMany({ ownerId: resolvedId }).catch(() => null),
			models.users.Level.deleteMany({ ownerId: resolvedId }).catch(() => null),
			DispatchInvite?.deleteMany({ targetId: resolvedId }).catch(() => null),
			DispatchInvite?.updateMany({ targetId: 'global', $or: [{ readBy: resolvedId }, { deletedBy: resolvedId }] }, { $pull: { readBy: resolvedId, deletedBy: resolvedId } }).catch(() => null),
		]);

		if (wasBlacklisted || wasServicesOptOut) {
			const tombstoneDoc: Record<string, any> = {
				id: resolvedId,
				...(wasBlacklisted ? { blacklisted: true } : {}),
				...(wasServicesOptOut ? { services: false } : {}),
			};
			await models.users.User.collection.replaceOne({ id: resolvedId }, tombstoneDoc, { upsert: true });

			try {
				const virtueDb = await database('virtue');
				const VUserModel = (virtueDb.models.profiles as any)?.User;
				if (VUserModel) {
					await VUserModel.collection.replaceOne({ id: resolvedId }, tombstoneDoc, { upsert: true }).catch(() => null);
				}
			} catch {}

			await recordAuditLog(req, {
				action: 'user.data.reset',
				targetType: 'user',
				targetId: resolvedId,
				summary: `Reset profile data for user "${existingDoc?.name || resolvedId}" (tombstone persisted)`,
				metadata: { blacklisted: wasBlacklisted, services: !wasServicesOptOut },
			});

			return NextResponse.json({
				id: resolvedId,
				blacklisted: wasBlacklisted,
				services: !wasServicesOptOut,
				tombstone: true,
				appearance: {},
				credits: { balance: 0, streak: 0 },
				level: { level: 1, xp: 0 },
			});
		}

		const resetDoc: Record<string, any> = {
			id: resolvedId,
			name: userBody.name || existingDoc?.name || 'User',
			privacy: 'private',
			services: true,
			blacklisted: false,
			shadowban: Boolean((existingDoc as any)?.shadowban),
			roles: Array.isArray(existingDoc?.roles) ? existingDoc.roles : [],
			preferences: { locale: 'en-GB' },
		};
		await models.users.User.collection.replaceOne({ id: resolvedId }, resetDoc, { upsert: true });

		await recordAuditLog(req, {
			action: 'user.data.reset',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Reset profile data for user "${existingDoc?.name || resolvedId}"`,
		});

		return NextResponse.json({
			...resetDoc,
			appearance: {},
			credits: { balance: 0, streak: 0 },
			level: { level: 1, xp: 0 },
		});
	}

	if (userBody.action === 'send_notification') {
		const notifTitle = String(userBody.title || '').trim();
		const notifMessage = String(userBody.message || '').trim();
		const notifType = (['info', 'success', 'warning', 'error'].includes(userBody.type) ? userBody.type : 'info') as 'info' | 'success' | 'warning' | 'error';
		const notifLink = userBody.link ? String(userBody.link).trim() : null;
		if (!notifTitle || !notifMessage) {
			return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
		}
		await sendUserNotification({
			targetId: resolvedId,
			type: notifType,
			title: notifTitle,
			message: notifMessage,
			link: notifLink,
		});
		await recordAuditLog(req, {
			action: 'user.notify',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Sent notification "${notifTitle}" to user "${existingDoc?.name || resolvedId}"`,
			metadata: { type: notifType, title: notifTitle, link: notifLink },
		});
		return NextResponse.json({ success: true });
	}

	if (userBody.action === 'clear_notifications') {
		const DispatchInvite = (models.dispatch as any)?.Invite;
		const [deleteRes, globalRes] = await Promise.all([
			DispatchInvite
				? DispatchInvite.deleteMany({
						targetId: resolvedId,
						category: { $ne: 'application' },
						$nor: [{ category: 'invite', status: 'pending' }],
					}).catch(() => null)
				: Promise.resolve(null),
			DispatchInvite ? DispatchInvite.updateMany({ targetId: 'global', deletedBy: { $ne: resolvedId } }, { $addToSet: { deletedBy: resolvedId } }).catch(() => null) : Promise.resolve(null),
			models.users.User.updateOne(
				{ id: resolvedId },
				{
					$set: {
						'notifications.dailyGiftReminderAt': null,
						'notifications.voteReminders': [],
					},
				}
			).catch(() => null),
		]);
		await recordAuditLog(req, {
			action: 'user.notifications.clear',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Cleared all notifications for user "${existingDoc?.name || resolvedId}"`,
			metadata: {
				deletedCount: deleteRes?.deletedCount ?? 0,
				dismissedGlobalsCount: globalRes?.modifiedCount ?? 0,
			},
		});
		return NextResponse.json({
			success: true,
			deletedCount: deleteRes?.deletedCount ?? 0,
			dismissedGlobalsCount: globalRes?.modifiedCount ?? 0,
		});
	}

	if (userBody.action === 'claim_bot_invite_bonus') {
		const rawBotId = String(userBody.botId || '')
			.trim()
			.toLowerCase();
		const rawGuildId =
			String(userBody.guildId || 'initial')
				.trim()
				.toLowerCase() || 'initial';
		const botName = String(userBody.botName || rawBotId || 'Bot').trim();
		if (!rawBotId) {
			return NextResponse.json({ error: 'botId is required.' }, { status: 400 });
		}

		const itemId = `bot_invite:${rawBotId}:${rawGuildId}`;
		const existingCredit = (await models.users.Credit.findOne({ ownerId: resolvedId }).lean()) as any;
		const alreadyRewarded = Array.isArray(existingCredit?.transactions) && existingCredit.transactions.some((tx: any) => tx?.itemId === itemId);

		let bonusGranted = false;
		let updatedCredit = existingCredit;

		if (!alreadyRewarded) {
			const inviteTx = {
				id: crypto.randomUUID(),
				type: 'earn',
				amount: BOT_INVITE_BONUS_AMOUNT,
				multiplierPercent: 100,
				itemId,
				itemName: `Bot Invite Bonus (${botName})`,
				createdAt: new Date(),
			};

			if (!existingCredit) {
				const created = await models.users.Credit.create({
					ownerId: resolvedId,
					balance: BOT_INVITE_BONUS_AMOUNT,
					transactions: [inviteTx],
				});
				updatedCredit = created?.toObject ? created.toObject() : created;
			} else {
				updatedCredit = await models.users.Credit.findOneAndUpdate(
					{ ownerId: resolvedId },
					{
						$inc: { balance: BOT_INVITE_BONUS_AMOUNT },
						$push: { transactions: { $each: [inviteTx], $position: 0 } },
					},
					{ returnDocument: 'after', runValidators: true, strict: false }
				).lean();
			}
			bonusGranted = true;
		}

		return NextResponse.json({
			success: true,
			bonusGranted,
			bonusAmount: BOT_INVITE_BONUS_AMOUNT,
			balance: Number(updatedCredit?.balance) || 0,
		});
	}

	if (userBody.action === 'unlock_vanity') {
		delete userBody.action;
		if (!isVanityAlreadyUnlocked) {
			const unlockRes = await unlockVanityWithUserCredits(models, resolvedId, existingDoc?.name || `User ${resolvedId}`);
			if (!unlockRes.ok) {
				return NextResponse.json({ error: unlockRes.error }, { status: 403 });
			}
			const unlockedUser = await models.users.User.findOneAndUpdate({ id: resolvedId }, { $set: { vanityUnlocked: true } }, { returnDocument: 'after', runValidators: true }).lean();
			return NextResponse.json({
				...unlockedUser,
				vanityUnlocked: true,
				vanitySlug: unlockedUser?.vanitySlug || '',
				credits: unlockRes.credits || {},
				usedSlot: unlockRes.usedSlot,
				cost: unlockRes.cost,
			});
		}
		return NextResponse.json({ ...existingDoc, vanityUnlocked: true, vanitySlug: existingDoc?.vanitySlug || '' });
	}

	return null;
}
