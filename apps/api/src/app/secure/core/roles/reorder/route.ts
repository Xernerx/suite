/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PATCH(req: Request) {
	try {
		const rolesArray = await req.json(); // [{ id: 'xernerx_role_id', position: 0 }, ...]
		const db = (await database('xernerx')).models.core as any;
		const RoleModel = db.Role;

		// 1. Update the database positions
		const bulkOps = rolesArray.map((role: any) => ({
			updateOne: {
				filter: { id: role.id },
				update: { $set: { position: role.position } },
			},
		}));

		if (bulkOps.length > 0) {
			await RoleModel.bulkWrite(bulkOps);
		}

		// 2. Fetch all roles to get their Discord mappings
		const allRoles = await RoleModel.find({}).lean();

		// 3. Get the main server and sister servers
		const adminServerSetting = await db.Setting.findOne({ id: 'admin_server_id' }).lean();
		const sisterServersSetting = await db.Setting.findOne({ id: 'sister_servers' }).lean();

		const mainServerId = adminServerSetting?.value;
		let sisterServers: { id: string }[] = [];
		try {
			sisterServers = JSON.parse(sisterServersSetting?.value || '[]');
		} catch (e) {}

		const allGuildIds = [mainServerId, ...sisterServers.map((s) => s.id)].filter(Boolean);
		const botToken = process.env.DISCORD_CLIENT_TOKEN;

		if (!botToken || allGuildIds.length === 0) {
			return NextResponse.json({ success: true, message: 'Database updated, but Discord sync skipped (missing config)' }, { status: 200 });
		}

		// 4. Send bulk PATCH to each server
		const errors: any[] = [];
		for (const guildId of allGuildIds) {
			// First, fetch current roles from Discord to find the correct absolute positioning
			const currentRolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
				headers: { Authorization: `Bot ${botToken}` },
			});
			if (!currentRolesRes.ok) {
				errors.push({ guildId, error: 'Failed to fetch current roles for positioning' });
				continue;
			}
			const currentRoles = await currentRolesRes.json();

			// Construct the discord roles array for this specific guild
			const discordRolesPayload = rolesArray
				.map((r: any) => {
					const fullRole = allRoles.find((dbRole: any) => dbRole.id === r.id);
					let discordRoleId = fullRole?.role;
					if (guildId !== mainServerId && fullRole?.mappings?.[guildId]) {
						discordRoleId = fullRole.mappings[guildId];
					}

					if (!discordRoleId) return null;
					return { id: discordRoleId, uiPosition: r.position };
				})
				.filter(Boolean);

			if (discordRolesPayload.length === 0) continue;

			// Find the maximum position currently held by any of our managed roles on Discord
			const managedDiscordIds = discordRolesPayload.map((r: any) => r.id);
			const managedCurrentRoles = currentRoles.filter((r: any) => managedDiscordIds.includes(r.id));

			const highestExistingPosition = managedCurrentRoles.length > 0 ? Math.max(...managedCurrentRoles.map((r: any) => r.position)) : discordRolesPayload.length;
			const maxPosition = Math.max(highestExistingPosition, discordRolesPayload.length);

			discordRolesPayload.sort((a: any, b: any) => a.uiPosition - b.uiPosition);
			const finalPayload = discordRolesPayload.map((r: any, index: number) => ({
				id: r.id,
				position: maxPosition - index,
			}));

			if (finalPayload.length === 0) continue;

			const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bot ${botToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(finalPayload),
			});

			if (!response.ok) {
				errors.push({ guildId, error: await response.json() });
			}
		}

		if (errors.length > 0) {
			return NextResponse.json({ success: true, warnings: errors }, { status: 207 });
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error: any) {
		console.error('Failed to reorder roles:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
