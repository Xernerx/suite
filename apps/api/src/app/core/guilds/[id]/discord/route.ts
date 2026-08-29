/** @format */

import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id || !process.env.DISCORD_CLIENT_TOKEN) {
		return NextResponse.json({ error: 'Missing ID or token' }, { status: 400 });
	}

	try {
		const res = await fetch(`https://discord.com/api/v10/guilds/${id}?with_counts=true`, {
			headers: {
				Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}`,
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Discord guild not found' }, { status: res.status });
		}

		const data = await res.json();

		return NextResponse.json(
			{
				...data,
				iconUrl: data.icon ? `https://cdn.discordapp.com/icons/${id}/${data.icon}.${data.icon.startsWith('a_') ? 'gif' : 'png'}` : null,
				bannerUrl: data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith('a_') ? 'gif' : 'png'}` : null,
				splashUrl: data.splash ? `https://cdn.discordapp.com/splashes/${id}/${data.splash}.png` : null,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to fetch Discord guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
