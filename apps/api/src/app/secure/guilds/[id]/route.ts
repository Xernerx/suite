/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.profiles.guilds as any;

		let guild = await db.findOne({ id });

		if (!guild) {
			// Return an empty/default object instead of 404 so the client can initialize it
			return NextResponse.json(
				{
					id,
					name: 'Unknown Guild',
					privacy: 'private',
					verified: false,
					bot: false,
				},
				{ status: 200 }
			);
		}

		return NextResponse.json(guild, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = (await database('xernerx')).models.profiles.guilds as any;

		const updatedGuild = await db.findOneAndUpdate({ id }, { $set: body }, { after: true, upsert: true });

		return NextResponse.json(updatedGuild, { status: 200 });
	} catch (error) {
		console.error('Failed to update guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
