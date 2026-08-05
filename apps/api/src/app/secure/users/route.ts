/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = (await database('xernerx')).models.profiles.users;

		const users = await db.find({}).lean().select(['id', 'name', 'icon', 'role']);

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
