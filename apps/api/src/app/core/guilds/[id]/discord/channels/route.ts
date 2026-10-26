/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
	}

	const candidateTokens = Array.from(new Set([process.env.VIRTUE_BOT_TOKEN, process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean) as string[]));

	try {
		for (const token of candidateTokens) {
			const res = await fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
				headers: {
					Authorization: `Bot ${token}`,
				},
				next: { revalidate: 300 },
			}).catch(() => null);

			if (res && res.ok) {
				const channels = await res.json();
				return NextResponse.json(channels, { status: 200 });
			}
		}

		// Fallback to channels synced by Virtue bot in the virtue database
		const virtueDb = await database('virtue').catch(() => null);
		const VirtueGuildModel = (virtueDb?.models?.profiles as any)?.Guild;
		if (VirtueGuildModel) {
			const virtueProfile: any = await VirtueGuildModel.findOne({ id })
				.select('serverChannels')
				.lean()
				.catch(() => null);
			if (Array.isArray(virtueProfile?.serverChannels) && virtueProfile.serverChannels.length > 0) {
				return NextResponse.json(virtueProfile.serverChannels, { status: 200 });
			}
		}

		return NextResponse.json({ error: 'Failed to fetch Discord guild channels' }, { status: 404 });
	} catch (error) {
		console.error('Failed to fetch Discord guild channels:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
