/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
	try {
		const { id: guildId, userId } = await params;
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId }).lean();

		// Assuming the user schema stores OAuth access token in accounts.discord or similar
		const accessToken = user?.accounts?.discord?.access_token || user?.token;

		if (!accessToken) {
			return NextResponse.json({ error: 'User does not have an active Discord access token' }, { status: 400 });
		}

		const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				access_token: accessToken,
			}),
		});

		if (response.status === 204) {
			const { syncUserRoles } = require('../../../../../core/users/sync');
			setTimeout(async () => {
				try {
					const db = await database('xernerx');
					await syncUserRoles(userId, db, guildId);
				} catch (err) {
					console.error('[UserSync]', err);
				}
			}, 0);
			return NextResponse.json({ success: true, message: 'User is already a member of the guild' }, { status: 200 });
		}

		const data = await response.json();
		const { syncUserRoles } = require('../../../../../core/users/sync');
		setTimeout(async () => {
			try {
				const db = await database('xernerx');
				await syncUserRoles(userId, db, guildId);
			} catch (err) {
				console.error('[UserSync]', err);
			}
		}, 0);
		return NextResponse.json(data, { status: response.status });
	} catch (error: any) {
		console.error('Error adding user to Discord guild:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}
