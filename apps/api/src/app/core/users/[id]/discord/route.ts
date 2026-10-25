/** @format */

import { NextResponse } from 'next/server';

const discordUserCache = new Map<string, { payload: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];

	if (!id || tokens.length === 0) {
		return NextResponse.json({ error: 'Missing ID or token' }, { status: 400 });
	}

	const cached = discordUserCache.get(id);
	if (cached && cached.expiresAt > Date.now()) {
		return NextResponse.json(cached.payload, { status: 200 });
	}

	try {
		let res: Response | null = null;
		for (const token of tokens) {
			res = await fetch(`https://discord.com/api/v10/users/${id}`, {
				headers: {
					Authorization: `Bot ${token}`,
				},
				next: { revalidate: 3600 },
			});
			if (res.ok) break;
		}

		if (!res || !res.ok) {
			return NextResponse.json({ error: 'Discord user not found' }, { status: res?.status || 404 });
		}

		const data = await res.json();
		const payload = {
			...data,
			avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
			bannerUrl: data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
		};

		discordUserCache.set(id, { payload, expiresAt: Date.now() + CACHE_TTL_MS });

		return NextResponse.json(payload, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch Discord user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
