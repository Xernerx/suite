/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, sendUserNotification } from '@/lib/auditAndNotify';
import { dispatchAppCommunityWebhook } from '@/lib/mainDiscordServer';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');

		const oldItem = (await models.core.RoadmapItem.findOne({ id }).lean()) as any;
		const updated = (await models.core.RoadmapItem.findOneAndUpdate({ id }, body, { returnDocument: 'after' }).lean()) as any;

		if (updated) {
			await recordAuditLog(req, {
				action: 'roadmap.update',
				category: 'system',
				targetId: id,
				targetLabel: updated.title || id,
				details: { status: updated.status, targetQuarter: updated.targetQuarter },
			});

			if (oldItem && oldItem.status !== 'released' && updated.status === 'released') {
				const recipients = Array.from(new Set([...(Array.isArray(updated.watchers) ? updated.watchers : []), ...(Array.isArray(updated.upvotes) ? updated.upvotes : [])]));
				for (const targetUserId of recipients) {
					await sendUserNotification({
						targetId: targetUserId,
						type: 'success',
						title: 'Roadmap Milestone Released!',
						message: `"${updated.title}" (${updated.productId}) has officially been released!`,
						link: updated.changelogUrl || 'https://info.xernerx.com/roadmap',
						eventKey: `roadmap_released_${id}`,
						prefCategory: 'community',
						prefKey: 'roadmapReleased',
					});
				}

				await dispatchAppCommunityWebhook(
					{ models },
					{
						feedType: 'suggestions',
						title: `🎉 Roadmap Milestone Released: ${String(updated.title || id).slice(0, 120)}`,
						url: updated.changelogUrl || 'https://info.xernerx.com/roadmap',
						description: String(updated.description || 'This milestone is now live across the Xernerx Suite!').slice(0, 350),
						color: 0x22c55e,
						fields: [
							{ name: 'Product', value: `\`${updated.productId || 'Suite'}\``, inline: true },
							...(updated.targetQuarter ? [{ name: 'Release Cycle', value: `\`${updated.targetQuarter}\``, inline: true }] : []),
						],
						ctaLinks: [
							{ label: 'Explore Roadmap', url: 'https://info.xernerx.com/roadmap' },
							{ label: 'Read Changelog', url: updated.changelogUrl || 'https://info.xernerx.com/changelog' },
						],
					}
				).catch(() => {});
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
		const deleted = (await models.core.RoadmapItem.findOneAndDelete({ id }).lean()) as any;
		await recordAuditLog(req, {
			action: 'roadmap.delete',
			category: 'system',
			targetId: id,
			targetLabel: deleted?.title || id,
		});
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
