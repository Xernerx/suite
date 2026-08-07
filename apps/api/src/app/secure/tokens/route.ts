/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
	try {
		const admin = !!new URL(request.url).searchParams.get('admin');

		const session = await getServerSession(auth);

		if (!session?.user || !(session.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const userId = (session.user as any).id;
		const db = await database('xernerx');

		const filter: Record<string, string> = {};

		if (!admin) filter.owners = userId;

		const tokens = await db.models.tokens.apis.find(filter).select(['_id', 'status', 'name']);

		return NextResponse.json(tokens, { status: 200 });
	} catch (error) {
		console.error('GET Secure Tokens Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
