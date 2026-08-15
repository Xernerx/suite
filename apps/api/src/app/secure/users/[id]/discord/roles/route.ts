/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = (await params).id;
		const body = await req.json();
		const { roleId } = body;

		if (!userId) {
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
		}

		if (!roleId) {
			return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const adminServerSetting = await models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
		const guildId = adminServerSetting?.value;
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!guildId || !botToken) {
			return NextResponse.json({ error: 'Discord configuration missing on server' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
			method: 'PUT',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json({ error: 'Failed to assign Discord role', details: errorData }, { status: response.status });
		}

		return NextResponse.json({ success: true, message: 'Role assigned successfully' }, { status: 200 });
	} catch (error: any) {
		console.error('Error assigning Discord role:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = (await params).id;
		const body = await req.json();
		const { roleId } = body;

		if (!userId || !roleId) {
			return NextResponse.json({ error: 'User ID and Role ID are required' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const adminServerSetting = await models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
		const guildId = adminServerSetting?.value;
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!guildId || !botToken) {
			return NextResponse.json({ error: 'Discord configuration missing on server' }, { status: 500 });
		}

		const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bot ${botToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			return NextResponse.json({ error: 'Failed to remove Discord role', details: errorData }, { status: response.status });
		}

		return NextResponse.json({ success: true, message: 'Role removed successfully' }, { status: 200 });
	} catch (error: any) {
		console.error('Error removing Discord role:', error);
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
	}
}
