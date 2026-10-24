/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../../../lib/botUtils.js';
import { STATS_TIMEFRAMES, type StatsTimeframe } from './bot.js';

interface CachedServerChoice {
	id: string;
	name: string;
	description: string;
}

let cachedServerChoices: { data: CachedServerChoice[]; timestamp: number } | null = null;
const SERVER_CACHE_TTL_MS = 60_000;

async function getServerChoices(): Promise<CachedServerChoice[]> {
	const now = Date.now();
	if (cachedServerChoices && now - cachedServerChoices.timestamp < SERVER_CACHE_TTL_MS) {
		return cachedServerChoices.data;
	}

	try {
		const db = await database('xernerx');
		const GuildModel = (db.models.guilds as any).Guild;
		const guilds = await GuildModel.find({ privacy: 'public' }).select('id name description').lean();

		const list: CachedServerChoice[] = guilds.map((g: any) => ({
			id: String(g.id),
			name: String(g.name || g.id),
			description: String(g.description || ''),
		}));

		cachedServerChoices = { data: list, timestamp: now };
		return list;
	} catch {
		return cachedServerChoices?.data || [];
	}
}

function formatDelta(current: number, previous: number | undefined, tfLabel: string): string {
	if (previous === undefined || previous === null) return '';
	const diff = current - previous;
	if (diff === 0) return ` \`(±0 ${tfLabel})\``;
	return diff > 0 ? ` \`(+${diff.toLocaleString()} ${tfLabel})\`` : ` \`(${diff.toLocaleString()} ${tfLabel})\``;
}

