/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const owner = searchParams.get('owner'); // Optionally filter by owner
		const user = searchParams.get('user'); // Optionally filter by owner or member

		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const query: any = {};
		if (owner) query.owner = owner;
		if (user) {
			query.$or = [{ owner: user }, { members: user }];
		}

		const organizations = await OrganizationModel.find(query);
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

		// In a real scenario, we'd also add this org to the User's `organizations` array
		// But for now, we just create the Organization document
		const newOrg = await OrganizationModel.create(body);

		const crypto = require('crypto');
		await RoleModel.create([
			{
				id: crypto.randomUUID(),
				ownerId: newOrg._id.toString(),
				name: 'Owner',
				permissions: ['*'], // Full permissions by default
			},
			{
				id: crypto.randomUUID(),
				ownerId: newOrg._id.toString(),
				name: 'Member',
				permissions: [], // Base permissions by default
			},
		]);

		return NextResponse.json(newOrg, { status: 201 });
	} catch (error) {
		console.error('Failed to create organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
