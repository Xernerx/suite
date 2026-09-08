import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await props.params;
		const db = (await database('xernerx')).models.organizations as any;

		const members = await db.Member.find({ ownerId: id }).lean();
		return NextResponse.json(members, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch members:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await props.params;
		const body = await req.json();
		const db = (await database('xernerx')).models.organizations as any;

		if (!body.userId) {
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
		}

		const updatedMember = await db.Member.findOneAndUpdate({ ownerId: id, userId: body.userId }, { $set: { roles: body.roles || [] } }, { new: true, upsert: true }).lean();

		return NextResponse.json(updatedMember, { status: 200 });
	} catch (error) {
		console.error('Failed to update member:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
