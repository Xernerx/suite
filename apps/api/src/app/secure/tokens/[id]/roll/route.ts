/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const existing = await TokenModel.findOne({ id });
		if (!existing) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		const owners: string[] = Array.isArray(existing.owners) ? existing.owners : [];
		if (owners.length > 0 && !owners.includes(userId)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const newId = 'xrx_' + crypto.randomUUID().replace(/-/g, '');
		existing.id = newId;
		await existing.save();

		return NextResponse.json({
			token: newId,
			record: existing.toObject(),
		});
	} catch (error) {
		console.error('Roll Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
