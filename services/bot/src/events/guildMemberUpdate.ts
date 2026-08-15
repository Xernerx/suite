import { database } from '@xernerx/lib/core';
/** @format */

import { EventBuilder } from '@xernerx/framework';
import { GuildMember } from 'discord.js';

export default class GuildMemberUpdateEvent extends EventBuilder {
	constructor() {
		super('guildMemberUpdate', {
			name: 'guildMemberUpdate',
			emitter: 'client',
			once: false,
		});
	}

	override async run(oldMember: GuildMember, newMember: GuildMember) {
		if (newMember.user.bot) return;

		try {
			const db = await database('xernerx');

			// Verify this is the main server
			const adminServerSetting = await db.models.core.Setting.findOne({ id: 'admin_server_id' }).lean();
			const mainServerId = adminServerSetting?.value;

			if (!mainServerId || newMember.guild.id !== mainServerId) return;

			// Check if roles have changed
			if (oldMember.roles.cache.equals(newMember.roles.cache)) return;

			// Get User Profile
			const userProfile = await db.models.users.User.findOne({ id: newMember.id }).lean();
			if (!userProfile) return;

			// Get all synced core roles
			const allCoreRoles = await db.models.core.Role.find({ sync: true }).lean();
			const userXernerxRoles = userProfile.roles || [];

			const expectedDiscordRoleIds = new Set<string>();
			const mappedDiscordRoles = new Set<string>();

			allCoreRoles.forEach((r: any) => {
				if (typeof r.role === 'string' && r.role.trim() !== '') {
					mappedDiscordRoles.add(r.role);
					if (userXernerxRoles.includes(r.id)) {
						expectedDiscordRoleIds.add(r.role);
					}
				}
			});

			const rolesToAdd: string[] = [];
			const rolesToRemove: string[] = [];

			for (const discordRoleId of mappedDiscordRoles) {
				if (!newMember.guild.roles.cache.has(discordRoleId)) continue;

				const shouldHave = expectedDiscordRoleIds.has(discordRoleId);
				const doesHave = newMember.roles.cache.has(discordRoleId);

				if (shouldHave && !doesHave) {
					rolesToAdd.push(discordRoleId);
				} else if (!shouldHave && doesHave) {
					rolesToRemove.push(discordRoleId);
				}
			}

			if (rolesToAdd.length > 0) {
				await newMember.roles.add(rolesToAdd).catch(console.error);
			}
			if (rolesToRemove.length > 0) {
				await newMember.roles.remove(rolesToRemove).catch(console.error);
			}
		} catch (error) {
			console.error(`Failed to handle guildMemberUpdate for ${newMember.id}:`, error);
		}
	}
}
