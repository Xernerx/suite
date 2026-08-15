/** @format */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function syncSisterServers(addedServers: string[], db: any) {
	const botToken = process.env.DISCORD_CLIENT_TOKEN;
	if (!botToken) {
		console.log('[Sync] No bot token for sister server sync');
		return;
	}

	const RoleModel = db.models.core.Role;
	const UserModel = db.models.users.User;

	const allRoles = await RoleModel.find({}).lean();
	if (allRoles.length === 0) return;

	let mainServerRoles: any[] = [];
	try {
		const adminServerSetting = await db.models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
		const adminServerId = adminServerSetting?.value;
		if (adminServerId) {
			const res = await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/roles`, {
				headers: { Authorization: `Bot ${botToken}` },
			});
			if (res.ok) mainServerRoles = await res.json();
		}
	} catch (e) {
		console.error('[Sync] Failed to fetch main server roles for permissions:', e);
	}

	for (const guildId of addedServers) {
		console.log(`[Sync] Starting sync for sister server ${guildId}`);
		const discordRolesPayload = [];

		// 1. Create Roles & Sync Permissions
		for (const role of allRoles) {
			if (!role.mappings) role.mappings = {};

			const mainServerRole = mainServerRoles.find((r: any) => r.id === role.role);
			const targetPermissions = mainServerRole ? mainServerRole.permissions : undefined;

			if (role.mappings[guildId]) {
				discordRolesPayload.push({ id: role.mappings[guildId], uiPosition: role.position });

				if (targetPermissions !== undefined) {
					await sleep(1000);
					try {
						await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${role.mappings[guildId]}`, {
							method: 'PATCH',
							headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
							body: JSON.stringify({ permissions: targetPermissions }),
						});
					} catch (e) {
						console.error(e);
					}
				}
				continue;
			}

			await sleep(1000);

			try {
				const bodyPayload: any = {
					name: role.name,
					color: role.color ? parseInt(role.color.replace('#', ''), 16) : 0,
				};
				if (targetPermissions !== undefined) bodyPayload.permissions = targetPermissions;

				const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
					method: 'POST',
					headers: {
						Authorization: `Bot ${botToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(bodyPayload),
				});

				if (res.ok) {
					const createdRole = await res.json();
					role.mappings[guildId] = createdRole.id;

					await RoleModel.updateOne({ id: role.id }, { $set: { [`mappings.${guildId}`]: createdRole.id } });

					discordRolesPayload.push({ id: createdRole.id, uiPosition: role.position });
					console.log(`[Sync] Created role ${role.name} on ${guildId}`);
				} else {
					console.error(`[Sync] Failed to create role ${role.name}:`, await res.text());
				}
			} catch (err) {
				console.error(`[Sync] Network error creating role ${role.name}:`, err);
			}
		}

		// 2. Reposition Roles
		if (discordRolesPayload.length > 0) {
			await sleep(1000);
			try {
				const currentRolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
					headers: { Authorization: `Bot ${botToken}` },
				});
				if (currentRolesRes.ok) {
					const currentRoles = await currentRolesRes.json();
					const managedIds = discordRolesPayload.map((r) => r.id);
					const managedCurrent = currentRoles.filter((r: any) => managedIds.includes(r.id));
					const highestExistingPosition = managedCurrent.length > 0 ? Math.max(...managedCurrent.map((r: any) => r.position)) : discordRolesPayload.length;
					const maxPosition = Math.max(highestExistingPosition, discordRolesPayload.length);

					discordRolesPayload.sort((a: any, b: any) => a.uiPosition - b.uiPosition);
					const finalPayload = discordRolesPayload.map((r: any, index: number) => ({
						id: r.id,
						position: maxPosition - index,
					}));

					await sleep(1000);
					const patchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
						method: 'PATCH',
						headers: {
							Authorization: `Bot ${botToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(finalPayload),
					});
					if (!patchRes.ok) {
						console.error(`[Sync] Failed to reposition roles on ${guildId}:`, await patchRes.text());
					} else {
						console.log(`[Sync] Repositioned roles on ${guildId}`);
					}
				}
			} catch (err) {
				console.error(`[Sync] Error repositioning roles:`, err);
			}
		}

		// 3. Grant roles to existing users
		try {
			let allMembers: any[] = [];
			let lastId = '0';
			while (true) {
				await sleep(1000);
				const memRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${lastId}`, {
					headers: { Authorization: `Bot ${botToken}` },
				});
				if (!memRes.ok) {
					console.error(`[Sync] Failed to fetch members for ${guildId}:`, await memRes.text());
					break;
				}
				const members = await memRes.json();
				if (members.length === 0) break;
				allMembers.push(...members);
				lastId = members[members.length - 1].user.id;
				if (members.length < 1000) break;
			}

			const discordMemberIds = allMembers.map((m) => m.user.id);
			const usersInDb = await UserModel.find({ id: { $in: discordMemberIds } }).lean();
			const coreRoles = await RoleModel.find({ sync: true }).lean();

			for (const user of usersInDb) {
				if (!user.roles || user.roles.length === 0) continue;

				const discordRoleIdsToAssign: string[] = [];
				for (const r of coreRoles) {
					if (user.roles.includes(r.id) && r.mappings?.[guildId]) {
						discordRoleIdsToAssign.push(r.mappings[guildId]);
					}
				}

				if (discordRoleIdsToAssign.length > 0) {
					const memberData = allMembers.find((m) => m.user.id === user.id);
					if (memberData) {
						const currentRoles = memberData.roles || [];
						const rolesToAdd = discordRoleIdsToAssign.filter((id) => !currentRoles.includes(id));

						for (const roleId of rolesToAdd) {
							await sleep(1000);
							const addRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.id}/roles/${roleId}`, {
								method: 'PUT',
								headers: { Authorization: `Bot ${botToken}` },
							});
							if (!addRes.ok && addRes.status !== 204) {
								console.error(`[Sync] Failed to add role ${roleId} to user ${user.id} on ${guildId}:`, await addRes.text());
							} else {
								console.log(`[Sync] Added role ${roleId} to user ${user.id} on ${guildId}`);
							}
						}
					}
				}
			}
			console.log(`[Sync] Finished user role grants for ${guildId}`);
		} catch (err) {
			console.error(`[Sync] Error granting user roles:`, err);
		}
	}
}
