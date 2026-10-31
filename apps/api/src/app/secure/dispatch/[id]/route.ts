/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database, sendWebhook } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		const item = await Dispatch.findOne({ id }).lean();

		if (!item) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		return NextResponse.json(item);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		const existingItem = await Dispatch.findOne({ id }).lean();
		if (!existingItem) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		let updateQuery: any;
		const { userId, ...restBody } = body || {};
		const actorUserId = userId || (existingItem.targetId !== 'global' ? existingItem.targetId : null);

		if (restBody.status === 'read' || restBody.status === 'unread') {
			const isSharedOrInvite = existingItem.targetId === 'global' || existingItem.category === 'invite';
			if (isSharedOrInvite) {
				if (restBody.status === 'read' && actorUserId) {
					updateQuery = { $addToSet: { readBy: String(actorUserId) } };
				} else if (restBody.status === 'unread' && actorUserId) {
					updateQuery = { $pull: { readBy: String(actorUserId) } };
				} else {
					updateQuery = {};
				}
			} else if (restBody.status === 'read') {
				updateQuery = {
					$set: { ...restBody, status: 'read', readAt: new Date() },
					...(actorUserId ? { $addToSet: { readBy: String(actorUserId) } } : {}),
				};
			} else {
				updateQuery = {
					$set: { ...restBody, status: 'unread', readAt: null },
					...(actorUserId ? { $pull: { readBy: String(actorUserId) } } : {}),
				};
			}
		} else {
			updateQuery = { $set: restBody };
		}

		const updatedItem = Object.keys(updateQuery).length > 0 ? await Dispatch.findOneAndUpdate({ id }, updateQuery, { returnDocument: 'after' }) : existingItem;

		if (!updatedItem) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		if (updatedItem.type === 'organization_invite' && updatedItem.status === 'approved') {
			const Organization = models.organizations.Organization as any;
			const OrgMember = models.organizations.Member as any;

			// Add to Organization.members array (Array of Strings)
			const orgResult = await Organization.updateOne({ _id: updatedItem.senderId }, { $addToSet: { members: updatedItem.targetId } });

			// Create the Member document if it doesn't exist
			const existingMember = await OrgMember.findOne({ ownerId: updatedItem.senderId, userId: updatedItem.targetId });
			if (!existingMember) {
				await OrgMember.create({
					id: crypto.randomUUID(),
					ownerId: updatedItem.senderId,
					userId: updatedItem.targetId,
					roles: [],
				});
			}

			console.log('Invite accepted, updating org:', updatedItem.senderId, 'result:', orgResult);
		} else if (updatedItem.category === 'application' && (updatedItem.status === 'approved' || updatedItem.status === 'denied')) {
			const webhookSetting = await models.core.Setting.findOne({ id: 'app_webhook_url' }).lean();
			if (webhookSetting?.value) {
				const ApplicationConfig = models.dispatch.ApplicationConfig as any;
				const config = await ApplicationConfig.findOne({ id: updatedItem.type }).lean();
				const appName = config ? config.name : updatedItem.type;

				const isApproved = updatedItem.status === 'approved';
				await sendWebhook({
					url: webhookSetting.value,
					embeds: [
						{
							title: isApproved ? '✅ Application Approved' : '❌ Application Denied',
							description: `The application for **${appName}** has been ${updatedItem.status}.`,
							color: isApproved ? 0x22c55e : 0xef4444,
							fields: [
								{ name: 'User ID', value: `\`${updatedItem.senderId}\``, inline: true },
								{ name: 'Reviewer ID', value: `\`${updatedItem.reviewedBy || 'System'}\``, inline: true },
								...(updatedItem.reviewNote ? [{ name: 'Review Note', value: updatedItem.reviewNote, inline: false }] : []),
							],
							timestamp: new Date().toISOString(),
						},
					],
				}).catch(console.error);
			}

			if (updatedItem.status === 'approved') {
				const ApplicationConfig = models.dispatch.ApplicationConfig as any;
				const User = models.users.User as any;

				const config = await ApplicationConfig.findOne({ id: updatedItem.type });
				if (config && config.rewardRole) {
					const userUpdateResult = await User.updateOne({ id: updatedItem.senderId }, { $addToSet: { roles: config.rewardRole } });
					console.log(`Application approved, granting role ${config.rewardRole} to user ${updatedItem.senderId}, result:`, userUpdateResult);
				}
			}
		}

		return NextResponse.json(updatedItem);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');
		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		const existingItem = await Dispatch.findOne({ id }).lean();
		if (!existingItem) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		if (existingItem.targetId === 'global' && userId) {
			await Dispatch.findOneAndUpdate({ id }, { $addToSet: { deletedBy: String(userId) } }, { returnDocument: 'after' });
			return NextResponse.json({ success: true, deletedId: id });
		}

		await Dispatch.findOneAndDelete({ id });

		return NextResponse.json({ success: true, deletedId: id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
