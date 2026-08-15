/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = (await database('xernerx')).models.users as any;

		const users = await db.User.find({}).lean().select(['id', 'name', 'icon', 'roles']);

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
