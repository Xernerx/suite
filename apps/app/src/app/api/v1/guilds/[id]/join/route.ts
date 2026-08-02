/** @format */

'use server';

import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/schema/auth';
import check from '@/lib/functions/check';
import { getServerSession } from 'next-auth';
import getToken from '@/lib/functions/getToken';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const token = await getToken(request);

	// ✅ enforce session-only
	const c = await check({ token, sessionOnly: true });
	if (c) return c;

	const id = (await params).id;

	if (!id) {
		return NextResponse.json({ message: 'Missing user id.' }, { status: 400 });
	}

	const session: any = await getServerSession(authOptions);
	const userId = session?.user?.id;
	const accessToken = session?.accessToken;

	if (!userId || !accessToken) {
		return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
	}

	const botToken = process.env.DISCORD_CLIENT_TOKEN;

	if (!botToken) {
		return NextResponse.json({ message: 'Bot token not configured.' }, { status: 500 });
	}

	try {
		const response = await fetch(`https://discord.com/api/v10/guilds/${id}/members/${userId}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ access_token: accessToken }),
		});

		if (response.status === 204) {
			return NextResponse.json({ message: 'Already part of this server!' }, { status: 200 });
		}

		if (!response.ok) {
			const body = await response.json().catch(() => null);

			return NextResponse.json(
				{
					message: body?.message ?? `Failed to add user (${response.status})`,
				},
				{ status: response.status }
			);
		}

		return NextResponse.json({ message: 'Added you to the server!' }, { status: 200 });
	} catch {
		return NextResponse.json({ message: 'Failed to add user due to an internal error.' }, { status: 500 });
	}
}
