/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export type RoadmapFilterTab = 'all' | 'active' | 'planned' | 'released';

const ROADMAP_TABS: { id: RoadmapFilterTab; label: string }[] = [
	{ id: 'all', label: 'All Overview' },
	{ id: 'active', label: 'In Progress' },
	{ id: 'planned', label: 'Planned' },
	{ id: 'released', label: 'Released' },
];

function formatRoadmapStatus(status?: string): string {
	switch (status) {
		case 'active':
			return '⚡ In Progress';
		case 'planned':
			return '🗓️ Planned';
		case 'released':
			return '✅ Released';
		case 'idea':
		default:
			return '💡 Concept';
	}
}

export async function buildRoadmapOverviewMessage(client: Client, tab: RoadmapFilterTab = 'all', requesterUserId?: string) {
	const botUser = client.user;
	const botAvatar = botUser?.displayAvatarURL({ size: 256 });
	const botName = botUser?.username || 'Xernerx App';

	const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId)]);
	const RoadmapItemModel = (db.models.core as any).RoadmapItem;

	const items = RoadmapItemModel
		? await RoadmapItemModel.find({})
				.sort({ updatedAt: -1 })
				.lean()
				.catch(() => [])
		: [];

	const activeItems = items.filter((i: any) => i.status === 'active');
	const plannedItems = items.filter((i: any) => i.status === 'planned' || i.status === 'idea');
	const releasedItems = items.filter((i: any) => i.status === 'released');

	const formatList = (list: any[], emptyText: string, limit = 6) =>
		list.length > 0
			? list
					.slice(0, limit)
					.map((i: any) => {
						const upvotes = Array.isArray(i.upvotes) ? i.upvotes.length : 0;
						const qtr = i.targetQuarter ? ` • \`${i.targetQuarter}\`` : '';
						return `• **${i.title}** (\`${i.productId || 'Suite'}\`)${qtr} — \`▲ ${upvotes}\``;
					})
					.join('\n')
			: emptyText;

	const overviewEmbed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle('Xernerx Ecosystem • Product Roadmap')
		.setURL('https://info.xernerx.com/roadmap')
		.setDescription(
			'Track active engineering sprints, upcoming platform milestones, and recently shipped features.\nUse `/roadmap <milestone>` to inspect a specific item or vote on [info.xernerx.com/roadmap](https://info.xernerx.com/roadmap).'
		);

	if (botAvatar) {
		overviewEmbed.setThumbnail(botAvatar);
	}

	if (tab === 'all') {
		overviewEmbed.addFields([
			{
				name: `⚡ In Progress (${activeItems.length})`,
				value: formatList(activeItems, 'No milestones currently marked as in progress.'),
				inline: false,
			},
			{
				name: `🗓️ Planned & Concept (${plannedItems.length})`,
				value: formatList(plannedItems, 'No upcoming milestones currently listed.'),
				inline: false,
			},
			{
				name: `✅ Recently Released (${releasedItems.length})`,
				value: formatList(releasedItems, 'See `/changelog` for the latest release notes.'),
				inline: false,
			},
		]);
	} else if (tab === 'active') {
		overviewEmbed.addFields([
			{
				name: `⚡ Active Engineering Milestones (${activeItems.length})`,
				value: formatList(activeItems, 'No milestones currently marked as in progress.', 12),
				inline: false,
			},
		]);
	} else if (tab === 'planned') {
		overviewEmbed.addFields([
			{
				name: `🗓️ Planned & Upcoming Milestones (${plannedItems.length})`,
				value: formatList(plannedItems, 'No upcoming milestones currently listed.', 12),
				inline: false,
			},
		]);
	} else {
		overviewEmbed.addFields([
			{
				name: `✅ Released Milestones (${releasedItems.length})`,
				value: formatList(releasedItems, 'See `/changelog` for the latest release notes.', 12),
				inline: false,
			},
		]);
	}

	overviewEmbed
		.setFooter({
			text: `${botName} • Roadmap`,
			iconURL: botAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...ROADMAP_TABS.map((t) =>
			new ButtonBuilder()
				.setCustomId(`roadmap:${t.id}`)
				.setLabel(t.label)
				.setStyle(t.id === tab ? ButtonStyle.Primary : ButtonStyle.Secondary)
		),
		new ButtonBuilder().setLabel('Open Roadmap').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/roadmap')
	);

	return {
		embeds: [overviewEmbed],
		components: [row],
	};
}

