/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../../../lib/botUtils.js';

export type StatsTimeframe = '24h' | '7d' | '30d' | '1y' | 'all';

export const STATS_TIMEFRAMES: { id: StatsTimeframe; label: string; windowMs: number | null }[] = [
	{ id: '24h', label: '24h', windowMs: 24 * 60 * 60 * 1000 },
	{ id: '7d', label: '7d', windowMs: 7 * 24 * 60 * 60 * 1000 },
	{ id: '30d', label: '30d', windowMs: 30 * 24 * 60 * 60 * 1000 },
	{ id: '1y', label: '1y', windowMs: 365 * 24 * 60 * 60 * 1000 },
	{ id: 'all', label: 'All', windowMs: null },
];

interface CachedBotChoice {
	id: string;
	name: string;
	description: string;
}

let cachedBotChoices: { data: CachedBotChoice[]; timestamp: number } | null = null;
const BOT_CACHE_TTL_MS = 60_000;

async function getBotChoices(): Promise<CachedBotChoice[]> {
	const now = Date.now();
	if (cachedBotChoices && now - cachedBotChoices.timestamp < BOT_CACHE_TTL_MS) {
		return cachedBotChoices.data;
	}

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const bots = await BotModel.find({ bot: { $ne: false }, privacy: 'public' })
			.select('id name description')
			.lean();

		const list: CachedBotChoice[] = bots.map((b: any) => ({
			id: String(b.id),
			name: String(b.name || b.id),
			description: String(b.description || ''),
		}));

		cachedBotChoices = { data: list, timestamp: now };
		return list;
	} catch {
		return cachedBotChoices?.data || [];
	}
}

function formatStatusLabel(status?: string): string {
	switch (status) {
		case 'online':
			return 'Online';
		case 'idle':
			return 'Idle';
		case 'dnd':
			return 'Do Not Disturb';
		default:
			return 'Offline';
	}
}

function formatDelta(current: number, previous: number | undefined, tfLabel: string): string {
	if (previous === undefined || previous === null) return '';
	const diff = current - previous;
	if (diff === 0) return ` \`(±0 ${tfLabel})\``;
	return diff > 0 ? ` \`(+${diff.toLocaleString()} ${tfLabel})\`` : ` \`(${diff.toLocaleString()} ${tfLabel})\``;
}

