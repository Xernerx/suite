/** @format */

import { NextResponse } from 'next/server';
import { database, sendWebhook } from '@xernerx/lib/server';

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

		const updatedItem = await Dispatch.findOneAndUpdate({ id }, { $set: body }, { new: true });

		if (!updatedItem) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		if (updatedItem.type === 'organization_invite' && updatedItem.status === 'approved') {
			const Organization = models.organizations.Organization as any;
			const OrgMember = models.organizations.Member as any;
			const crypto = require('crypto');

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
		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		const deletedItem = await Dispatch.findOneAndDelete({ id });

		if (!deletedItem) {
			return NextResponse.json({ error: 'Dispatch item not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, deletedId: id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
