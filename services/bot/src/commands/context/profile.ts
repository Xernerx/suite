/** @format */

import { database, getHighestMilestoneBadge } from '@xernerx/lib/core';
import { ContextCommandBuilder } from '@xernerx/framework';
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { DEFAULT_XERNERX_COLOR, getUserAccentColor, parseHexColor } from '../../lib/botUtils.js';
import { ensureMilestoneEmojisLoaded, getMilestoneEmoji } from '../../lib/milestoneEmojis.js';

export default class ViewXernerxProfileContextCommand extends ContextCommandBuilder {
	constructor() {
		super('viewXernerxProfile', {
			name: 'View Xernerx Profile',
			description: 'View this user or bot on the Xernerx ecosystem directory.',
			type: ApplicationCommandType.User,
			defer: true,
			deploy: { global: true },
		});
	}

	override async exec(args: Parameters<ContextCommandBuilder['exec']>[0]) {
		const { interaction } = args;
		if (!interaction.isUserContextMenuCommand()) return;

		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const targetDiscordUser = interaction.targetUser;
		const targetId = targetDiscordUser.id;
		const isSelf = targetId === interaction.user.id;

		try {
			const [db, requesterAccent] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id), ensureMilestoneEmojisLoaded(interaction.client)]);

			if (targetDiscordUser.bot) {
				const BotModel = (db.models.bots as any).Bot;
				const StatModel = (db.models.bots as any).Stat;
				const VoteModel = (db.models.bots as any).Vote;
				const ReviewModel = (db.models.bots as any).Review;

				const bot = await BotModel.findOne({ id: targetId })
					.lean()
					.catch(() => null);
				const botUrl = `https://app.xernerx.com/bots/${targetId}`;
				const compareUrl = `https://app.xernerx.com/compare?type=bots&a=${targetId}`;

				if (!bot) {
					const unlistedEmbed = new EmbedBuilder()
						.setColor(requesterAccent)
						.setTitle(targetDiscordUser.username)
						.setURL('https://app.xernerx.com')
						.setDescription(`**${targetDiscordUser.username}** is not listed on the Xernerx Bot Directory yet.\n\nExplore verified Discord bots or submit your own bot on **Xernerx**!`)
						.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
						.setFooter({
							text: `${clientBotName} • Bot Directory`,
							iconURL: clientBotAvatar,
						})
						.setTimestamp();

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder().setLabel('Explore Bots on Xernerx').setStyle(ButtonStyle.Link).setURL('https://app.xernerx.com'),
						new ButtonBuilder().setLabel('Developer Portal').setStyle(ButtonStyle.Link).setURL('https://portal.xernerx.com')
					);

					return await (interaction as any)[replyMethod]({ embeds: [unlistedEmbed], components: [row] });
				}

				const isOwner = Array.isArray(bot.owners) && bot.owners.map(String).includes(interaction.user.id);
				if (bot.privacy === 'private' && !isOwner) {
					const privateEmbed = new EmbedBuilder()
						.setColor(requesterAccent)
						.setTitle('Private Bot Listing')
						.setDescription(`**${bot.name || targetDiscordUser.username}** is set to **private** by its owners.`)
						.setFooter({
							text: `${clientBotName} • Bot Directory`,
							iconURL: clientBotAvatar,
						})
						.setTimestamp();

					return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
				}

				const [latestStat, voteCount, reviews] = await Promise.all([
					StatModel
						? StatModel.findOne({ id: targetId })
								.sort({ timestamp: -1 })
								.lean()
								.catch(() => null)
						: Promise.resolve(null),
					VoteModel ? VoteModel.countDocuments({ botId: targetId }).catch(() => bot.voteCount || 0) : Promise.resolve(bot.voteCount || 0),
					ReviewModel
						? ReviewModel.find({ botId: targetId })
								.select('rating')
								.lean()
								.catch(() => [])
						: Promise.resolve([]),
				]);

				const servers = (latestStat as any)?.guildCount ?? 0;
				const users = (latestStat as any)?.userCount ?? 0;
				const avgRating = reviews.length > 0 ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) : null;

				const serverMilestone = getHighestMilestoneBadge(servers, 'servers');
				const memberMilestone = getHighestMilestoneBadge(users, 'members');
				const serverMilestoneEmoji = getMilestoneEmoji(interaction.client, 'servers', serverMilestone.tier);
				const memberMilestoneEmoji = getMilestoneEmoji(interaction.client, 'members', memberMilestone.tier);

				const embed = new EmbedBuilder()
					.setColor(requesterAccent)
					.setTitle(bot.name || targetDiscordUser.username)
					.setURL(botUrl)
					.setDescription(bot.description || bot.shortDescription || `Explore **${bot.name || targetDiscordUser.username}** on the Xernerx Bot Directory.`)
					.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
					.addFields([
						{
							name: 'Metrics',
							value: [
								`• **Servers:** \`${servers.toLocaleString()}\``,
								`• **Users:** \`${users.toLocaleString()}\``,
								`• **Votes:** \`${Number(voteCount || 0).toLocaleString()}\``,
								`• **Rating:** ${avgRating ? `\`${avgRating} / 5.0\` (\`${reviews.length}\`)` : '`No reviews`'}`,
							].join('\n'),
							inline: true,
						},
						{
							name: 'Overview',
							value: [`• **Status:** \`${String(bot.status || 'offline').toUpperCase()}\``, `• **Verified:** \`${bot.verified ? 'Yes' : 'No'}\``].join('\n'),
							inline: true,
						},
						{
							name: 'Milestones',
							value: [
								`${serverMilestoneEmoji} **${serverMilestone.label}** ${serverMilestone.unlocked ? `(\`Tier #${serverMilestone.tier}\`)` : '(`Starter Tier`)'}`,
								`${memberMilestoneEmoji} **${memberMilestone.label}** ${memberMilestone.unlocked ? `(\`Tier #${memberMilestone.tier}\`)` : '(`Starter Tier`)'}`,
							].join('\n'),
							inline: false,
						},
					])
					.setFooter({
						text: `${clientBotName} • Bot Profile`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setLabel('View Full Bot Page on Xernerx').setStyle(ButtonStyle.Link).setURL(botUrl),
					new ButtonBuilder().setLabel('Compare with Another Bot').setStyle(ButtonStyle.Link).setURL(compareUrl)
				);

				return await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
			}

			// Human User Profile
			const UserModel = (db.models.users as any).User;
			const AppearanceModel = (db.models.users as any).Appearance;
			const CreditModel = (db.models.users as any).Credit;
			const BotModel = (db.models.bots as any).Bot;
			const OrganizationModel = (db.models.organizations as any).Organization;

			const [userProfile, appearanceDoc, creditDoc, ownedBotsCount, orgCount] = await Promise.all([
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
				BotModel.countDocuments({ owners: targetId, privacy: 'public' }).catch(() => 0),
				OrganizationModel.countDocuments({ $or: [{ owner: targetId }, { members: targetId }], privacy: 'public' }).catch(() => 0),
			]);

			const accentColor = parseHexColor(appearanceDoc?.accent) ?? requesterAccent ?? DEFAULT_XERNERX_COLOR;
			const profileUrl = `https://app.xernerx.com/users/${targetId}`;
			const displayName = userProfile?.globalName || targetDiscordUser.globalName || userProfile?.username || targetDiscordUser.username;

			if ((userProfile?.privacy === 'private' || creditDoc?.privacy === 'private') && !isSelf) {
				const privateEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Private Profile')
					.setDescription(`**${displayName}** has set their Xernerx profile to **private**.`)
					.setFooter({
						text: `${clientBotName} • User Profile`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			const currentStreak = creditDoc?.dailyStreak?.count || 0;
			const bestStreak = creditDoc?.dailyStreak?.bestStreak || currentStreak;
			const shields = creditDoc?.dailyStreak?.shields || 0;

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(displayName)
				.setURL(profileUrl)
				.setDescription(userProfile?.bio || `View **${displayName}**'s full profile, showcases, and ecosystem activity on **Xernerx**.`)
				.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
				.addFields([
					{
						name: 'Overview',
						value: [`• **User:** <@${targetId}>`, `• **Public Bots:** \`${ownedBotsCount.toLocaleString()}\``, `• **Organizations:** \`${orgCount.toLocaleString()}\``].join('\n'),
						inline: true,
					},
					{
						name: 'Daily Streak',
						value: [
							`• **Current:** \`${currentStreak} day${currentStreak === 1 ? '' : 's'}\``,
							`• **Best:** \`${bestStreak} day${bestStreak === 1 ? '' : 's'}\``,
							`• **Shields:** \`${shields}\``,
						].join('\n'),
						inline: true,
					},
				])
				.setFooter({
					text: `${clientBotName} • User Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('View Full Profile on Xernerx').setStyle(ButtonStyle.Link).setURL(profileUrl),
				new ButtonBuilder().setLabel('Explore Xernerx Directory').setStyle(ButtonStyle.Link).setURL('https://app.xernerx.com')
			);

			await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Error executing View Xernerx Profile context command:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Profile')
				.setDescription('An error occurred while loading this Xernerx profile. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Profile Directory`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