export async function buildServerStatsMessage(client: Client, guildDoc: any, timeframe: StatsTimeframe, requesterUserId?: string) {
	const clientBotUser = client.user;
	const clientBotAvatar = clientBotUser?.displayAvatarURL();
	const clientBotName = clientBotUser?.username || 'Xernerx';

	const guildId = String(guildDoc.id);
	const tfMeta = STATS_TIMEFRAMES.find((t) => t.id === timeframe) || STATS_TIMEFRAMES[0];

	const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId)]);
	const StatModel = (db.models.guilds as any).Stat;
	const VoteModel = (db.models.guilds as any).Vote;

	const statQuery: Record<string, any> = { id: guildId };
	if (tfMeta.windowMs !== null) {
		statQuery.timestamp = { $gte: new Date(Date.now() - tfMeta.windowMs) };
	}

	const [latestOverallStat, windowStats, voteCount] = await Promise.all([
		StatModel
			? StatModel.findOne({ id: guildId })
					.sort({ timestamp: -1 })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		StatModel
			? StatModel.find(statQuery)
					.sort({ timestamp: 1 })
					.select('members bots messages boosts voteCount timestamp')
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		VoteModel ? VoteModel.countDocuments({ guildId }).catch(() => guildDoc.voteCount || 0) : Promise.resolve(guildDoc.voteCount || 0),
	]);

	const cachedDiscordGuild = client.guilds.cache.get(guildId);
	const serverName = cachedDiscordGuild?.name || guildDoc.name || guildId;
	const iconUrl = cachedDiscordGuild?.iconURL({ size: 512 }) || (guildDoc.icon && String(guildDoc.icon).startsWith('http') ? guildDoc.icon : undefined);

	const serverUrl = `https://app.xernerx.com/servers/${guildId}`;

	const latestStat: any = windowStats.length > 0 ? windowStats[windowStats.length - 1] : latestOverallStat;
	const oldestStat: any = windowStats.length > 1 ? windowStats[0] : null;

	const currentMembers = latestStat?.members ?? cachedDiscordGuild?.memberCount ?? guildDoc.memberCount ?? 0;
	const currentBots = latestStat?.bots ?? (cachedDiscordGuild ? cachedDiscordGuild.members.cache.filter((m) => m.user.bot).size : 0);
	const currentMessages = latestStat?.messages ?? guildDoc.messages ?? 0;
	const currentBoosts = latestStat?.boosts ?? cachedDiscordGuild?.premiumSubscriptionCount ?? 0;

	const peakMembers = windowStats.length > 0 ? Math.max(...windowStats.map((s: any) => s.members || 0), currentMembers) : currentMembers;
	const peakBots = windowStats.length > 0 ? Math.max(...windowStats.map((s: any) => s.bots || 0), currentBots) : currentBots;

	const lastSyncTs = (latestOverallStat as any)?.timestamp
		? Math.floor(new Date((latestOverallStat as any).timestamp).getTime() / 1000)
		: guildDoc.updatedAt
			? Math.floor(new Date(guildDoc.updatedAt).getTime() / 1000)
			: null;

	const statsEmbed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle(`${serverName} • Statistics (${tfMeta.label})`)
		.setURL(serverUrl)
		.setDescription(lastSyncTs ? `**Last Synced:** <t:${lastSyncTs}:R>` : `Live telemetry for **${serverName}** on the Xernerx Directory.`)
		.addFields([
			{
				name: 'Members',
				value: `**${currentMembers.toLocaleString()}**${formatDelta(currentMembers, oldestStat?.members, tfMeta.label)}`,
				inline: true,
			},
			{
				name: 'Bots',
				value: `**${currentBots.toLocaleString()}**${formatDelta(currentBots, oldestStat?.bots, tfMeta.label)}`,
				inline: true,
			},
			{
				name: 'Boosts',
				value: `**${currentBoosts.toLocaleString()}**`,
				inline: true,
			},
			{
				name: 'Messages',
				value: `**${currentMessages.toLocaleString()}**${formatDelta(currentMessages, oldestStat?.messages, tfMeta.label)}`,
				inline: true,
			},
			{
				name: 'Votes',
				value: `**${Number(voteCount).toLocaleString()}**`,
				inline: true,
			},
			{
				name: 'Snapshots',
				value: `**${windowStats.length.toLocaleString()}**`,
				inline: true,
			},
			{
				name: `${tfMeta.label} Peak`,
				value: `• **Members:** \`${peakMembers.toLocaleString()}\` • **Bots:** \`${peakBots.toLocaleString()}\` • **Messages:** \`${currentMessages.toLocaleString()}\``,
				inline: false,
			},
		])
		.setFooter({
			text: `${clientBotName} • Server Stats`,
			iconURL: clientBotAvatar,
		})
		.setTimestamp();

	if (iconUrl) {
		statsEmbed.setThumbnail(iconUrl);
	}

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		STATS_TIMEFRAMES.map((tf) =>
			new ButtonBuilder()
				.setCustomId(`server_stats:${guildId}:${tf.id}`)
				.setLabel(tf.label)
				.setStyle(tf.id === timeframe ? ButtonStyle.Primary : ButtonStyle.Secondary)
		)
	);

	return {
		embeds: [statsEmbed],
		components: [row],
	};
}

const SERVER_SUBCOMMAND_OPTIONS = [
	{
		name: 'server',
		description: 'Search and select a public server from the Xernerx directory (defaults to current server).',
		type: 'string' as const,
		required: false,
		autocomplete: true,
	},
];

