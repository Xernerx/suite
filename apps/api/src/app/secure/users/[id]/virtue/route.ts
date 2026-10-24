/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('virtue');
		const UserModel = (db.models.profiles as any)?.User;

		if (!UserModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const profile = (await UserModel.findOne({ id }).lean()) as any;

		if (!profile) {
			return NextResponse.json({ id, language: null, locale: null, found: false }, { status: 200 });
		}

		const resolvedLang = profile.language || profile.locale || profile.preferences?.locale || profile.preferences?.language || 'en-GB';

		return NextResponse.json(
			{
				...profile,
				language: resolvedLang,
				locale: resolvedLang,
				found: true,
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('virtue');
		const UserModel = (db.models.profiles as any)?.User;

		if (!UserModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const nextLang = body?.language || body?.locale || body?.preferences?.locale || body?.preferences?.language;
		const setPayload: Record<string, any> = {
			...body,
			id,
		};
		delete setPayload.preferences;

		if (nextLang) {
			setPayload.language = nextLang;
			setPayload.locale = nextLang;
			setPayload['preferences.locale'] = nextLang;
			setPayload['preferences.language'] = nextLang;
		}

		const updated = await UserModel.findOneAndUpdate({ id }, { $set: setPayload }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
