/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const owner = searchParams.get('owner'); // Optionally filter by owner
		const user = searchParams.get('user'); // Optionally filter by owner or member

		const db = (await database('xernerx')).models.profiles.organizations as any;

		const query: any = {};
		if (owner) query.owner = owner;
		if (user) {
			query.$or = [{ owner: user }, { members: user }];
		}

		const organizations = await db.find(query);
		return NextResponse.json(organizations, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch organizations:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const db = (await database('xernerx')).models.profiles.organizations as any;

		// In a real scenario, we'd also add this org to the User's `organizations` array
		// But for now, we just create the Organization document
		const newOrg = await db.create(body);
		return NextResponse.json(newOrg, { status: 201 });
	} catch (error) {
		console.error('Failed to create organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
