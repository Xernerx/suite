import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { GuildMember } from 'discord.js';

export default class GuildMemberAddEvent extends EventBuilder {
	constructor() {
		super('guildMemberAdd', {
			name: 'guildMemberAdd',
			emitter: 'client',
			once: false,
		});
	}

	override async run(member: GuildMember) {
		try {
			const db = await database('xernerx');

			// Verify this is the main server OR a sister server
			const adminServerSetting = await db.models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
			const sisterServersSetting = await db.models.core.Setting.findOne({ id: 'sister_servers' }).lean();

			const mainServerId = adminServerSetting?.value;
			let sisterServers: any[] = [];
			try {
				sisterServers = JSON.parse(sisterServersSetting?.value || '[]');
			} catch {}

			const allGuildIds = [mainServerId, ...sisterServers.map((s: any) => s.id)].filter(Boolean);

			if (!allGuildIds.includes(member.guild.id)) return;

			// Fetch the general roles to apply
			const rolesSettingId = member.user.bot ? 'bot_join_roles' : 'join_roles';
			const joinRolesSetting = await db.models.core.Setting.findOne({ id: rolesSettingId }).lean();

			let joinRoleIds: string[] = [];
			try {
				joinRoleIds = JSON.parse(joinRolesSetting?.value || '[]');
			} catch {}

			let discordRoleIdsToAssign: string[] = [];

			if (joinRoleIds.length > 0) {
				// joinRoleIds are Xernerx Role IDs, map them to this guild's Discord roles
				const coreRoles = await db.models.core.Role.find({ id: { $in: joinRoleIds } }).lean();
				for (const r of coreRoles) {
					if (member.guild.id === mainServerId && r.role) {
						discordRoleIdsToAssign.push(r.role as string);
					} else if (r.mappings?.[member.guild.id]) {
						discordRoleIdsToAssign.push(r.mappings[member.guild.id] as string);
					}
				}
			}

			// If it's a human, ALSO sync their profile roles
			if (!member.user.bot) {
				const userProfile = await db.models.users.User.findOne({ id: member.id }).lean();
				if (userProfile && userProfile.roles && userProfile.roles.length > 0) {
					const coreRoles = await db.models.core.Role.find({ id: { $in: userProfile.roles }, sync: true }).lean();
					for (const r of coreRoles) {
						if (member.guild.id === mainServerId && r.role) {
							discordRoleIdsToAssign.push(r.role as string);
						} else if (r.mappings?.[member.guild.id]) {
							discordRoleIdsToAssign.push(r.mappings[member.guild.id] as string);
						}
					}
				}
			}

			if (discordRoleIdsToAssign.length > 0) {
				// Deduplicate and filter existing roles in the guild
				const uniqueRoleIds = [...new Set(discordRoleIdsToAssign)];
				const validRoles = uniqueRoleIds.filter((id) => member.guild.roles.cache.has(id));

				if (validRoles.length > 0) {
					await member.roles.add(validRoles).catch(console.error);
				}
			}
		} catch (error) {
			console.error(`Failed to handle guildMemberAdd for ${member.id}:`, error);
		}
	}
}