export default class RoadmapCommand extends SlashCommandBuilder {
	constructor() {
		super('roadmap', {
			name: 'roadmap',
			description: 'View upcoming milestones, active development, and recent releases on the Xernerx Roadmap.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'milestone',
					description: 'Search and select a specific roadmap milestone to inspect...',
					type: 'string',
					required: false,
					autocomplete: true,
				},
			],
		});
	}

	override async autocomplete({ interaction, focused }: SlashCommandAutocomplete) {
		try {
			const query = ((focused?.value as string) || '').trim().toLowerCase();
			const db = await database('xernerx');
			const RoadmapItemModel = (db.models.core as any).RoadmapItem;
			const items = RoadmapItemModel
				? await RoadmapItemModel.find({})
						.sort({ updatedAt: -1 })
						.limit(50)
						.lean()
						.catch(() => [])
				: [];

			const filtered = !query
				? items
				: items.filter(
						(item: any) =>
							String(item.title || '')
								.toLowerCase()
								.includes(query) ||
							String(item.productId || '')
								.toLowerCase()
								.includes(query) ||
							String(item.description || '')
								.toLowerCase()
								.includes(query)
					);

			await interaction.respond(
				filtered.slice(0, 25).map((item: any) => {
					const statusLabel = formatRoadmapStatus(item.status).replace(/^[^\s]+\s/, '');
					const rawLabel = `[${statusLabel}] ${item.title}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: String(item.id || item._id).slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /roadmap autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL();
		const botName = botUser?.username || 'Xernerx App';
		const rawInput = (options as any)?.milestone?.value || interaction.options.getString('milestone') || '';

		try {
			if (!rawInput || !String(rawInput).trim()) {
				const payload = await buildRoadmapOverviewMessage(interaction.client, 'all', interaction.user.id);
				return await (interaction as any)[replyMethod](payload);
			}

			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const RoadmapItemModel = (db.models.core as any).RoadmapItem;
			const items = RoadmapItemModel
				? await RoadmapItemModel.find({})
						.sort({ updatedAt: -1 })
						.lean()
						.catch(() => [])
				: [];

			const q = String(rawInput).trim().toLowerCase();
			const found = items.find(
				(i: any) =>
					String(i.id || '').toLowerCase() === q ||
					String(i._id || '').toLowerCase() === q ||
					String(i.title || '').toLowerCase() === q ||
					String(i.title || '')
						.toLowerCase()
						.includes(q)
			);

			if (!found) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Milestone Not Found')
					.setDescription(
						`We couldn't find a roadmap milestone matching **"${rawInput}"**.\n\nExplore the full interactive roadmap at [info.xernerx.com/roadmap](https://info.xernerx.com/roadmap).`
					)
					.setFooter({
						text: `${botName} • Roadmap`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const upvoteCount = Array.isArray(found.upvotes) ? found.upvotes.length : 0;
			const watcherCount = Array.isArray(found.watchers) ? found.watchers.length : 0;

			const itemEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(found.title)
				.setURL('https://info.xernerx.com/roadmap')
				.setDescription(found.description || 'No description provided.')
				.addFields([
					{
						name: 'Milestone Details',
						value: [
							`• **Status:** ${formatRoadmapStatus(found.status)}`,
							`• **Product:** \`${found.productId || 'Suite'}\``,
							...(found.targetQuarter ? [`• **Target:** \`${found.targetQuarter}\``] : []),
						].join('\n'),
						inline: true,
					},
					{
						name: 'Community Interest',
						value: [`• **Upvotes:** \`▲ ${upvoteCount.toLocaleString()}\``, `• **Watchers:** \`👁️ ${watcherCount.toLocaleString()}\``].join('\n'),
						inline: true,
					},
				])
				.setFooter({
					text: `${botName} • Roadmap`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const buttons: ButtonBuilder[] = [new ButtonBuilder().setLabel('Vote & Watch on Roadmap').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/roadmap')];
			if (found.changelogUrl) {
				buttons.push(new ButtonBuilder().setLabel('Read Release Notes').setStyle(ButtonStyle.Link).setURL(String(found.changelogUrl)));
			}
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

			return await (interaction as any)[replyMethod]({ embeds: [itemEmbed], components: [row] });
		} catch (error) {
			console.error('Error executing /roadmap:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Roadmap')
				.setDescription('An error occurred while fetching roadmap milestones. View the roadmap at [info.xernerx.com/roadmap](https://info.xernerx.com/roadmap).')
				.setFooter({
					text: `${botName} • Roadmap`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
