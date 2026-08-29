/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await props.params;
		const organization = await OrganizationModel.findOne({ _id: id }).lean();

		if (!organization) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		// Map to flat object so the frontend receives the correct structure
		const flatOrg = {
			...organization,
			name: organization.name,
			description: organization.description,
			icon: organization.icon,
			verified: organization.verified,
			privacy: organization.config?.privacy || organization.privacy,
		};

		return NextResponse.json(flatOrg, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const body = await req.json();
		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await params;

		const updateData: any = {};
		if (body.name !== undefined) updateData['name'] = body.name;
		if (body.description !== undefined) updateData['description'] = body.description;
		if (body.icon !== undefined) updateData['icon'] = body.icon;
		if (body.verified !== undefined) updateData['verified'] = body.verified;
		if (body.privacy !== undefined) updateData['config.privacy'] = body.privacy;

		if (body.action === 'remove_member' && body.targetId) {
			const updatedOrg = await OrganizationModel.findOneAndUpdate({ _id: id }, { $pull: { members: { userId: body.targetId } } }, { returnDocument: 'after', runValidators: true }).lean();

			if (!updatedOrg) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

			try {
				const Dispatch = (await database('xernerx')).models.dispatch as any;
				const crypto = require('crypto');
				await Dispatch.create({
					id: crypto.randomUUID(),
					targetId: body.targetId,
					senderId: id,
					type: 'organization_kick',
					category: 'notification',
					status: 'unread',
					data: {
						title: 'Removed from Organization',
						message: `You are no longer a member of ${updatedOrg.name}.`,
						type: 'warning',
					},
				});
			} catch (e) {
				console.error('Failed to dispatch kick notification', e);
			}

			const flatOrg = {
				...updatedOrg,
				name: updatedOrg.name,
				description: updatedOrg.description,
				icon: updatedOrg.icon,
				verified: updatedOrg.verified,
				privacy: updatedOrg.config?.privacy || updatedOrg.privacy,
			};
			return NextResponse.json(flatOrg, { status: 200 });
		}

		const finalUpdate = Object.keys(updateData).length > 0 ? updateData : body;

		const updatedOrg = await OrganizationModel.findOneAndUpdate({ _id: id }, { $set: finalUpdate }, { returnDocument: 'after', runValidators: true }).lean();

		if (!updatedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		// Map to flat object so the frontend receives the correct structure
		const flatOrg = {
			...updatedOrg,
			name: updatedOrg.name,
			description: updatedOrg.description,
			icon: updatedOrg.icon,
			verified: updatedOrg.verified,
			privacy: updatedOrg.config?.privacy || updatedOrg.privacy,
		};

		return NextResponse.json(flatOrg, { status: 200 });
	} catch (error) {
		console.error('Failed to update organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await params;
		const deletedOrg = await OrganizationModel.findOneAndDelete({ _id: id });

		if (!deletedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
