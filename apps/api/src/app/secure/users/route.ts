/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const privacy = url.searchParams.get('privacy');
		const db = (await database('xernerx')).models.users as any;

		const query: Record<string, any> = {};
		if (privacy === 'public' || url.searchParams.get('public') === 'true') {
			query.privacy = 'public';
		}

		const users = await db.User.find(query).lean().select(['id', 'name', 'icon', 'roles', 'privacy']);

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