export async function buildBotStatsMessage(client: Client, bot: any, timeframe: StatsTimeframe, requesterUserId?: string) {
	const clientBotUser = client.user;
	const clientBotAvatar = clientBotUser?.displayAvatarURL();
	const clientBotName = clientBotUser?.username || 'Xernerx';

	const botId = String(bot.id);
	const tfMeta = STATS_TIMEFRAMES.find((t) => t.id === timeframe) || STATS_TIMEFRAMES[0];

	const [db, accentColor, discordUser] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId), client.users.fetch(botId).catch(() => null)]);

	const StatModel = (db.models.bots as any).Stat;
	const VoteModel = (db.models.bots as any).Vote;
	const ReviewModel = (db.models.bots as any).Review;
	const CommandModel = (db.models.bots as any).Command;

	const statQuery: Record<string, any> = { id: botId };
	if (tfMeta.windowMs !== null) {
		statQuery.timestamp = { $gte: new Date(Date.now() - tfMeta.windowMs) };
	}

	const [latestOverallStat, windowStats, voteCount, reviews, commandCount] = await Promise.all([
		StatModel
			? StatModel.findOne({ id: botId })
					.sort({ timestamp: -1 })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		StatModel
			? StatModel.find(statQuery)
					.sort({ timestamp: 1 })
					.select('guildCount userCount shardCount timestamp')
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		VoteModel ? VoteModel.countDocuments({ botId }).catch(() => bot.voteCount || 0) : Promise.resolve(bot.voteCount || 0),
		ReviewModel
			? ReviewModel.find({ botId })
					.select('rating')
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		CommandModel ? CommandModel.countDocuments({ botId }).catch(() => (bot.commands || []).length) : Promise.resolve((bot.commands || []).length),
	]);

	const botDisplayName = discordUser?.globalName || discordUser?.username || bot.name || botId;
	const botAvatarUrl =
		discordUser?.displayAvatarURL({ size: 512 }) ||
		(bot.avatar && String(bot.avatar).startsWith('http')
			? bot.avatar
			: bot.avatar
				? `https://cdn.discordapp.com/avatars/${botId}/${bot.avatar}.${String(bot.avatar).startsWith('a_') ? 'gif' : 'png'}?size=512`
				: undefined);

	const botUrl = `https://app.xernerx.com/bots/${botId}`;

	const latestStat: any = windowStats.length > 0 ? windowStats[windowStats.length - 1] : latestOverallStat;
	const oldestStat: any = windowStats.length > 1 ? windowStats[0] : null;

	const currentGuilds = latestStat?.guildCount ?? (botId === clientBotUser?.id ? client.guilds.cache.size : 0);
	const currentUsers = latestStat?.userCount ?? (botId === clientBotUser?.id ? client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0) : 0);
	const currentShards = latestStat?.shardCount || 1;

	const peakGuilds = windowStats.length > 0 ? Math.max(...windowStats.map((s: any) => s.guildCount || 0), currentGuilds) : currentGuilds;
	const peakUsers = windowStats.length > 0 ? Math.max(...windowStats.map((s: any) => s.userCount || 0), currentUsers) : currentUsers;

	const avgRating = reviews.length > 0 ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) : null;

	const lastSyncTs = (latestOverallStat as any)?.timestamp
		? Math.floor(new Date((latestOverallStat as any).timestamp).getTime() / 1000)
		: bot.statusUpdatedAt
			? Math.floor(new Date(bot.statusUpdatedAt).getTime() / 1000)
			: null;

	const statsEmbed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle(`${botDisplayName} • Statistics (${tfMeta.label})`)
		.setURL(botUrl)
		.setDescription([`**Status:** ${formatStatusLabel(bot.status)}${bot.activity ? ` — *${bot.activity}*` : ''}`, ...(lastSyncTs ? [`**Last Synced:** <t:${lastSyncTs}:R>`] : [])].join('\n'))
		.addFields([
			{
				name: 'Servers',
				value: `**${currentGuilds.toLocaleString()}**${formatDelta(currentGuilds, oldestStat?.guildCount, tfMeta.label)}`,
				inline: true,
			},
			{
				name: 'Users',
				value: `**${currentUsers.toLocaleString()}**${formatDelta(currentUsers, oldestStat?.userCount, tfMeta.label)}`,
				inline: true,
			},
			{
				name: 'Shards',
				value: `**${currentShards.toLocaleString()}**`,
				inline: true,
			},
			{
				name: 'Votes',
				value: `**${Number(voteCount).toLocaleString()}**`,
				inline: true,
			},
			{
				name: 'Rating',
				value: avgRating ? `**${avgRating} / 5.0** (${reviews.length})` : 'Unrated',
				inline: true,
			},
			{
				name: 'Commands',
				value: `**${Number(commandCount).toLocaleString()}**`,
				inline: true,
			},
			{
				name: `${tfMeta.label} Peak`,
				value: `• **Servers:** \`${peakGuilds.toLocaleString()}\` • **Users:** \`${peakUsers.toLocaleString()}\` • **Snapshots:** \`${windowStats.length}\``,
				inline: false,
			},
		])
		.setFooter({
			text: `${clientBotName} • Bot Stats`,
			iconURL: clientBotAvatar,
		})
		.setTimestamp();

	if (botAvatarUrl) {
		statsEmbed.setThumbnail(botAvatarUrl);
	}

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		STATS_TIMEFRAMES.map((tf) =>
			new ButtonBuilder()
				.setCustomId(`bot_stats:${botId}:${tf.id}`)
				.setLabel(tf.label)
				.setStyle(tf.id === timeframe ? ButtonStyle.Primary : ButtonStyle.Secondary)
		)
	);

	return {
		embeds: [statsEmbed],
		components: [row],
	};
}

const BOT_SUBCOMMAND_OPTIONS = [
	{
		name: 'bot',
		description: 'Search and select a bot from the Xernerx directory (defaults to Xernerx).',
		type: 'string' as const,
		required: false,
		autocomplete: true,
	},
	{
		name: 'user',
		description: 'Or select a Discord bot user directly.',
		type: 'user' as const,
		required: false,
	},
];

