/** @format */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function syncUserRoles(userId: string, db: any, targetGuildId?: string) {
	const botToken = process.env.DISCORD_CLIENT_TOKEN;
	if (!botToken) {
		console.log('[UserSync] No bot token for user role sync');
		return;
	}

	const UserModel = db.models.users.User;
	const RoleModel = db.models.core.Role;
	const SettingModel = db.models.core.Setting;

	const user = await UserModel.findOne({ id: userId }).lean();
	if (!user) return;

	const allRoles = await RoleModel.find({ sync: true }).lean();
	const userRoleIds = user.roles || [];

	const adminServerSetting = await SettingModel.findOne({ id: 'admin_server_id' }).lean();
	const adminServerId = adminServerSetting?.value;

	const sisterServersSetting = await SettingModel.findOne({ id: 'sister_servers' }).lean();
	const sisterServers = sisterServersSetting?.value ? JSON.parse(sisterServersSetting.value) : [];

	let allServers: string[] = [];
	if (adminServerId) allServers.push(adminServerId);
	sisterServers.forEach((s: any) => {
		if (s.id && !allServers.includes(s.id)) allServers.push(s.id);
	});

	if (targetGuildId) {
		if (!allServers.includes(targetGuildId)) return;
		allServers = [targetGuildId];
	}

	for (const guildId of allServers) {
		const managedDiscordRoles: string[] = [];
		const desiredDiscordRoles: string[] = [];

		for (const r of allRoles) {
			let discordId = null;
			if (guildId === adminServerId) {
				discordId = r.role;
			} else if (r.mappings && r.mappings[guildId]) {
				discordId = r.mappings[guildId];
			}

			if (discordId) {
				managedDiscordRoles.push(discordId);
				if (userRoleIds.includes(r.id)) {
					desiredDiscordRoles.push(discordId);
				}
			}
		}

		if (managedDiscordRoles.length === 0) continue;

		try {
			await sleep(1000);
			const memRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
				headers: { Authorization: `Bot ${botToken}` },
			});

			if (!memRes.ok) continue; // User probably not in this server

			const member = await memRes.json();
			const currentRoles = member.roles || [];

			// Compute what roles the member should have on this server
			// Keep roles we don't manage, ensure they have all desired managed roles
			const unmanagedRoles = currentRoles.filter((rId: string) => !managedDiscordRoles.includes(rId));
			const finalRoles = Array.from(new Set([...unmanagedRoles, ...desiredDiscordRoles]));

			const currentSorted = [...currentRoles].sort().join(',');
			const finalSorted = [...finalRoles].sort().join(',');

			if (currentSorted !== finalSorted) {
				await sleep(1000);
				const patchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
					method: 'PATCH',
					headers: {
						Authorization: `Bot ${botToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ roles: finalRoles }),
				});

				if (!patchRes.ok) {
					console.error(`[UserSync] Failed to patch roles for ${userId} in ${guildId}:`, await patchRes.text());
				} else {
					console.log(`[UserSync] Successfully synced roles for ${userId} in ${guildId}`);
				}
			}
		} catch (e) {
			console.error(`[UserSync] Error syncing roles for ${userId} in ${guildId}:`, e);
		}
	}
}
