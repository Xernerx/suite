/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['settings']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing settings permission.' }, { status: caller.authenticated ? 403 : 401 });
		}

		const db = (await database('xernerx')).models.core as any;
		const CoreModel = db.Core;

		const settings = await CoreModel.find({ type: 'setting' }).lean();

		return NextResponse.json(settings, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch settings:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
