/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = (await database('xernerx')).models.profiles.roles as any;
		const roles = await db.find({});
		return NextResponse.json(roles, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch roles:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const db = (await database('xernerx')).models.profiles.roles as any;
		const newRole = await db.create(body);
		return NextResponse.json(newRole, { status: 201 });
	} catch (error) {
		console.error('Failed to create role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
