/** @format */

import { database } from '@xernerx/lib/core';
import { ContextCommandBuilder, type ContextCommandOptions } from '@xernerx/framework';
import { ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { DEFAULT_XERNERX_COLOR, getUserAccentColor, parseHexColor } from '../../lib/botUtils.js';

const VANITY_BADGE_LABELS: Record<string, string> = {
	dot_matrix_banner: 'Dot-Matrix Architect',
	credit_patron: 'Credit Patron',
	high_roller: 'High Roller',
	vault_sovereign: 'Vault Sovereign',
};

export default class ViewProfileContextCommand extends ContextCommandBuilder {
	constructor() {
		super('View Xernerx Profile', {
			name: 'View Xernerx Profile',
			description: 'View a Discord user or bot profile on the Xernerx ecosystem via right-click context menu.',
			type: ApplicationCommandType.User,
			defer: true,
			deploy: { global: true },
		});
	}

	override async exec({ interaction }: ContextCommandOptions<'user'>) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const targetDiscordUser = interaction.targetUser;
		const targetId = targetDiscordUser.id;
		const isSelf = targetId === interaction.user.id;

		try {
			const db = await database('xernerx');

			if (targetDiscordUser.bot) {
				const BotModel = (db.models.bots as any).Bot;
				const StatModel = (db.models.bots as any).Stat;
				const VoteModel = (db.models.bots as any).Vote;
				const CommandModel = (db.models.bots as any).Command;
				const accentColor = await getUserAccentColor(interaction.user.id);

				const bot = await BotModel.findOne({ id: targetId }).lean();
				if (!bot) {
					const notFoundEmbed = new EmbedBuilder()
						.setColor(0xe06c75)
						.setTitle('Bot Not Registered')
						.setDescription(`**${targetDiscordUser.username}** is not registered on the [Xernerx Bot Directory](https://app.xernerx.com).`)
						.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
						.setFooter({
							text: `${clientBotName} • Bot Profile`,
							iconURL: clientBotAvatar,
						})
						.setTimestamp();

					return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
				}

				const isOwner = Array.isArray(bot.owners) && bot.owners.map(String).includes(interaction.user.id);
				if (bot.privacy === 'private' && !isOwner) {
					const privateEmbed = new EmbedBuilder()
						.setColor(accentColor)
						.setTitle('Private Bot')
						.setDescription(`**${bot.name || targetDiscordUser.username}** is set to **private**.`)
						.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
						.setFooter({
							text: `${clientBotName} • Bot Profile`,
							iconURL: clientBotAvatar,
						})
						.setTimestamp();

					return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
				}

				const [latestStat, voteCount, commandCount] = await Promise.all([
					StatModel
						? StatModel.findOne({ id: targetId })
								.sort({ timestamp: -1 })
								.lean()
								.catch(() => null)
						: Promise.resolve(null),
					VoteModel ? VoteModel.countDocuments({ botId: targetId }).catch(() => bot.voteCount || 0) : Promise.resolve(bot.voteCount || 0),
					CommandModel ? CommandModel.countDocuments({ botId: targetId }).catch(() => (bot.commands || []).length) : Promise.resolve((bot.commands || []).length),
				]);

				const guildCount = (latestStat as any)?.guildCount ?? 0;
				const userCount = (latestStat as any)?.userCount ?? 0;
				const botUrl = `https://app.xernerx.com/bots/${targetId}`;

				const botEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(targetDiscordUser.globalName || targetDiscordUser.username || bot.name)
					.setURL(botUrl)
					.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 512 }))
					.setDescription(bot.description || bot.info || `Explore **${bot.name || targetDiscordUser.username}** on the Xernerx Bot Directory.`)
					.addFields([
						{
							name: 'Metrics',
							value: [
								`• **Servers:** \`${guildCount.toLocaleString()}\``,
								`• **Users:** \`${userCount.toLocaleString()}\``,
								`• **Votes:** \`${Number(voteCount).toLocaleString()}\``,
								`• **Commands:** \`${Number(commandCount).toLocaleString()}\``,
							].join('\n'),
							inline: true,
						},
						{
							name: 'Developers',
							value: Array.isArray(bot.owners) && bot.owners.length > 0 ? bot.owners.map((id: string) => `<@${id}>`).join(', ') : 'Xernerx Studios',
							inline: true,
						},
					])
					.setFooter({
						text: `${clientBotName} • Bot Profile`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [botEmbed] });
			}

			// Regular User Profile
			const UserModel = (db.models.users as any).User;
			const AppearanceModel = (db.models.users as any).Appearance;
			const CreditModel = (db.models.users as any).Credit;

			const [userProfile, appearanceDoc, creditDoc] = await Promise.all([
				UserModel.findOne({ id: targetId })
					.lean()
					.catch(() => null),
				AppearanceModel
					? AppearanceModel.findOne({ ownerId: targetId })
							.select('accent')
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				CreditModel.findOne({ ownerId: targetId })
					.lean()
					.catch(() => null),
			]);

			const accentColor = parseHexColor(appearanceDoc?.accent) ?? (await getUserAccentColor(interaction.user.id)) ?? DEFAULT_XERNERX_COLOR;

			if (userProfile?.privacy === 'private' && !isSelf) {
				const privateEmbed = new EmbedBuilder()
					.setColor(DEFAULT_XERNERX_COLOR)
					.setTitle('Private Profile')
					.setDescription(`**${targetDiscordUser.globalName || targetDiscordUser.username}**'s profile is set to **private**.`)
					.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
					.setFooter({
						text: `${clientBotName} • User Profile`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			const displayName = userProfile?.name || targetDiscordUser.globalName || targetDiscordUser.username || 'Xernerx User';
			const avatarUrl = userProfile?.icon && String(userProfile.icon).startsWith('http') ? userProfile.icon : targetDiscordUser.displayAvatarURL({ size: 512 });
			const profileUrl = `https://app.xernerx.com/users/${targetId}`;
			const streak = (creditDoc as any)?.streak || 0;
			const balance = (creditDoc as any)?.balance || 0;
			const rawBadges: string[] = Array.isArray((creditDoc as any)?.activeBadges) ? (creditDoc as any).activeBadges : [];
			const vanityBadges = rawBadges.map((b) => VANITY_BADGE_LABELS[b] || b).filter(Boolean);

			const userEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(displayName)
				.setURL(profileUrl)
				.setThumbnail(avatarUrl)
				.setDescription(userProfile?.description || userProfile?.info || `View **${displayName}** on [app.xernerx.com](${profileUrl}).`)
				.addFields([
					{
						name: 'Overview',
						value: [
							`• **User:** <@${targetId}>`,
							...(userProfile?.verified ? ['• **Verified:** Yes'] : []),
							...(userProfile?.pronouns ? [`• **Pronouns:** ${userProfile.pronouns}`] : []),
						].join('\n'),
						inline: true,
					},
					{
						name: 'Rewards',
						value: [
							`• **Streak:** \`${streak}d\``,
							...(isSelf ? [`• **Credits:** \`${balance.toLocaleString()}\``] : []),
							...(vanityBadges.length > 0 ? [`• **Badges:** ${vanityBadges.map((b) => `\`${b}\``).join(', ')}`] : []),
						].join('\n'),
						inline: true,
					},
				])
				.setFooter({
					text: `${clientBotName} • User Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [userEmbed] });
		} catch (error) {
			console.error('Error executing View Xernerx Profile context command:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Profile')
				.setDescription('An error occurred while fetching the profile. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
