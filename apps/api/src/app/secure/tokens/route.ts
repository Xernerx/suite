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
		const TokenModel = (db.models.users as any).Token;

		let tokens: any[] = [];

		if (admin) {
			tokens = await TokenModel.find({}).lean();
		} else {
			tokens = await TokenModel.find({ owners: userId }).lean();
		}

		// Clean up for standard view format
		const formattedTokens = tokens.map((t) => ({ id: t.id, status: t.status, name: t.name }));

		return NextResponse.json(formattedTokens, { status: 200 });
	} catch (error) {
		console.error('GET Secure Tokens Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
