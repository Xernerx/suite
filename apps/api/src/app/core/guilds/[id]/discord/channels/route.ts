/** @format */

import { NextResponse } from 'next/server';
import { fetchGuildChannelsCached } from '@/lib/discordGuildResources';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
	}

	try {
		const channels = await fetchGuildChannelsCached(id);
		if (Array.isArray(channels) && channels.length > 0) {
			return NextResponse.json(channels, { status: 200 });
		}

		return NextResponse.json({ error: 'Failed to fetch Discord guild channels' }, { status: 404 });
	} catch (error) {
		console.error('Failed to fetch Discord guild channels:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
