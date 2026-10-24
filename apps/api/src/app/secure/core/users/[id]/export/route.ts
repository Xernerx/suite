/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = (await getServerSession(auth)) as any;
		const sessionUserId = session?.user?.id;

		if (!sessionUserId || sessionUserId !== id) {
			return NextResponse.json({ error: 'Forbidden: You may only export your own personal data archive.' }, { status: 403 });
		}

		const { models } = await database('xernerx');

		const [profile, appearance, credits, botsOwned, guildsOwned] = await Promise.all([
			models.users.User.findOne({ id }).lean(),
			models.users.Appearance.findOne({ ownerId: id }).lean(),
			models.users.Credit.findOne({ ownerId: id }).lean(),
			(models.bots as any).Bot.find({ owners: id })
				.lean()
				.catch(() => []),
			(models.guilds as any).Guild.find({ owner: id })
				.lean()
				.catch(() => []),
		]);

		const exportArchive = {
			profile: profile || { id },
			appearance: appearance || {},
			credits: credits || { balance: 0, streak: 0, transactions: [] },
			showcases: profile?.showcases || [],
			connections: profile?.connections || [],
			botsOwned: botsOwned || [],
			guildsOwned: guildsOwned || [],
			exportedAt: new Date().toISOString(),
		};

		return new NextResponse(JSON.stringify(exportArchive, null, 2), {
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Content-Disposition': 'attachment; filename="xernerx-data-export.json"',
				'Cache-Control': 'no-store',
			},
		});
	} catch (error) {
		console.error('Failed to export user data archive:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
