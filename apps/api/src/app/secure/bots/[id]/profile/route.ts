/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id;
		const db = (await database('xernerx')).models.profiles.bots;

		const bot = await db.findOne({ id }).lean();

		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		// Fetch Discord Profile
		try {
			const token = process.env.DISCORD_CLIENT_TOKEN;
			if (token) {
				const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
					headers: { Authorization: `Bot ${token}` },
				});
				if (discordRes.ok) {
					const discordUser = await discordRes.json();
					bot.discord = discordUser;
				}

				if (bot.owners && bot.owners.length > 0) {
					const ownersData = await Promise.all(
						bot.owners.map(async (ownerId: string) => {
							try {
								const res = await fetch(`https://discord.com/api/v10/users/${ownerId}`, {
									headers: { Authorization: `Bot ${token}` },
								});
								if (res.ok) return await res.json();
							} catch (e) {
								console.error(`Failed to fetch owner ${ownerId}`, e);
							}
							return null;
						})
					);
					bot.ownersData = ownersData.filter(Boolean);
				}
			}
		} catch (e) {
			console.error('Failed to fetch Discord user:', e);
		}

		return NextResponse.json(bot, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
