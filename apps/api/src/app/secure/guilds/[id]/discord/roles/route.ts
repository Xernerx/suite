/** @format */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const guildId = (await params).id;
		const body = await req.json();
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
			method: 'POST',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body), // { name, color, hoist, permissions, mentionable }
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error: any) {
		console.error('Error creating Discord role:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const guildId = (await params).id;
		const rolesArray = await req.json(); // [{ id, position }]
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(rolesArray),
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error: any) {
		console.error('Error bulk updating Discord roles:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}
