/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.profiles.organizations as any;

		const { id } = await props.params;
		const organization = await db.findOne({ _id: id });

		if (!organization) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		return NextResponse.json(organization, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const body = await req.json();
		const db = (await database('xernerx')).models.profiles.organizations as any;

		const { id } = await params;
		const updatedOrg = await db.findOneAndUpdate({ _id: id }, { $set: body }, { returnDocument: 'after', runValidators: true });

		if (!updatedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		return NextResponse.json(updatedOrg, { status: 200 });
	} catch (error) {
		console.error('Failed to update organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.profiles.organizations as any;

		const { id } = await params;
		const deletedOrg = await db.findOneAndDelete({ _id: id });

		if (!deletedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
