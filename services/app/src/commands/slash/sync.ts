/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export default class SyncCommand extends SlashCommandBuilder {
	constructor() {
		super('sync', {
			name: 'sync',
			description: 'Synchronize your Xernerx web profile roles and membership roles in this Discord server.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
		});
	}

	override async exec({ interaction }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL({ size: 256 });
		const botName = botUser?.username || 'Xernerx App';
		const userId = interaction.user.id;

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(userId)]);
			const SettingModel = (db.models.core as any).Setting;
			const RoleModel = (db.models.core as any).Role;
			const UserModel = (db.models.users as any).User;

			const [adminServerSetting, joinRolesSetting, userProfile, allCoreRoles] = await Promise.all([
				SettingModel
					? SettingModel.findOne({ id: 'admin_server_id' })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				SettingModel
					? SettingModel.findOne({ id: 'join_roles' })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				UserModel
					? UserModel.findOne({ id: userId })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				RoleModel
					? RoleModel.find({})
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
			]);

			const mainServerId = String(adminServerSetting?.value || '687429190165069838').trim();
			const guild = interaction.guild || interaction.client.guilds.cache.get(mainServerId) || null;
			let member: GuildMember | null = null;

			if (interaction.member instanceof GuildMember) {
				member = interaction.member;
			} else if (guild) {
				member = await guild.members.fetch(userId).catch(() => null);
			}

			let joinRoleIds: string[] = [];
			try {
				joinRoleIds = JSON.parse(joinRolesSetting?.value || '[]');
			} catch {}

			const userXernerxRoles: string[] = Array.isArray((userProfile as any)?.roles) ? (userProfile as any).roles : [];
			const assignedDiscordRoles: string[] = [];

			if (member && guild) {
				const targetGuildId = guild.id;
				const desiredDiscordRoles = new Set<string>();
				const managedDiscordRoles = new Set<string>();

				for (const r of allCoreRoles as any[]) {
					const discordRoleId = targetGuildId === mainServerId ? r.role : r.mappings?.[targetGuildId];
					if (!discordRoleId || typeof discordRoleId !== 'string' || !guild.roles.cache.has(discordRoleId)) continue;

					if (r.sync) {
						managedDiscordRoles.add(discordRoleId);
						if (userXernerxRoles.includes(r.id)) {
							desiredDiscordRoles.add(discordRoleId);
						}
					}
					if (joinRoleIds.includes(r.id)) {
						desiredDiscordRoles.add(discordRoleId);
					}
				}

				const rolesToAdd: string[] = [];
				const rolesToRemove: string[] = [];

				for (const roleId of desiredDiscordRoles) {
					assignedDiscordRoles.push(roleId);
					if (!member.roles.cache.has(roleId)) {
						rolesToAdd.push(roleId);
					}
				}
				for (const roleId of managedDiscordRoles) {
					if (!desiredDiscordRoles.has(roleId) && member.roles.cache.has(roleId)) {
						rolesToRemove.push(roleId);
					}
				}

				if (rolesToAdd.length > 0) {
					await member.roles.add(rolesToAdd).catch(() => {});
				}
				if (rolesToRemove.length > 0) {
					await member.roles.remove(rolesToRemove).catch(() => {});
				}
			}

			const roleMentions = assignedDiscordRoles.length > 0 ? assignedDiscordRoles.map((rId) => `<@&${rId}>`).join(' ') : 'Default Member';

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle('Xernerx Identity & Role Synchronization')
				.setURL(`https://app.xernerx.com/users/${userId}`)
				.setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
				.setDescription(
					userProfile
						? `Your **Xernerx Account** (\`${userProfile.name || interaction.user.username}\`) and Discord server roles are synchronized.`
						: `No Xernerx web profile was found for your Discord account yet. Sign in at [account.xernerx.com](https://account.xernerx.com) to initialize your profile and sync roles!`
				)
				.addFields([
					{
						name: 'Web Profile Status',
						value: userProfile ? '🟢 **Linked & Active**' : '🟡 **Not Registered Yet**',
						inline: true,
					},
					{
						name: 'Synchronized Server Roles',
						value: roleMentions,
						inline: true,
					},
				])
				.setFooter({
					text: `${botName} • Identity Sync`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Open Account Settings').setStyle(ButtonStyle.Link).setURL('https://account.xernerx.com'),
				new ButtonBuilder().setLabel('View Public Profile').setStyle(ButtonStyle.Link).setURL(`https://app.xernerx.com/users/${userId}`),
				new ButtonBuilder().setLabel('Explore Xernerx App').setStyle(ButtonStyle.Link).setURL('https://app.xernerx.com')
			);

			await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Error executing /sync:', error);
			await (interaction as any)[replyMethod]({
				content: 'Unable to synchronize roles right now. Manage your account at **https://account.xernerx.com**.',
			});
		}
	}
}
