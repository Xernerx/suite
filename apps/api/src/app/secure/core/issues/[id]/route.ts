/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, sendUserNotification } from '@/lib/auditAndNotify';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();

		if (body.status === 'resolved' && !body.resolvedAt) {
			body.resolvedAt = new Date();
		}

		const { models } = await database('xernerx');
		const existing = (await models.core.Issue.findOne({ id }).lean()) as any;

		const shouldAwardBounty =
			existing && !existing.bountyAwarded && existing.authorId && (body.status === 'resolved' || body.acknowledged === true || existing.status === 'resolved' || existing.acknowledged === true);

		if (shouldAwardBounty) {
			body.bountyAwarded = true;
		}

		const updated = (await models.core.Issue.findOneAndUpdate({ id }, body, { new: true }).lean()) as any;

		if (updated && shouldAwardBounty && updated.authorId) {
			const CreditModel = (models.users as any).Credit;
			await CreditModel.findOneAndUpdate(
				{ ownerId: updated.authorId },
				{
					$inc: { balance: 500 },
					$push: {
						transactions: {
							id: crypto.randomUUID(),
							type: 'bounty',
							amount: 500,
							multiplierPercent: 100,
							itemId: `issue_bounty_${id}`,
							itemName: `Bug Bounty — ${updated.title}`,
							createdAt: new Date(),
						},
					},
				},
				{ upsert: true }
			);
		}

		if (updated) {
			const wasVerified = !existing?.acknowledged && updated.acknowledged;
			const wasResolved = existing?.status !== 'resolved' && updated.status === 'resolved';

			if (wasResolved) {
				const versionSuffix = updated.resolvedApp && updated.resolvedVersion ? ` (${updated.resolvedApp} v${updated.resolvedVersion})` : '';
				await recordAuditLog({
					action: 'issue.resolve',
					targetType: 'issue',
					targetId: id,
					summary: `Resolved issue "${updated.title}"${versionSuffix}`,
					metadata: { resolvedApp: updated.resolvedApp, resolvedVersion: updated.resolvedVersion },
				});
				if (updated.authorId) {
					await sendUserNotification({
						targetId: updated.authorId,
						type: 'success',
						title: 'Issue Resolved',
						message: `Your reported issue "${updated.title}" has been resolved${versionSuffix}.`,
						link: 'https://info.xernerx.com/issues',
					});
				}
			} else if (wasVerified) {
				await recordAuditLog({
					action: 'issue.verify',
					targetType: 'issue',
					targetId: id,
					summary: `Verified issue "${updated.title}"`,
				});
				if (updated.authorId) {
					await sendUserNotification({
						targetId: updated.authorId,
						type: 'info',
						title: 'Issue Verified',
						message: `Your reported issue "${updated.title}" has been verified by our engineering team.`,
						link: 'https://info.xernerx.com/issues',
					});
				}
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
		const deleted = (await models.core.Issue.findOneAndDelete({ id }).lean()) as any;
		if (deleted) {
			await recordAuditLog({
				action: 'issue.delete',
				targetType: 'issue',
				targetId: id,
				summary: `Deleted issue "${deleted.title || id}"`,
			});
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