export default class ServerCommand extends SlashCommandBuilder {
	constructor() {
		super('server', {
			name: 'server',
			description: 'View Xernerx server profiles, community metrics, and live statistics.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'profile',
					description: 'View a server profile, links, and overview on the Xernerx directory.',
					options: SERVER_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'stats',
					description: 'View member growth, message activity, and boost statistics for a Xernerx server.',
					options: SERVER_SUBCOMMAND_OPTIONS,
				},
				{
					name: 'vote',
					description: 'Check your 12-hour vote cooldown and vote for a Xernerx server.',
					options: SERVER_SUBCOMMAND_OPTIONS,
				},
			],
		});
	}

	override async autocomplete({ interaction, focused }: SlashCommandAutocomplete) {
		try {
			const query = ((focused?.value as string) || '').trim().toLowerCase();
			const visibleServers = await getServerChoices();

			const filtered = !query
				? visibleServers
				: visibleServers.filter((g) => g.name.toLowerCase().includes(query) || g.id.toLowerCase().includes(query) || g.description.toLowerCase().includes(query));

			await interaction.respond(
				filtered.slice(0, 25).map((g) => {
					const descSnippet = g.description ? ` — ${g.description}` : '';
					const rawLabel = `${g.name}${descSnippet}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: g.id.slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /server autocomplete:', error);
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

		const rawServerInput = (options as any)?.server?.value || interaction.options.getString('server') || '';
		const targetGuildId = rawServerInput ? String(rawServerInput).trim() : interaction.guildId || '';

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const GuildModel = (db.models.guilds as any).Guild;
			const StatModel = (db.models.guilds as any).Stat;
			const VoteModel = (db.models.guilds as any).Vote;
			const OrganizationModel = (db.models.organizations as any).Organization;

			if (!targetGuildId) {
				const missingEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Server Required')
					.setDescription('Please select a server using the `server` option when running this command outside a Discord server.')
					.setFooter({
						text: `${clientBotName} • Server Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [missingEmbed] });
			}

			let guildDoc = await GuildModel.findOne({ id: targetGuildId }).lean();
			if (!guildDoc && rawServerInput && !/^\d+$/.test(targetGuildId)) {
				guildDoc = await GuildModel.findOne({ name: { $regex: new RegExp(`^${targetGuildId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
			}

			if (!guildDoc) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Server Not Found')
					.setDescription(`We couldn't find a registered Xernerx server matching **\`${targetGuildId}\`**.`)
					.setFooter({
						text: `${clientBotName} • Server Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const isServerOwner = String(guildDoc.owner || '') === interaction.user.id;
			if (guildDoc.privacy === 'private' && !isServerOwner) {
				const privateEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Private Server')
					.setDescription(`**${guildDoc.name || guildDoc.id}** is set to **private**.`)
					.setFooter({
						text: `${clientBotName} • Server Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			if (subcommand === 'stats') {
				const payload = await buildServerStatsMessage(interaction.client, guildDoc, '24h', interaction.user.id);
				return await (interaction as any)[replyMethod](payload);
			}

			const guildId = String(guildDoc.id);
			const cachedDiscordGuild = interaction.client.guilds.cache.get(guildId);
			const serverName = cachedDiscordGuild?.name || guildDoc.name || guildId;
			const iconUrl = cachedDiscordGuild?.iconURL({ size: 512 }) || (guildDoc.icon && String(guildDoc.icon).startsWith('http') ? guildDoc.icon : undefined);

			const serverUrl = `https://app.xernerx.com/servers/${guildId}`;

			if (subcommand === 'vote') {
				const COOLDOWN_MS = 12 * 60 * 60 * 1000;
				const [lastVote, totalVotes] = await Promise.all([
					VoteModel
						? VoteModel.findOne({ guildId, userId: interaction.user.id })
								.sort({ createdAt: -1 })
								.lean()
								.catch(() => null)
						: Promise.resolve(null),
					VoteModel ? VoteModel.countDocuments({ guildId }).catch(() => guildDoc.voteCount || 0) : Promise.resolve(guildDoc.voteCount || 0),
				]);

				const lastVoteDate = (lastVote as any)?.createdAt ? new Date((lastVote as any).createdAt) : null;
				const nextVoteDate = lastVoteDate ? new Date(lastVoteDate.getTime() + COOLDOWN_MS) : null;
				const canVote = !nextVoteDate || Date.now() >= nextVoteDate.getTime();

				const statusValue = canVote ? 'Available now' : `Available <t:${Math.floor(nextVoteDate!.getTime() / 1000)}:R>`;
				const lastVotedValue = lastVoteDate ? `<t:${Math.floor(lastVoteDate.getTime() / 1000)}:R>` : 'Never';

				const voteEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(`${serverName} • Vote`)
					.setURL(serverUrl)
					.setDescription(
						canVote
							? `You can vote for **${serverName}** right now on [app.xernerx.com](${serverUrl}) to support the community and earn **+100 base credits** (up to **200** with an active subscription multiplier).`
							: `You have already voted for **${serverName}** within the last 12 hours.`
					)
					.addFields([
						{
							name: 'Vote Status',
							value: [`• **Cooldown:** ${statusValue}`, `• **Last Voted:** ${lastVotedValue}`].join('\n'),
							inline: true,
						},
						{
							name: 'Server Totals',
							value: [`• **Total Votes:** \`${Number(totalVotes).toLocaleString()}\``, `• **Reward:** \`+100 Credits\``].join('\n'),
							inline: true,
						},
					])
					.setFooter({
						text: `${clientBotName} • Server Vote`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				if (iconUrl) {
					voteEmbed.setThumbnail(iconUrl);
				}

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel(`Vote for ${serverName}`).setStyle(ButtonStyle.Link).setURL(serverUrl));

				return await (interaction as any)[replyMethod]({
					embeds: [voteEmbed],
					components: [row],
				});
			}

			// Default: 'profile' subcommand

			const [latestStat, voteCount, orgDoc] = await Promise.all([
				StatModel
					? StatModel.findOne({ id: guildId })
							.sort({ timestamp: -1 })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				VoteModel ? VoteModel.countDocuments({ guildId }).catch(() => guildDoc.voteCount || 0) : Promise.resolve(guildDoc.voteCount || 0),
				guildDoc.organization && OrganizationModel
					? OrganizationModel.findById(guildDoc.organization)
							.select('name verified')
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
			]);

			const memberCount = (latestStat as any)?.members ?? cachedDiscordGuild?.memberCount ?? guildDoc.memberCount ?? 0;
			const botCount = (latestStat as any)?.bots ?? (cachedDiscordGuild ? cachedDiscordGuild.members.cache.filter((m) => m.user.bot).size : 0);
			const messageCount = (latestStat as any)?.messages ?? guildDoc.messages ?? 0;

			const overviewLines: string[] = [];
			if (guildDoc.owner) overviewLines.push(`• **Owner:** <@${guildDoc.owner}>`);
			if (orgDoc) overviewLines.push(`• **Organization:** [${(orgDoc as any).name}](https://app.xernerx.com/organizations/${guildDoc.organization})`);
			if (guildDoc.verified) overviewLines.push('• **Verified:** Yes');
			if (guildDoc.locale) overviewLines.push(`• **Locale:** \`${guildDoc.locale}\``);
			if (overviewLines.length === 0) overviewLines.push(`• **ID:** \`${guildId}\``);

			const profileEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(serverName)
				.setURL(serverUrl)
				.setDescription(guildDoc.description || guildDoc.info || `Explore **${serverName}** on the Xernerx Server Directory.`)
				.addFields([
					{
						name: 'Overview',
						value: overviewLines.join('\n'),
						inline: true,
					},
					{
						name: 'Metrics',
						value: [
							`• **Members:** \`${memberCount.toLocaleString()}\``,
							`• **Bots:** \`${botCount.toLocaleString()}\``,
							`• **Messages:** \`${messageCount.toLocaleString()}\``,
							`• **Votes:** \`${Number(voteCount).toLocaleString()}\``,
						].join('\n'),
						inline: true,
					},
				]);

			const links: string[] = [`[Directory](${serverUrl})`];
			if (guildDoc.links?.invite) links.push(`[Invite](${guildDoc.links.invite})`);
			if (guildDoc.links?.website) links.push(`[Website](${guildDoc.links.website})`);

			profileEmbed.addFields([
				{
					name: 'Links',
					value: links.join(' • '),
					inline: false,
				},
			]);

			if (iconUrl) {
				profileEmbed.setThumbnail(iconUrl);
			}

			profileEmbed
				.setFooter({
					text: `${clientBotName} • Server Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [profileEmbed] });
		} catch (error) {
			console.error(`Error executing /server ${subcommand}:`, error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Server')
				.setDescription('An error occurred while fetching server information. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Server Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
