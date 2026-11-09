/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database, drawGiveawayWinners, evaluateGiveawayEligibility, fulfillGiveawayWinner, syncGiveawayDiscordMessage } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(req.url);
		const checkEligibility = searchParams.get('checkEligibility') === 'true';

		const { models } = await database('xernerx');
		const Giveaway = (models.core as any).Giveaway;
		const giveaway = Giveaway ? await Giveaway.findOne({ id }).lean() : null;

		if (!giveaway) {
			return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
		}

		const session = (await getServerSession(auth).catch(() => null)) as any;
		const sessionUserId = session?.user?.id ? String(session.user.id) : null;
		const entries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
		const myEntry = sessionUserId ? entries.find((e: any) => String(e.userId) === sessionUserId) || null : null;

		let eligibility = null;
		if (checkEligibility && sessionUserId) {
			eligibility = await evaluateGiveawayEligibility(giveaway, sessionUserId);
		}

		return NextResponse.json({
			...giveaway,
			entryCount: entries.length,
			myEntry,
			eligibility,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const caller = await resolveCallerAuth(req, ['giveaways', 'announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing giveaways permission.' }, { status: 403 });
		}

		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Giveaway = (models.core as any).Giveaway;

		const giveaway = await Giveaway.findOne({ id });
		if (!giveaway) {
			return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
		}

		if (body.action === 'end_now' || body.action === 'draw') {
			const res = await drawGiveawayWinners(id);
			if (!res.ok) {
				return NextResponse.json({ error: res.error || 'Failed to draw winners' }, { status: 400 });
			}
			await recordAuditLog(req, {
				action: 'giveaway.drawn',
				targetType: 'system',
				targetId: id,
				summary: `Ended & drew winners for giveaway "${giveaway.title}"`,
			});
			return NextResponse.json(res.giveaway);
		}

		if (body.action === 'reroll') {
			const res = await drawGiveawayWinners(id, {
				reroll: true,
				replaceUserId: body.replaceUserId ? String(body.replaceUserId) : undefined,
			});
			if (!res.ok) {
				return NextResponse.json({ error: res.error || 'Failed to reroll winners' }, { status: 400 });
			}
			await recordAuditLog(req, {
				action: 'giveaway.rerolled',
				targetType: 'system',
				targetId: id,
				summary: `Rerolled winner(s) for giveaway "${giveaway.title}"`,
			});
			return NextResponse.json(res.giveaway);
		}

		if (body.action === 'cancel') {
			giveaway.status = 'cancelled';
			giveaway.endedAt = new Date();
			await giveaway.save();

			const docObj = giveaway.toObject ? giveaway.toObject() : giveaway;
			await syncGiveawayDiscordMessage(docObj).catch(() => null);

			await recordAuditLog(req, {
				action: 'giveaway.cancelled',
				targetType: 'system',
				targetId: id,
				summary: `Cancelled giveaway "${giveaway.title}"`,
			});
			return NextResponse.json(docObj);
		}

		if (body.action === 'fulfill_winner' && body.winnerUserId) {
			const targetWinnerId = String(body.winnerUserId);
			const { fulfilled, fulfillmentNote } = await fulfillGiveawayWinner(giveaway.toObject ? giveaway.toObject() : giveaway, targetWinnerId);
			const updated = await Giveaway.findOneAndUpdate(
				{ id, 'winners.userId': targetWinnerId },
				{
					$set: {
						'winners.$.fulfilled': true,
						'winners.$.fulfillmentNote': body.fulfillmentNote || fulfillmentNote || 'Manually marked as fulfilled by staff.',
					},
				},
				{ returnDocument: 'after' }
			).lean();

			await recordAuditLog(req, {
				action: 'giveaway.winner_fulfilled',
				targetType: 'user',
				targetId: targetWinnerId,
				summary: `Fulfilled giveaway prize for user ${targetWinnerId} in "${giveaway.title}"`,
				metadata: { giveawayId: id, fulfilled },
			});
			return NextResponse.json(updated || giveaway);
		}

		if (body.title !== undefined) giveaway.title = String(body.title).trim();
		if (body.description !== undefined) giveaway.description = String(body.description).trim();
		if (body.bannerUrl !== undefined) giveaway.bannerUrl = String(body.bannerUrl).trim();
		if (body.winnerCount !== undefined) giveaway.winnerCount = Math.max(1, Math.min(100, Number(body.winnerCount) || 1));
		if (body.channelId !== undefined) giveaway.channelId = String(body.channelId).trim();
		if (body.pingRoleId !== undefined) giveaway.pingRoleId = String(body.pingRoleId).trim();
		if (body.showOnWeb !== undefined) giveaway.showOnWeb = Boolean(body.showOnWeb);
		if (Array.isArray(body.targetApps)) giveaway.targetApps = body.targetApps.length > 0 ? body.targetApps : ['all'];
		if (body.startsAt !== undefined) giveaway.startsAt = new Date(body.startsAt);
		if (body.endsAt !== undefined) giveaway.endsAt = new Date(body.endsAt);

		if (body.status && ['scheduled', 'active', 'ended', 'cancelled'].includes(body.status)) {
			giveaway.status = body.status;
		} else if (giveaway.status === 'scheduled' && giveaway.startsAt && new Date(giveaway.startsAt).getTime() <= Date.now()) {
			giveaway.status = 'active';
		}

		if (body.prize && typeof body.prize === 'object') {
			giveaway.prize = {
				type: body.prize.type || giveaway.prize?.type || 'credits',
				label: String(body.prize.label || giveaway.title || 'Mystery Prize').trim(),
				creditAmount: Math.max(0, Number(body.prize.creditAmount) || 0),
				storeItemId: String(body.prize.storeItemId || '').trim(),
				durationDays: Math.max(0, Number(body.prize.durationDays) || 0),
				discordRoleId: String(body.prize.discordRoleId || '').trim(),
				customPrizeValue: String(body.prize.customPrizeValue || '').trim(),
			};
		}

		if (body.requirements && typeof body.requirements === 'object') {
			giveaway.requirements = {
				requireAccount: Boolean(body.requirements.requireAccount),
				requireVerified: Boolean(body.requirements.requireVerified),
				requireActivePass: Boolean(body.requirements.requireActivePass),
				minGlobalLevel: Math.max(0, Number(body.requirements.minGlobalLevel) || 0),
				minStreak: Math.max(0, Number(body.requirements.minStreak) || 0),
				minTotalSpent: Math.max(0, Number(body.requirements.minTotalSpent) || 0),
				roleMatchMode: body.requirements.roleMatchMode === 'all' ? 'all' : 'any',
				requiredDiscordRoleIds: Array.isArray(body.requirements.requiredDiscordRoleIds) ? body.requirements.requiredDiscordRoleIds.filter(Boolean).map(String) : [],
				excludedDiscordRoleIds: Array.isArray(body.requirements.excludedDiscordRoleIds) ? body.requirements.excludedDiscordRoleIds.filter(Boolean).map(String) : [],
				requiredBadgeOrItemIds: Array.isArray(body.requirements.requiredBadgeOrItemIds) ? body.requirements.requiredBadgeOrItemIds.filter(Boolean).map(String) : [],
			};
		}

		if (Array.isArray(body.bonusEntries)) {
			giveaway.bonusEntries = body.bonusEntries
				.filter((b: any) => b && b.type && Number(b.extraEntries) > 0)
				.map((b: any) => ({
					type: b.type,
					targetId: String(b.targetId || '').trim(),
					label: String(b.label || '').trim(),
					extraEntries: Math.max(1, Math.min(50, Number(b.extraEntries) || 1)),
				}));
		}

		await giveaway.save();

		const docObj = giveaway.toObject ? giveaway.toObject() : giveaway;
		const msgId = await syncGiveawayDiscordMessage(docObj).catch(() => null);
		if (msgId && !giveaway.discordMessageId) {
			giveaway.discordMessageId = msgId;
			await giveaway.save();
		}

		await recordAuditLog(req, {
			action: 'giveaway.updated',
			targetType: 'system',
			targetId: id,
			summary: `Updated giveaway "${giveaway.title}"`,
		});

		return NextResponse.json(giveaway.toObject ? giveaway.toObject() : giveaway);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const caller = await resolveCallerAuth(req, ['giveaways', 'announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing giveaways permission.' }, { status: 403 });
		}

		const { id } = await params;
		const { models } = await database('xernerx');
		const Giveaway = (models.core as any).Giveaway;

		const giveaway = await Giveaway.findOne({ id });
		if (!giveaway) {
			return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
		}

		await Giveaway.deleteOne({ id });

		await recordAuditLog(req, {
			action: 'giveaway.deleted',
			targetType: 'system',
			targetId: id,
			summary: `Deleted giveaway "${giveaway.title || id}"`,
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
