/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database, processDueGiveaways, syncGiveawayDiscordMessage } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request) {
	try {
		await processDueGiveaways().catch(() => null);

		const { searchParams } = new URL(req.url);
		const activeOnly = searchParams.get('activeOnly') === 'true';
		const statusFilter = searchParams.get('status');
		const app = searchParams.get('app');

		const { models } = await database('xernerx');
		const Giveaway = (models.core as any).Giveaway;
		if (!Giveaway) {
			return NextResponse.json([]);
		}

		const session = (await getServerSession(auth).catch(() => null)) as any;
		const sessionUserId = session?.user?.id ? String(session.user.id) : null;

		const query: any = {};
		if (activeOnly) {
			query.status = 'active';
			query.showOnWeb = { $ne: false };
			if (app && app !== 'all') {
				query.$or = [{ targetApps: { $in: ['all', app] } }, { targetApps: { $exists: false } }, { targetApps: { $size: 0 } }];
			}
		} else if (statusFilter && statusFilter !== 'all') {
			query.status = statusFilter;
		}

		let giveaways = await Giveaway.find(query).sort({ createdAt: -1 }).lean();

		if (activeOnly) {
			const now = Date.now();
			giveaways = giveaways.filter((g: any) => {
				const startsMs = g.startsAt ? new Date(g.startsAt).getTime() : 0;
				const endsMs = g.endsAt ? new Date(g.endsAt).getTime() : 0;
				if (startsMs && startsMs > now) return false;
				if (endsMs && endsMs <= now) return false;
				return true;
			});
		}

		const normalized = giveaways.map((g: any) => {
			const entries = Array.isArray(g.entries) ? g.entries : [];
			const totalWeight = entries.reduce((sum: number, e: any) => sum + (Number(e.weight) || 1), 0);
			const myEntry = sessionUserId ? entries.find((e: any) => String(e.userId) === sessionUserId) || null : null;

			return {
				...g,
				entryCount: entries.length,
				totalWeight,
				myEntry,
				targetApps: Array.isArray(g.targetApps) && g.targetApps.length > 0 ? g.targetApps : ['all'],
			};
		});

		return NextResponse.json(normalized);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['giveaways', 'announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing giveaways permission.' }, { status: 403 });
		}

		const body = await req.json();
		const { models } = await database('xernerx');
		const Giveaway = (models.core as any).Giveaway;
		const Setting = (models.core as any).Setting;

		const adminServerSetting = Setting
			? await Setting.findOne({ id: 'admin_server_id' })
					.lean()
					.catch(() => null)
			: null;
		const resolvedGuildId = String(body.guildId || adminServerSetting?.value || '687429190165069838');

		const now = Date.now();
		const startsAtDate = body.startsAt ? new Date(body.startsAt) : new Date();
		const endsAtDate = body.endsAt ? new Date(body.endsAt) : new Date(now + 7 * 24 * 60 * 60 * 1000);
		const initialStatus = startsAtDate.getTime() > now + 60_000 ? 'scheduled' : 'active';

		const newGiveaway = await Giveaway.create({
			id: crypto.randomUUID(),
			title: String(body.title || 'Xernerx Giveaway').trim(),
			description: String(body.description || '').trim(),
			bannerUrl: String(body.bannerUrl || '').trim(),
			status: initialStatus,
			startsAt: startsAtDate,
			endsAt: endsAtDate,
			winnerCount: Math.max(1, Math.min(100, Number(body.winnerCount) || 1)),
			hostedBy: String(body.hostedBy || caller.userId || ''),
			guildId: resolvedGuildId,
			channelId: String(body.channelId || '').trim(),
			pingRoleId: String(body.pingRoleId || '').trim(),
			showOnWeb: body.showOnWeb !== false,
			targetApps: Array.isArray(body.targetApps) && body.targetApps.length > 0 ? body.targetApps : ['all'],
			prize: {
				type: body.prize?.type || 'credits',
				label: String(body.prize?.label || body.title || 'Mystery Prize').trim(),
				creditAmount: Math.max(0, Number(body.prize?.creditAmount) || 0),
				storeItemId: String(body.prize?.storeItemId || '').trim(),
				durationDays: Math.max(0, Number(body.prize?.durationDays) || 0),
				discordRoleId: String(body.prize?.discordRoleId || '').trim(),
				customPrizeValue: String(body.prize?.customPrizeValue || '').trim(),
			},
			requirements: {
				requireAccount: Boolean(body.requirements?.requireAccount),
				requireVerified: Boolean(body.requirements?.requireVerified),
				requireActivePass: Boolean(body.requirements?.requireActivePass),
				minGlobalLevel: Math.max(0, Number(body.requirements?.minGlobalLevel) || 0),
				minStreak: Math.max(0, Number(body.requirements?.minStreak) || 0),
				minTotalSpent: Math.max(0, Number(body.requirements?.minTotalSpent) || 0),
				roleMatchMode: body.requirements?.roleMatchMode === 'all' ? 'all' : 'any',
				requiredDiscordRoleIds: Array.isArray(body.requirements?.requiredDiscordRoleIds) ? body.requirements.requiredDiscordRoleIds.filter(Boolean).map(String) : [],
				excludedDiscordRoleIds: Array.isArray(body.requirements?.excludedDiscordRoleIds) ? body.requirements.excludedDiscordRoleIds.filter(Boolean).map(String) : [],
				requiredBadgeOrItemIds: Array.isArray(body.requirements?.requiredBadgeOrItemIds) ? body.requirements.requiredBadgeOrItemIds.filter(Boolean).map(String) : [],
			},
			bonusEntries: Array.isArray(body.bonusEntries)
				? body.bonusEntries
						.filter((b: any) => b && b.type && Number(b.extraEntries) > 0)
						.map((b: any) => ({
							type: b.type,
							targetId: String(b.targetId || '').trim(),
							label: String(b.label || '').trim(),
							extraEntries: Math.max(1, Math.min(50, Number(b.extraEntries) || 1)),
						}))
				: [],
			entries: [],
			winners: [],
		});

		if (initialStatus === 'active' && newGiveaway.channelId) {
			const msgId = await syncGiveawayDiscordMessage(newGiveaway.toObject ? newGiveaway.toObject() : newGiveaway).catch(() => null);
			if (msgId) {
				newGiveaway.discordMessageId = msgId;
				await newGiveaway.save();
			}
		}

		await recordAuditLog(req, {
			action: 'giveaway.created',
			targetType: 'system',
			targetId: newGiveaway.id,
			summary: `Created giveaway "${newGiveaway.title}" (${newGiveaway.prize?.label})`,
		});

		const responseDoc = newGiveaway.toObject ? newGiveaway.toObject() : newGiveaway;
		return NextResponse.json(responseDoc, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
