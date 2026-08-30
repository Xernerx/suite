/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;
		const role = await RoleModel.findOne({ id }).lean();

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
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;

		const updatedRole = await RoleModel.findOneAndUpdate({ id }, body, { returnDocument: 'after' }).lean();

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
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;

		const deletedRole = await RoleModel.findOneAndDelete({ id }).lean();

		if (!deletedRole) {
			return NextResponse.json({ error: 'Role not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, deleted: deletedRole }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
