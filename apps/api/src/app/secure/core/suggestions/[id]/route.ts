/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, sendUserNotification } from '@/lib/auditAndNotify';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const existing = (await models.core.Suggestion.findOne({ id }).lean()) as any;

		const nextStatus = body.status ?? existing?.status;
		const shouldAwardBounty = existing && !existing.bountyAwarded && existing.authorId && (nextStatus === 'accepted' || nextStatus === 'implemented');

		if (shouldAwardBounty) {
			body.bountyAwarded = true;
		}

		const updated = (await models.core.Suggestion.findOneAndUpdate({ id }, body, { new: true }).lean()) as any;

		if (updated && shouldAwardBounty && updated.authorId) {
			const CreditModel = (models.users as any).Credit;
			await CreditModel.findOneAndUpdate(
				{ ownerId: updated.authorId },
				{
					$inc: { balance: 250 },
					$push: {
						transactions: {
							id: crypto.randomUUID(),
							type: 'bounty',
							amount: 250,
							multiplierPercent: 100,
							itemId: `suggestion_bounty_${id}`,
							itemName: `Suggestion Bounty — ${updated.title}`,
							createdAt: new Date(),
						},
					},
				},
				{ upsert: true }
			);
		}

		if (updated && existing?.status !== updated.status) {
			await recordAuditLog({
				action: `suggestion.${updated.status}`,
				targetType: 'suggestion',
				targetId: id,
				summary: `Updated suggestion "${updated.title}" status to ${updated.status}`,
				metadata: { previousStatus: existing?.status, newStatus: updated.status },
			});

			if (updated.authorId) {
				const notifType = updated.status === 'accepted' || updated.status === 'implemented' ? 'success' : updated.status === 'declined' ? 'warning' : 'info';
				await sendUserNotification({
					targetId: updated.authorId,
					type: notifType,
					title: `Suggestion ${updated.status.charAt(0).toUpperCase() + updated.status.slice(1)}`,
					message: `Your suggestion "${updated.title}" is now marked as ${updated.status}.`,
					link: 'https://info.xernerx.com/suggestions',
				});
			}
		}

		return NextResponse.json({ data: updated });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const deleted = (await models.core.Suggestion.findOneAndDelete({ id }).lean()) as any;
		if (deleted) {
			await recordAuditLog({
				action: 'suggestion.delete',
				targetType: 'suggestion',
				targetId: id,
				summary: `Deleted suggestion "${deleted.title || id}"`,
			});
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
