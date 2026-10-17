/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const profile = await GuildModel.findOne({ id }).lean();

		if (!profile) {
			return NextResponse.json({ error: 'Virtue guild setup profile not found', found: false }, { status: 404 });
		}

		return NextResponse.json(profile, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const updated = await GuildModel.findOneAndUpdate({ id }, { $set: body }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
