/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;
		const roles = await RoleModel.find({}).lean();
		return NextResponse.json(roles, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch roles:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;

		const role = await RoleModel.findOne({ id: body.id }).lean();

		if (role) {
			return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
		}

		const sisterServersSetting = await db.Setting.findOne({ id: 'sister_servers' }).lean();
		let sisterServers: { id: string }[] = [];
		try {
			sisterServers = JSON.parse(sisterServersSetting?.value || '[]');
		} catch (e) {}

		const botToken = process.env.DISCORD_CLIENT_TOKEN;
		let mappings: Record<string, string> = {};

		// If a role name and bot token exist, create the role on sister servers
		if (botToken && body.name && sisterServers.length > 0) {
			for (const server of sisterServers) {
				try {
					const res = await fetch(`https://discord.com/api/v10/guilds/${server.id}/roles`, {
						method: 'POST',
						headers: {
							Authorization: `Bot ${botToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							name: body.name,
						}),
					});

					if (res.ok) {
						const createdDiscordRole = await res.json();
						mappings[server.id] = createdDiscordRole.id;
					}
				} catch (err) {
					console.error(`Failed to create role on sister server ${server.id}`, err);
				}
			}
		}

		const newRole = await RoleModel.create({
			...body,
			mappings,
		});
		return NextResponse.json(newRole, { status: 201 });
	} catch (error) {
		console.error('Failed to create role:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
