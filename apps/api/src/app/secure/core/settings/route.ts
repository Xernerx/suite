/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = (await database('xernerx')).models.core as any;
		const CoreModel = db.Core;

		const settings = await CoreModel.find({ type: 'setting' }).lean();

		return NextResponse.json(settings, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch settings:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
