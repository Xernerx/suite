/** @format */

import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id || !process.env.DISCORD_CLIENT_TOKEN) {
		return NextResponse.json({ error: 'Missing ID or token' }, { status: 400 });
	}

	try {
		const res = await fetch(`https://discord.com/api/v10/guilds/${id}/roles`, {
			headers: {
				Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}`,
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Failed to fetch Discord guild roles' }, { status: res.status });
		}

		const roles = await res.json();

		return NextResponse.json(roles, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch Discord guild roles:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
