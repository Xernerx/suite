/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		// Find by your custom 'id' string, excluding the internal '_id'
		const application = await Application.findOne({ id }, '-_id');

		if (!application) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json(application);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		const updatedApplication = await Application.findOneAndUpdate(
			{ id },
			{ $set: body },
			{
				new: true,
				select: '-_id',
			}
		);

		if (!updatedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		// Handle side-effects for specific application types
		if (updatedApplication.type === 'organization_invite' && updatedApplication.status === 'approved') {
			const Organization = models.profiles.organizations;
			const orgId = updatedApplication.metadata?.organizationId || (updatedApplication.metadata as any)?.get?.('organizationId');

			if (orgId) {
				const updatedOrg = await Organization.findByIdAndUpdate(orgId, { $addToSet: { members: updatedApplication.userId } });
				if (!updatedOrg) {
					throw new Error(`Org not found: ${orgId}`);
				}
			} else {
				throw new Error('Organization ID is missing from invite metadata.');
			}
		}

		return NextResponse.json(updatedApplication);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		const deletedApplication = await Application.findOneAndDelete({ id });

		if (!deletedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
