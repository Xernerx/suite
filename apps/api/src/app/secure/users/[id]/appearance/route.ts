/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const appearance = await models.users.Appearance.findOne({ ownerId: id }).lean();
		return NextResponse.json(appearance || { ownerId: id });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const { models } = await database('xernerx');

		const rawAppearance = body.appearance || body;
		const { uiPreferences, _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ownerId: _omitOwner, ...restAppearance } = rawAppearance || {};
		const appearanceUpdate: Record<string, any> = { ...restAppearance };

		if (uiPreferences && typeof uiPreferences === 'object') {
			for (const [k, v] of Object.entries(uiPreferences)) {
				appearanceUpdate[`uiPreferences.${k}`] = v;
			}
		}

		const updated = await models.users.Appearance.findOneAndUpdate({ ownerId: id }, { $set: appearanceUpdate }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();

		return NextResponse.json(updated);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
