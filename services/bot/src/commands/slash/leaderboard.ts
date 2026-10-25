/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export type LeaderboardCategory = 'bots' | 'servers' | 'streaks';

export const LEADERBOARD_CATEGORIES: { id: LeaderboardCategory; label: string; title: string }[] = [
	{ id: 'bots', label: 'Top Bots', title: 'Top Bots Leaderboard' },
	{ id: 'servers', label: 'Top Servers', title: 'Top Servers Leaderboard' },
	{ id: 'streaks', label: 'Top Streaks', title: 'Top User Streaks Leaderboard' },
];

export async function buildLeaderboardMessage(client: Client, category: LeaderboardCategory, requesterUserId?: string) {
	const clientBotUser = client.user;
	const clientBotAvatar = clientBotUser?.displayAvatarURL();
	const clientBotName = clientBotUser?.username || 'Xernerx';

	const catMeta = LEADERBOARD_CATEGORIES.find((c) => c.id === category) || LEADERBOARD_CATEGORIES[0];
	const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId)]);

	const embed = new EmbedBuilder().setColor(accentColor).setTitle(catMeta.title).setURL('https://app.xernerx.com/leaderboard');

	if (category === 'bots') {
		const BotModel = (db.models.bots as any).Bot;
		const bots = await BotModel.aggregate([
			{ $match: { privacy: 'public', bot: { $ne: false } } },
			{
				$lookup: {
					from: 'stats',
					let: { botId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$id', '$$botId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
					as: 'statsData',
				},
			},
			{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'votes',
					let: { botId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$botId', '$$botId'] } } }, { $count: 'count' }],
					as: 'voteData',
				},
			},
			{
				$addFields: {
					computedVoteCount: {
						$max: [{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] }, { $ifNull: ['$statsData.voteCount', 0] }, { $ifNull: ['$voteCount', 0] }],
					},
					computedGuildCount: { $ifNull: ['$statsData.guildCount', 0] },
					computedUserCount: { $ifNull: ['$statsData.userCount', 0] },
				},
			},
			{ $sort: { computedVoteCount: -1, computedGuildCount: -1, computedUserCount: -1 } },
			{ $limit: 10 },
		]).catch(() => []);

		if (bots.length === 0) {
			embed.setDescription('No public bots are currently ranked on the leaderboard.');
		} else {
			const lines = bots.map((b: any, idx: number) => {
				const name = b.name || b.id;
				const guilds = Number(b.computedGuildCount || 0).toLocaleString();
				const users = Number(b.computedUserCount || 0).toLocaleString();
				const votes = Number(b.computedVoteCount || 0).toLocaleString();
				return `**#${idx + 1}** • [**${name}**](https://app.xernerx.com/bots/${b.id}) — \`${votes}\` votes • \`${guilds}\` servers • \`${users}\` users`;
			});
			embed.setDescription(lines.join('\n'));
		}
	} else if (category === 'servers') {
		const GuildModel = (db.models.guilds as any).Guild;
		const servers = await GuildModel.aggregate([
			{ $match: { privacy: 'public' } },
			{
				$lookup: {
					from: 'stats',
					let: { guildId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$id', '$$guildId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
					as: 'statsData',
				},
			},
			{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'votes',
					let: { guildId: '$id' },
					pipeline: [{ $match: { $expr: { $eq: ['$guildId', '$$guildId'] } } }, { $count: 'count' }],
					as: 'voteData',
				},
			},
			{
				$addFields: {
					computedVoteCount: {
						$max: [{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] }, { $ifNull: ['$statsData.voteCount', 0] }, { $ifNull: ['$voteCount', 0] }],
					},
					computedMemberCount: {
						$max: [{ $ifNull: ['$statsData.members', 0] }, { $ifNull: ['$memberCount', 0] }],
					},
				},
			},
			{ $sort: { computedVoteCount: -1, computedMemberCount: -1 } },
			{ $limit: 10 },
		]).catch(() => []);

		if (servers.length === 0) {
			embed.setDescription('No public servers are currently ranked on the leaderboard.');
		} else {
			const lines = servers.map((s: any, idx: number) => {
				const name = s.name || s.id;
				const members = Number(s.computedMemberCount || 0).toLocaleString();
				const votes = Number(s.computedVoteCount || 0).toLocaleString();
				return `**#${idx + 1}** • [**${name}**](https://app.xernerx.com/servers/${s.id}) — \`${votes}\` votes • \`${members}\` members`;
			});
			embed.setDescription(lines.join('\n'));
		}
	} else {
		const UserModel = (db.models.users as any).User;
		const CreditModel = (db.models.users as any).Credit;

		const publicUsers = await UserModel.find({ privacy: 'public' })
			.select('id name')
			.lean()
			.catch(() => []);

		const publicUserMap = new Map<string, any>();
		for (const u of publicUsers) {
			if (u?.id) publicUserMap.set(String(u.id), u);
		}
		const publicUserIds = Array.from(publicUserMap.keys());

		const rawCredits =
			publicUserIds.length > 0
				? await CreditModel.find({ ownerId: { $in: publicUserIds }, streak: { $gt: 0 } })
						.sort({ streak: -1, balance: -1 })
						.limit(10)
						.lean()
						.catch(() => [])
				: [];

		if (rawCredits.length === 0) {
			embed.setDescription('No public user streaks are currently ranked on the leaderboard.');
		} else {
			const lines = rawCredits.map((c: any, idx: number) => {
				const uid = String(c.ownerId);
				const u = publicUserMap.get(uid);
				const label = u?.name ? `[**${u.name}**](https://app.xernerx.com/users/${uid})` : `<@${uid}>`;
				return `**#${idx + 1}** • ${label} — \`${c.streak || 0}d\` streak`;
			});
			embed.setDescription(lines.join('\n'));
		}
	}

	embed
		.setFooter({
			text: `${clientBotName} • Ecosystem Leaderboard`,
			iconURL: clientBotAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		LEADERBOARD_CATEGORIES.map((cat) =>
			new ButtonBuilder()
				.setCustomId(`leaderboard:${cat.id}`)
				.setLabel(cat.label)
				.setStyle(cat.id === category ? ButtonStyle.Primary : ButtonStyle.Secondary)
		)
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

export default class LeaderboardCommand extends SlashCommandBuilder {
	constructor() {
		super('leaderboard', {
			name: 'leaderboard',
			description: 'View top public bots, servers, and daily user streaks on the Xernerx ecosystem.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'bots',
					description: 'View the top-ranked public bots on Xernerx.',
				},
				{
					name: 'servers',
					description: 'View the top-ranked public servers on Xernerx.',
				},
				{
					name: 'streaks',
					description: 'View the highest daily reward streaks on Xernerx.',
				},
			],
		});
	}

	override async exec({ interaction, subcommand }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const category: LeaderboardCategory = subcommand === 'servers' || subcommand === 'streaks' ? subcommand : 'bots';

		try {
			const payload = await buildLeaderboardMessage(interaction.client, category, interaction.user.id);
			await (interaction as any)[replyMethod](payload);
		} catch (error) {
			console.error(`Error executing /leaderboard ${category}:`, error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Leaderboard')
				.setDescription('An error occurred while fetching leaderboard rankings. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Ecosystem Leaderboard`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
