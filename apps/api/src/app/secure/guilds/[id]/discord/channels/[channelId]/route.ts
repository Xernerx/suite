/** @format */

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; channelId: string }> }) {
	try {
		const { channelId } = await params;
		const body = await req.json();
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error: any) {
		console.error('Error updating Discord channel:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; channelId: string }> }) {
	try {
		const { channelId } = await params;
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken) {
			return NextResponse.json({ error: 'Discord token missing' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bot ${botToken}`,
			},
		});

		if (response.status === 204) {
			return new NextResponse(null, { status: 204 });
		}

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error: any) {
		console.error('Error deleting Discord channel:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}
