/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['tokens']);
		const userId = caller.userId;

		if (!caller.authenticated || !userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const existing = await TokenModel.findOne({ id });
		if (!existing) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		const owners: string[] = Array.isArray(existing.owners) ? existing.owners : [];
		if (!caller.authorized && owners.length > 0 && !owners.includes(userId)) {
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
