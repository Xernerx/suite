/** @format */
'use server';

import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id || !process.env.DISCORD_CLIENT_TOKEN) {
		return NextResponse.json({ error: 'Missing ID or token' }, { status: 400 });
	}

	try {
		const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
			headers: {
				Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}`,
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Discord user not found' }, { status: res.status });
		}

		const data = await res.json();

		return NextResponse.json(
			{
				...data,
				avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
				bannerUrl: data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to fetch Discord user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
