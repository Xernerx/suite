/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const owner = searchParams.get('owner'); // Optionally filter by owner
		const user = searchParams.get('user'); // Optionally filter by owner or member
		const admin = searchParams.get('admin') === 'true';
		const search = searchParams.get('search')?.trim() || '';
		const limitParam = parseInt(searchParams.get('limit') || '0', 10);

		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const andConditions: any[] = [];
		if (owner) andConditions.push({ owner });
		if (user) {
			andConditions.push({ $or: [{ owner: user }, { members: user }] });
		} else if (!owner && !admin) {
			andConditions.push({ $or: [{ 'config.privacy': 'public' }, { privacy: 'public' }] });
		}

		if (search) {
			const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(escaped, 'i');
			andConditions.push({
				$or: [{ name: regex }, { description: regex }, { vanitySlug: regex }],
			});
		}

		const query = andConditions.length > 0 ? { $and: andConditions } : {};
		let dbQuery = OrganizationModel.find(query);
		if (limitParam > 0) dbQuery = dbQuery.limit(limitParam);

		const organizations = await dbQuery;
		return NextResponse.json(organizations, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch organizations:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		console.log('[Organizations POST] Received body:', body);

		if (!body.owner) {
			const session = await getServerSession(auth);
			if (session?.user && (session.user as any).id) {
				body.owner = (session.user as any).id;
			} else {
				return NextResponse.json({ error: 'Unauthorized: No owner provided and no session found' }, { status: 401 });
			}
		}

		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const RoleModel = db.Role;

		const defaultRoles =
			Array.isArray(body.roles) && body.roles.length > 0
				? body.roles
				: [
						{ id: crypto.randomUUID(), name: 'Owner', permissions: ['*'] },
						{ id: crypto.randomUUID(), name: 'Member', permissions: [] },
					];

		const newOrg = await OrganizationModel.create({
			...body,
			roles: defaultRoles,
		});

		await RoleModel.create(
			defaultRoles.map((r: any) => ({
				id: r.id || crypto.randomUUID(),
				ownerId: newOrg._id.toString(),
				name: r.name,
				permissions: Array.isArray(r.permissions) ? r.permissions : [],
			}))
		);

		return NextResponse.json(newOrg, { status: 201 });
	} catch (error) {
		console.error('Failed to create organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
