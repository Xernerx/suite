/** @format */

import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const authHeader = req.headers.get('authorization');

	if (!id || !authHeader) {
		return NextResponse.json({ error: 'Missing ID or authorization token' }, { status: 400 });
	}

	try {
		const res = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
			headers: {
				Authorization: authHeader,
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Failed to fetch guilds from Discord' }, { status: res.status });
		}

		const data = await res.json();

		const mappedGuilds = data.map((guild: any) => ({
			...guild,
			iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
			bannerUrl: guild.banner ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${guild.banner.startsWith('a_') ? 'gif' : 'png'}?size=2048` : null,
		}));

		return NextResponse.json(mappedGuilds, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch Discord user guilds:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
