/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncUserRoles } from '@/lib/sync/users';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
	try {
		const { id: guildId, userId } = await params;
		const botTokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];

		if (botTokens.length === 0) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const body = await req.json().catch(() => ({}));
		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId }).lean();

		// Use OAuth access token from request body (NextAuth JWT session) or stored user profile
		const accessToken = body?.accessToken || user?.accounts?.discord?.access_token || user?.token;

		if (!accessToken) {
			return NextResponse.json({ error: 'User does not have an active Discord access token' }, { status: 400 });
		}

		let response: Response | null = null;
		for (const botToken of botTokens) {
			response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bot ${botToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					access_token: accessToken,
				}),
			});
			if (response.ok || response.status === 204 || response.status === 201) {
				break;
			}
		}

		if (!response) {
			return NextResponse.json({ error: 'Failed to contact Discord API' }, { status: 500 });
		}

		if (response.status === 204) {
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