export default class BotCommand extends SlashCommandBuilder {
	constructor() {
		super('bot', {
			name: 'bot',
			description: 'View Xernerx bot profiles, live telemetry, commands, and reviews.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'profile',
					description: 'View a bot profile, links, and overview on the Xernerx directory.',
					options: BOT_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'stats',
					description: 'View live telemetry, server growth, user reach, and shard metrics for a Xernerx bot.',
					options: BOT_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'commands',
					description: 'List synced slash commands and descriptions for a Xernerx bot.',
					options: BOT_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'reviews',
					description: 'View community ratings and latest reviews for a Xernerx bot.',
					options: BOT_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'vote',
					description: 'Check your 12-hour vote cooldown and vote for a Xernerx bot.',
					options: BOT_SUBCOMMAND_OPTIONS,
				},
			],
		});
	}

	override async autocomplete({ interaction, focused }: SlashCommandAutocomplete) {
		try {
			const query = ((focused?.value as string) || '').trim().toLowerCase();
			const visibleBots = await getBotChoices();

			const filtered = !query
				? visibleBots
				: visibleBots.filter((b) => b.name.toLowerCase().includes(query) || b.id.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));

			await interaction.respond(
				filtered.slice(0, 25).map((b) => {
					const descSnippet = b.description ? ` — ${b.description}` : '';
					const rawLabel = `${b.name}${descSnippet}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: b.id.slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /bot autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options, subcommand }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const mentionedUser = (options as any)?.user?.user || interaction.options.getUser('user');
		const rawBotInput = (options as any)?.bot?.value || interaction.options.getString('bot') || '';
		const targetBotId = mentionedUser?.id || (rawBotInput ? String(rawBotInput).trim() : clientBotUser?.id || '1319029435655000234');

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const BotModel = (db.models.bots as any).Bot;
			const StatModel = (db.models.bots as any).Stat;
			const VoteModel = (db.models.bots as any).Vote;
			const CommandModel = (db.models.bots as any).Command;
			const ReviewModel = (db.models.bots as any).Review;
			const OrganizationModel = (db.models.organizations as any).Organization;

			let bot = await BotModel.findOne({ id: targetBotId }).lean();
			if (!bot && rawBotInput && !/^\d+$/.test(targetBotId)) {
				bot = await BotModel.findOne({ name: { $regex: new RegExp(`^${targetBotId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
			}

			if (!bot) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Bot Not Found')
					.setDescription(
						`We couldn't find a registered Xernerx bot matching **\`${targetBotId}\`**.\n\nUse the \`bot\` autocomplete option to search bots on the [Xernerx Directory](https://app.xernerx.com).`
					)
					.setFooter({
						text: `${clientBotName} • Bot Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const isBotOwner = Array.isArray(bot.owners) && bot.owners.map(String).includes(interaction.user.id);
			if (bot.privacy === 'private' && !isBotOwner) {
				const privateEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Private Bot')
					.setDescription(`**${bot.name || bot.id}** is set to **private**.`)
					.setFooter({
						text: `${clientBotName} • Bot Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			if (subcommand === 'stats') {
				const payload = await buildBotStatsMessage(interaction.client, bot, '24h', interaction.user.id);
				return await (interaction as any)[replyMethod](payload);
			}

			const botId = String(bot.id);
			const discordUser = await interaction.client.users.fetch(botId).catch(() => null);
			const botDisplayName = discordUser?.globalName || discordUser?.username || bot.name || botId;
			const botAvatarUrl =
				discordUser?.displayAvatarURL({ size: 512 }) ||
				(bot.avatar && String(bot.avatar).startsWith('http')
					? bot.avatar
					: bot.avatar
						? `https://cdn.discordapp.com/avatars/${botId}/${bot.avatar}.${String(bot.avatar).startsWith('a_') ? 'gif' : 'png'}?size=512`
						: undefined);

			const botUrl = `https://app.xernerx.com/bots/${botId}`;

			if (subcommand === 'commands') {
				const syncedCommands = CommandModel
					? await CommandModel.find({ botId })
							.sort({ type: 1, name: 1 })
							.lean()
							.catch(() => [])
					: [];

				const rawList = syncedCommands.length > 0 ? syncedCommands : Array.isArray(bot.commands) ? bot.commands : [];

				const slashLines: string[] = [];
				const contextLines: string[] = [];

				for (const cmd of rawList) {
					const cmdType = cmd.type ?? cmd.body?.type ?? 1;
					const cmdName = cmd.name || cmd.body?.name;
					const cmdDesc = cmd.description || cmd.body?.description || '';

					if (cmdType === 2 || cmdType === 3) {
						const targetLabel = cmdType === 2 ? 'User Context' : 'Message Context';
						contextLines.push(`• **\`${cmdName}\`** (${targetLabel}) — ${cmdDesc || `Right-click ${cmdType === 2 ? 'User' : 'Message'} -> Apps -> ${cmdName}`}`);
						continue;
					}

					const rawOptions = Array.isArray(cmd.body?.options) ? cmd.body.options : Array.isArray(cmd.options) ? cmd.options : [];
					const subcommands = rawOptions.filter((opt: any) => opt?.type === 1 || String(opt?.type).toUpperCase() === 'SUB_COMMAND');
					if (subcommands.length > 0) {
						for (const sub of subcommands) {
							slashLines.push(`• **\`/${cmdName} ${sub.name}\`** — ${sub.description || cmdDesc || 'No description provided.'}`);
						}
					} else {
						slashLines.push(`• **\`/${cmdName}\`** — ${cmdDesc || 'No description provided.'}`);
					}
				}

				const totalCount = slashLines.length + contextLines.length;

				const commandsEmbed = new EmbedBuilder().setColor(accentColor).setTitle(`${botDisplayName} • Commands (${totalCount})`).setURL(botUrl);

				if (totalCount === 0) {
					commandsEmbed.setDescription(`No commands are currently synced for **${botDisplayName}**.`);
				} else {
					if (slashLines.length > 0) {
						commandsEmbed.setDescription(`**Slash Commands (${slashLines.length})**\n${slashLines.slice(0, 22).join('\n')}`);
					}
					if (contextLines.length > 0) {
						commandsEmbed.addFields([
							{
								name: `Context Menu Commands (${contextLines.length})`,
								value: contextLines.slice(0, 15).join('\n'),
								inline: false,
							},
						]);
					}
				}

				commandsEmbed
					.setFooter({
						text: `${clientBotName} • Bot Commands`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				if (botAvatarUrl) {
					commandsEmbed.setThumbnail(botAvatarUrl);
				}

				return await (interaction as any)[replyMethod]({ embeds: [commandsEmbed] });
			}

			if (subcommand === 'reviews') {
				const reviews = ReviewModel
					? await ReviewModel.find({ botId })
							.sort({ createdAt: -1 })
							.lean()
							.catch(() => [])
					: [];

				const avgRating = reviews.length > 0 ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) : null;

				const reviewsEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(`${botDisplayName} • Reviews (${reviews.length})`)
					.setURL(botUrl)
					.setDescription(
						avgRating
							? `**Average Rating:** \`${avgRating} / 5.0\` across **${reviews.length}** review${reviews.length === 1 ? '' : 's'}.`
							: `**${botDisplayName}** has no community reviews yet. Share a review on [app.xernerx.com](${botUrl}).`
					);

				if (reviews.length > 0) {
					const reviewFields = reviews.slice(0, 5).map((r: any, idx: number) => {
						const createdTs = r.createdAt ? Math.floor(new Date(r.createdAt).getTime() / 1000) : null;
						const rawContent = String(r.content || 'No written comment.').trim();
						const snippet = rawContent.length > 220 ? `${rawContent.slice(0, 217)}...` : rawContent;
						const devReply = r.devResponse ? `\n> **Developer Response:** ${String(r.devResponse).slice(0, 150)}` : '';
						return {
							name: `#${idx + 1} • ${r.rating} / 5`,
							value: `By <@${r.userId}>${createdTs ? ` • <t:${createdTs}:R>` : ''}\n${snippet}${devReply}`,
							inline: false,
						};
					});
					reviewsEmbed.addFields(reviewFields);
				}

				if (botAvatarUrl) {
					reviewsEmbed.setThumbnail(botAvatarUrl);
				}

				reviewsEmbed
					.setFooter({
						text: `${clientBotName} • Bot Reviews`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [reviewsEmbed] });
			}

			if (subcommand === 'vote') {
				const COOLDOWN_MS = 12 * 60 * 60 * 1000;
				const [lastVote, totalVotes] = await Promise.all([
					VoteModel
						? VoteModel.findOne({ botId, userId: interaction.user.id })
								.sort({ createdAt: -1 })
								.lean()
								.catch(() => null)
						: Promise.resolve(null),
					VoteModel ? VoteModel.countDocuments({ botId }).catch(() => bot.voteCount || 0) : Promise.resolve(bot.voteCount || 0),
				]);

				const lastVoteDate = (lastVote as any)?.createdAt ? new Date((lastVote as any).createdAt) : null;
				const nextVoteDate = lastVoteDate ? new Date(lastVoteDate.getTime() + COOLDOWN_MS) : null;
				const canVote = !nextVoteDate || Date.now() >= nextVoteDate.getTime();

				const statusValue = canVote ? 'Available now' : `Available <t:${Math.floor(nextVoteDate!.getTime() / 1000)}:R>`;
				const lastVotedValue = lastVoteDate ? `<t:${Math.floor(lastVoteDate.getTime() / 1000)}:R>` : 'Never';

				const voteEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(`${botDisplayName} • Vote`)
					.setURL(botUrl)
					.setDescription(
						canVote
							? `You can vote for **${botDisplayName}** right now on [app.xernerx.com](${botUrl}) to support the bot and earn **+100 base credits** (up to **200** with an active subscription multiplier).`
							: `You have already voted for **${botDisplayName}** within the last 12 hours.`
					)
					.addFields([
						{
							name: 'Vote Status',
							value: [`• **Cooldown:** ${statusValue}`, `• **Last Voted:** ${lastVotedValue}`].join('\n'),
							inline: true,
						},
						{
							name: 'Bot Totals',
							value: [`• **Total Votes:** \`${Number(totalVotes).toLocaleString()}\``, `• **Reward:** \`+100 Credits\``].join('\n'),
							inline: true,
						},
					])
					.setFooter({
						text: `${clientBotName} • Bot Vote`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				if (botAvatarUrl) {
					voteEmbed.setThumbnail(botAvatarUrl);
				}

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel(`Vote for ${botDisplayName}`).setStyle(ButtonStyle.Link).setURL(botUrl));

				return await (interaction as any)[replyMethod]({
					embeds: [voteEmbed],
					components: [row],
				});
			}

			// Default: 'profile' subcommand
			const [latestStat, voteCount, commandCount, orgDoc] = await Promise.all([
				StatModel
					? StatModel.findOne({ id: botId })
							.sort({ timestamp: -1 })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				VoteModel ? VoteModel.countDocuments({ botId }).catch(() => bot.voteCount || 0) : Promise.resolve(bot.voteCount || 0),
				CommandModel ? CommandModel.countDocuments({ botId }).catch(() => (bot.commands || []).length) : Promise.resolve((bot.commands || []).length),
				bot.organization && OrganizationModel
					? OrganizationModel.findById(bot.organization)
							.select('name verified')
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
			]);

			const guildCount = (latestStat as any)?.guildCount ?? (botId === clientBotUser?.id ? interaction.client.guilds.cache.size : 0);
			const userCount = (latestStat as any)?.userCount ?? (botId === clientBotUser?.id ? interaction.client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0) : 0);

			const ownerMentions = Array.isArray(bot.owners) && bot.owners.length > 0 ? bot.owners.map((id: string) => `<@${id}>`).join(', ') : 'Xernerx Studios';

			const profileEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(botDisplayName)
				.setURL(botUrl)
				.setDescription(bot.description || bot.info || `Explore **${botDisplayName}** on the Xernerx Bot Directory.`)
				.addFields([
					{
						name: 'Presence',
						value: [`• **Status:** ${formatStatusLabel(bot.status)}`, ...(bot.activity ? [`• **Activity:** ${bot.activity}`] : []), ...(bot.verified ? ['• **Verified:** Yes'] : [])].join(
							'\n'
						),
						inline: true,
					},
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
						name: 'Ownership',
						value: [
							...(orgDoc ? [`• **Organization:** [${(orgDoc as any).name}](https://app.xernerx.com/organizations/${bot.organization})`] : []),
							`• **Developers:** ${ownerMentions}`,
						].join('\n'),
						inline: false,
					},
				]);

			if (Array.isArray(bot.tags) && bot.tags.length > 0) {
				profileEmbed.addFields([
					{
						name: 'Tags',
						value: bot.tags.map((t: string) => `\`${t}\``).join(' '),
						inline: false,
					},
				]);
			}

			const links: string[] = [];
			const botLinks = bot.links || {};
			if (botLinks.invite || bot.invite) {
				links.push(`[Invite](${botLinks.invite || bot.invite})`);
			} else if (bot.privacy === 'public') {
				links.push(`[Invite](https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot%20applications.commands)`);
			}
			if (botLinks.support || bot.support) links.push(`[Support](${botLinks.support || bot.support})`);
			if (botLinks.website || bot.website) links.push(`[Website](${botLinks.website || bot.website})`);
			if (botLinks.github) links.push(`[GitHub](${botLinks.github})`);
			if (botLinks.dashboard) links.push(`[Dashboard](${botLinks.dashboard})`);

			if (links.length > 0) {
				profileEmbed.addFields([
					{
						name: 'Links',
						value: links.join(' • '),
						inline: false,
					},
				]);
			}

			if (botAvatarUrl) {
				profileEmbed.setThumbnail(botAvatarUrl);
			}

			profileEmbed
				.setFooter({
					text: `${clientBotName} • Bot Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [profileEmbed] });
		} catch (error) {
			console.error(`Error executing /bot ${subcommand}:`, error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Bot')
				.setDescription('An error occurred while fetching bot information. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Bot Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
