/** @format */

import { database, formatMilestoneCount, getHighestMilestoneBadge } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandOptions } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { DEFAULT_XERNERX_COLOR, getUserAccentColor, parseHexColor } from '../../lib/botUtils.js';
import { ensureMilestoneEmojisLoaded, getMilestoneEmoji } from '../../lib/milestoneEmojis.js';

const VANITY_BADGE_LABELS: Record<string, string> = {
	dot_matrix_banner: 'Dot-Matrix Architect',
	credit_patron: 'Credit Patron',
	high_roller: 'High Roller',
	vault_sovereign: 'Vault Sovereign',
};

export default class UserCommand extends SlashCommandBuilder {
	constructor() {
		super('user', {
			name: 'user',
			description: 'View Xernerx user profiles, streaks, showcases, and activity.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'profile',
					description: 'View a user profile on the Xernerx ecosystem.',
					options: [
						{
							name: 'user',
							description: 'Select a Discord user to view their Xernerx profile (defaults to yourself).',
							type: 'user',
							required: false,
						},
					],
				},
				{
					name: 'streak',
					description: 'View daily credit streak, shields, vanity badges, and ecosystem perks.',
					options: [
						{
							name: 'user',
							description: 'Select a Discord user to view their streak and perks (defaults to yourself).',
							type: 'user',
							required: false,
						},
					],
				},
				{
					name: 'showcases',
					description: 'View a user’s pinned profile showcase cards on the Xernerx ecosystem.',
					options: [
						{
							name: 'user',
							description: 'Select a Discord user to view their profile showcases (defaults to yourself).',
							type: 'user',
							required: false,
						},
					],
				},
			],
		});
	}

	override async exec({ interaction, options, subcommand }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL();
		const botName = botUser?.username || 'Xernerx';

		const targetDiscordUser = (options as any)?.user?.user || interaction.options.getUser('user') || interaction.user;
		const targetId = targetDiscordUser.id;
		const isSelf = targetId === interaction.user.id;

		try {
			const db = await database('xernerx');
			const UserModel = (db.models.users as any).User;
			const AppearanceModel = (db.models.users as any).Appearance;
			const CreditModel = (db.models.users as any).Credit;
			const BotModel = (db.models.bots as any).Bot;
			const OrganizationModel = (db.models.organizations as any).Organization;
			const RoleModel = (db.models.core as any).Role;

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

			const footerLabel = subcommand === 'streak' ? 'User Streak' : subcommand === 'showcases' ? 'User Showcases' : 'User Profile';

			if (userProfile?.privacy === 'private' && !isSelf) {
				const privateEmbed = new EmbedBuilder()
					.setColor(DEFAULT_XERNERX_COLOR)
					.setTitle('Private Profile')
					.setDescription(`**${targetDiscordUser.globalName || targetDiscordUser.username}**'s profile is set to **private**.`)
					.setThumbnail(targetDiscordUser.displayAvatarURL({ size: 256 }))
					.setFooter({
						text: `${botName} • ${footerLabel}`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			const displayName = userProfile?.name || targetDiscordUser.globalName || targetDiscordUser.username || 'Xernerx User';
			const avatarUrl = userProfile?.icon && String(userProfile.icon).startsWith('http') ? userProfile.icon : targetDiscordUser.displayAvatarURL({ size: 512 });
			const profileUrl = `https://app.xernerx.com/users/${targetId}`;

			const streak = (creditDoc as any)?.streak || 0;
			const streakShields = (creditDoc as any)?.streakShields || 0;
			const balance = (creditDoc as any)?.balance || 0;
			const totalSpent = (creditDoc as any)?.totalSpent || 0;
			const extraCdnSlots = (creditDoc as any)?.extraCdnSlots || 0;
			const extraShowcaseSlots = (creditDoc as any)?.extraShowcaseSlots || 0;
			const rawActiveBadges: string[] = Array.isArray((creditDoc as any)?.activeBadges) ? (creditDoc as any).activeBadges : [];
			const rawUnlockedBadges: string[] = Array.isArray((creditDoc as any)?.unlockedBadges) ? (creditDoc as any).unlockedBadges : [];
			const activeBadges = rawActiveBadges.map((b) => VANITY_BADGE_LABELS[b] || b).filter(Boolean);
			const unlockedBadges = rawUnlockedBadges.map((b) => VANITY_BADGE_LABELS[b] || b).filter(Boolean);

			if (subcommand === 'streak') {
				const giftInDate = (creditDoc as any)?.giftIn ? new Date((creditDoc as any).giftIn) : null;
				const now = Date.now();
				const canClaimNow = !giftInDate || giftInDate.getTime() <= now;
				const nextClaimValue = canClaimNow ? 'Available now' : `<t:${Math.floor(giftInDate.getTime() / 1000)}:R>`;

				const streakEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(`${displayName} • Streak & Perks`)
					.setURL(profileUrl)
					.setThumbnail(avatarUrl)
					.setDescription(`Daily reward streak and unlocked ecosystem perks on [store.xernerx.com](https://store.xernerx.com/?category=credits).`)
					.addFields([
						{
							name: 'Daily Streak',
							value: [`• **Current:** \`${streak}d\``, `• **Shields:** \`${streakShields} / 3\``, ...(isSelf ? [`• **Daily Gift:** ${nextClaimValue}`] : [])].join('\n'),
							inline: true,
						},
						{
							name: 'Ecosystem Quotas',
							value: [
								`• **Extra CDN Slots:** \`+${extraCdnSlots}\``,
								`• **Extra Showcases:** \`+${extraShowcaseSlots}\``,
								...(isSelf ? [`• **Credits:** \`${balance.toLocaleString()}\``, `• **Lifetime Spent:** \`${totalSpent.toLocaleString()}\``] : []),
							].join('\n'),
							inline: true,
						},
					]);

				if (activeBadges.length > 0 || unlockedBadges.length > 0) {
					const badgeList = activeBadges.length > 0 ? activeBadges : unlockedBadges;
					streakEmbed.addFields([
						{
							name: `Vanity Badges (${badgeList.length})`,
							value: badgeList.map((b) => `\`${b}\``).join(' '),
							inline: false,
						},
					]);
				}

				streakEmbed
					.setFooter({
						text: `${botName} • User Streak`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [streakEmbed] });
			}

			if (subcommand === 'showcases') {
				const showcases: any[] = Array.isArray(userProfile?.showcases) ? userProfile.showcases : [];
				const maxSlots = 1 + extraShowcaseSlots;

				const showcaseEmbed = new EmbedBuilder().setColor(accentColor).setTitle(`${displayName} • Showcases (${showcases.length} / ${maxSlots})`).setURL(profileUrl).setThumbnail(avatarUrl);

				if (showcases.length === 0) {
					showcaseEmbed.setDescription(
						`**${displayName}** has not pinned any profile showcases yet.${isSelf ? ' Manage your showcases on [account.xernerx.com](https://account.xernerx.com).' : ''}`
					);
				} else {
					showcaseEmbed.setDescription(`Pinned portfolio and project cards featured on [**${displayName}**'s Xernerx profile](${profileUrl}).`);

					const fields = showcases.slice(0, 10).map((sc: any, idx: number) => {
						const tagSuffix = sc.tag ? ` • \`${sc.tag}\`` : '';
						const descText = sc.description ? String(sc.description).slice(0, 200) : 'No description provided.';
						const linkLine = sc.linkUrl ? `\n[Open Link](${sc.linkUrl})` : '';
						return {
							name: `#${idx + 1} • ${sc.title || 'Showcase'}${tagSuffix}`,
							value: `${descText}${linkLine}`,
							inline: false,
						};
					});

					showcaseEmbed.addFields(fields);

					const firstImage = showcases.find((sc: any) => sc.imageUrl && String(sc.imageUrl).startsWith('http'))?.imageUrl;
					if (firstImage) {
						showcaseEmbed.setImage(firstImage);
					}
				}

				showcaseEmbed
					.setFooter({
						text: `${botName} • User Showcases`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [showcaseEmbed] });
			}

			// Default: 'profile' subcommand
			const StatModel = (db.models.bots as any).Stat;
			const [, publicBots, publicOrgs, roles] = await Promise.all([
				ensureMilestoneEmojisLoaded(interaction.client),
				BotModel.find({ owners: targetId, privacy: 'public' })
					.select('id name verified')
					.lean()
					.catch(() => []),
				OrganizationModel.find({
					$or: [{ owner: targetId }, { members: targetId }],
					privacy: 'public',
				})
					.select('_id name verified')
					.lean()
					.catch(() => []),
				userProfile?.roles?.length && RoleModel
					? RoleModel.find({ id: { $in: userProfile.roles } })
							.select('name')
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
			]);

			const roleNames: string[] = roles.map((r: any) => r.name).filter(Boolean);

			const descriptionParts: string[] = [];
			if (userProfile?.description || userProfile?.info) {
				descriptionParts.push(userProfile.description || userProfile.info);
			} else if (!userProfile) {
				descriptionParts.push(`**${displayName}** has not set up a Xernerx profile yet.`);
			}

			const metaLine: string[] = [];
			if (userProfile?.pronouns) metaLine.push(`**Pronouns:** ${userProfile.pronouns}`);
			if (userProfile?.timezone) metaLine.push(`**Timezone:** ${userProfile.timezone}`);
			if (metaLine.length > 0) {
				descriptionParts.push(metaLine.join(' • '));
			}

			const embed = new EmbedBuilder().setColor(accentColor).setTitle(displayName).setURL(profileUrl).setThumbnail(avatarUrl);

			if (descriptionParts.length > 0) {
				embed.setDescription(descriptionParts.join('\n\n'));
			}

			const overviewLines = [`• **User:** <@${targetId}>`];
			if (userProfile?.verified) {
				overviewLines.push('• **Verified:** Yes');
			}
			if (userProfile?.privacy === 'private') {
				overviewLines.push('• **Privacy:** Private');
			}
			if (userProfile?.createdAt) {
				const createdTs = Math.floor(new Date(userProfile.createdAt).getTime() / 1000);
				overviewLines.push(`• **Joined:** <t:${createdTs}:R>`);
			}

			const rewardsLines = [
				`• **Streak:** \`${streak}d\``,
				...(isSelf ? [`• **Credits:** \`${balance.toLocaleString()}\``] : []),
				...(activeBadges.length > 0 ? [`• **Badges:** ${activeBadges.map((b) => `\`${b}\``).join(', ')}`] : []),
			];

			embed.addFields([
				{
					name: 'Overview',
					value: overviewLines.join('\n'),
					inline: true,
				},
				{
					name: 'Rewards',
					value: rewardsLines.join('\n'),
					inline: true,
				},
			]);

			if (roleNames.length > 0) {
				embed.addFields([
					{
						name: 'Roles',
						value: roleNames.map((r) => `\`${r}\``).join(' '),
						inline: false,
					},
				]);
			}

			if (publicBots.length > 0) {
				const botStatsList = await Promise.all(
					publicBots.map(async (b: any) => {
						const latest = StatModel
							? await StatModel.findOne({ id: String(b.id) })
									.sort({ timestamp: -1 })
									.lean()
									.catch(() => null)
							: null;
						return {
							bot: b,
							guildCount: Number((latest as any)?.guildCount ?? 0) || 0,
							userCount: Number((latest as any)?.userCount ?? 0) || 0,
						};
					})
				);

				const maxGuildEntry = botStatsList.reduce((best, cur) => (cur.guildCount > best.guildCount ? cur : best), botStatsList[0]);
				const maxUserEntry = botStatsList.reduce((best, cur) => (cur.userCount > best.userCount ? cur : best), botStatsList[0]);

				const serverBadge = getHighestMilestoneBadge(maxGuildEntry.guildCount, 'servers');
				const memberBadge = getHighestMilestoneBadge(maxUserEntry.userCount, 'members');
				const serverEmoji = getMilestoneEmoji(interaction.client, 'servers', serverBadge.tier);
				const memberEmoji = getMilestoneEmoji(interaction.client, 'members', memberBadge.tier);

				embed.addFields([
					{
						name: 'Bot Milestones',
						value: [
							`${serverEmoji} **${serverBadge.label}** — [${maxGuildEntry.bot.name || maxGuildEntry.bot.id}](https://app.xernerx.com/bots/${maxGuildEntry.bot.id}) (\`${formatMilestoneCount(maxGuildEntry.guildCount)}\`)`,
							`${memberEmoji} **${memberBadge.label}** — [${maxUserEntry.bot.name || maxUserEntry.bot.id}](https://app.xernerx.com/bots/${maxUserEntry.bot.id}) (\`${formatMilestoneCount(maxUserEntry.userCount)}\`)`,
						].join('\n'),
						inline: false,
					},
					{
						name: `Bots (${publicBots.length})`,
						value: publicBots
							.slice(0, 6)
							.map((b: any) => `[${b.name || b.id}](https://app.xernerx.com/bots/${b.id})`)
							.join(' • '),
						inline: true,
					},
				]);
			}

			if (publicOrgs.length > 0) {
				embed.addFields([
					{
						name: `Organizations (${publicOrgs.length})`,
						value: publicOrgs
							.slice(0, 6)
							.map((o: any) => `[${o.name}](https://app.xernerx.com/organizations/${o._id})`)
							.join(' • '),
						inline: true,
					},
				]);
			}

			const publicConnections = Array.isArray(userProfile?.connections) ? userProfile.connections.filter((c: any) => c.showOnProfile !== false) : [];

			if (publicConnections.length > 0) {
				const connLinks = publicConnections.slice(0, 6).map((conn: any) => {
					const label = conn.provider ? conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1) : 'Link';
					return conn.url ? `[${label} (${conn.username})](${conn.url})` : `${label}: \`${conn.username}\``;
				});

				embed.addFields([
					{
						name: 'Connections',
						value: connLinks.join(' • '),
						inline: false,
					},
				]);
			}

			embed
				.setFooter({
					text: `${botName} • User Profile`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [embed] });
		} catch (error) {
			console.error(`Error executing /user ${subcommand}:`, error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load User')
				.setDescription('An error occurred while fetching user information. Please try again shortly.')
				.setFooter({
					text: `${botName} • User Profile`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
