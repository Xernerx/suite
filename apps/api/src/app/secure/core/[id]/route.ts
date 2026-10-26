/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

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

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};
		const updatedRole = await RoleModel.findOneAndUpdate({ id }, { $set: cleanBody }, { returnDocument: 'after' }).lean();

		if (!updatedRole) {
			return NextResponse.json({ error: 'Role not found' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'role.updated',
			targetType: 'role',
			targetId: id,
			summary: `Updated role "${updatedRole.name || id}"`,
			metadata: { name: updatedRole.name, discordRole: updatedRole.role },
		});

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

		await recordAuditLog(req, {
			action: 'role.deleted',
			targetType: 'role',
			targetId: id,
			summary: `Deleted role "${deletedRole.name || id}"`,
		});

		return NextResponse.json({ success: true, deleted: deletedRole }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
