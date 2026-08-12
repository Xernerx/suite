/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.profiles.roles as any;
		const role = await db.findOne({ id });

		if (!role) {
			return NextResponse.json({ error: 'Role not found' }, { status: 404 });
		}

		return NextResponse.json(role, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = (await database('xernerx')).models.profiles.roles as any;

		const updatedRole = await db.findOneAndUpdate({ id }, body, { returnDocument: 'after' });

		if (!updatedRole) {
			return NextResponse.json({ error: 'Role not found' }, { status: 404 });
		}

		return NextResponse.json(updatedRole, { status: 200 });
	} catch (error) {
		console.error('Failed to update role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.profiles.roles as any;

		const deletedRole = await db.findOneAndDelete({ id });

		if (!deletedRole) {
			return NextResponse.json({ error: 'Role not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, deleted: deletedRole }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
