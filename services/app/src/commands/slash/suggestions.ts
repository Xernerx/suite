/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export type SuggestionsFilterTab = 'all' | 'pending' | 'accepted';

const SUGGESTIONS_TABS: { id: SuggestionsFilterTab; label: string }[] = [
	{ id: 'all', label: 'All Suggestions' },
	{ id: 'pending', label: 'Open for Voting' },
	{ id: 'accepted', label: 'Accepted & Shipped' },
];

function formatSuggestionStatus(status?: string): string {
	switch (status) {
		case 'accepted':
			return '🔵 Accepted';
		case 'implemented':
			return '🟢 Implemented';
		case 'declined':
			return '🔴 Declined';
		case 'pending':
		default:
			return '🟣 Pending Review';
	}
}

export async function buildSuggestionsOverviewMessage(client: Client, tab: SuggestionsFilterTab = 'all', requesterUserId?: string) {
	const botUser = client.user;
	const botAvatar = botUser?.displayAvatarURL({ size: 256 });
	const botName = botUser?.username || 'Xernerx App';
	const suggestionsUrl = 'https://info.xernerx.com/suggestions';

	const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(requesterUserId)]);
	const SuggestionModel = (db.models.core as any).Suggestion;

	const items = SuggestionModel
		? await SuggestionModel.find({})
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => [])
		: [];

	const pendingItems = items.filter((i: any) => !i.status || i.status === 'pending');
	const acceptedItems = items.filter((i: any) => i.status === 'accepted' || i.status === 'implemented');

	const formatList = (list: any[], emptyText: string, limit = 6) =>
		list.length > 0
			? list
					.slice(0, limit)
					.map((i: any) => {
						const net = (Array.isArray(i.upvotes) ? i.upvotes.length : 0) - (Array.isArray(i.downvotes) ? i.downvotes.length : 0);
						return `• **${i.title}** (\`${i.productId || 'Suite'}\`) — \`▲ ${net >= 0 ? `+${net}` : net}\``;
					})
					.join('\n')
			: emptyText;

	const overviewEmbed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle('Xernerx Suite • Community Suggestions')
		.setURL(suggestionsUrl)
		.setDescription(
			`Propose new features and vote on community ideas at [info.xernerx.com/suggestions](${suggestionsUrl}). Accepted suggestions automatically award a **+250 Credit Bounty** to the author!`
		);

	if (botAvatar) {
		overviewEmbed.setThumbnail(botAvatar);
	}

	if (tab === 'all') {
		overviewEmbed.addFields([
			{
				name: `🟣 Open for Community Voting (${pendingItems.length})`,
				value: formatList(pendingItems, 'No open suggestions right now. Be the first to submit one!'),
				inline: false,
			},
			{
				name: `🟢 Accepted & Implemented (${acceptedItems.length})`,
				value: formatList(acceptedItems, 'No accepted suggestions listed yet.'),
				inline: false,
			},
		]);
	} else if (tab === 'pending') {
		overviewEmbed.addFields([
			{
				name: `🟣 Open for Community Voting (${pendingItems.length})`,
				value: formatList(pendingItems, 'No open suggestions right now. Be the first to submit one!', 12),
				inline: false,
			},
		]);
	} else {
		overviewEmbed.addFields([
			{
				name: `🟢 Accepted & Implemented (${acceptedItems.length})`,
				value: formatList(acceptedItems, 'No accepted suggestions listed yet.', 12),
				inline: false,
			},
		]);
	}

	overviewEmbed
		.setFooter({
			text: `${botName} • Suggestions Hub`,
			iconURL: botAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...SUGGESTIONS_TABS.map((t) =>
			new ButtonBuilder()
				.setCustomId(`suggestions:${t.id}`)
				.setLabel(t.label)
				.setStyle(t.id === tab ? ButtonStyle.Primary : ButtonStyle.Secondary)
		),
		new ButtonBuilder().setLabel('Submit Suggestion (+250 Credits)').setStyle(ButtonStyle.Link).setURL(suggestionsUrl)
	);

	return {
		embeds: [overviewEmbed],
		components: [row],
	};
}

export default class SuggestionsCommand extends SlashCommandBuilder {
	constructor() {
		super('suggestions', {
			name: 'suggestions',
			description: 'Browse community feature suggestions or inspect a specific suggestion.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'suggestion',
					description: 'Search and select a community suggestion to inspect...',
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
			const SuggestionModel = (db.models.core as any).Suggestion;
			const items = SuggestionModel
				? await SuggestionModel.find({})
						.sort({ createdAt: -1 })
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
					const statusLabel = formatSuggestionStatus(item.status).replace(/^[^\s]+\s/, '');
					const rawLabel = `[${statusLabel}] ${item.title}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: String(item.id || item._id).slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /suggestions autocomplete:', error);
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
		const rawInput = (options as any)?.suggestion?.value || interaction.options.getString('suggestion') || '';
		const suggestionsUrl = 'https://info.xernerx.com/suggestions';

		try {
			if (!rawInput || !String(rawInput).trim()) {
				const payload = await buildSuggestionsOverviewMessage(interaction.client, 'all', interaction.user.id);
				return await (interaction as any)[replyMethod](payload);
			}

			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const SuggestionModel = (db.models.core as any).Suggestion;

			const items = SuggestionModel
				? await SuggestionModel.find({})
						.sort({ createdAt: -1 })
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
					.setTitle('Suggestion Not Found')
					.setDescription(`We couldn't find a suggestion matching **"${rawInput}"**.\n\nBrowse or submit suggestions at [info.xernerx.com/suggestions](${suggestionsUrl}).`)
					.setFooter({
						text: `${botName} • Suggestions`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const upvotes = Array.isArray(found.upvotes) ? found.upvotes.length : 0;
			const downvotes = Array.isArray(found.downvotes) ? found.downvotes.length : 0;
			const netVotes = upvotes - downvotes;
			const createdTs = found.createdAt ? Math.floor(new Date(found.createdAt).getTime() / 1000) : null;

			const itemEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(found.title)
				.setURL(suggestionsUrl)
				.setDescription(found.description || 'No description provided.')
				.addFields([
					{
						name: 'Overview',
						value: [
							`• **Status:** ${formatSuggestionStatus(found.status)}`,
							`• **Product:** \`${found.productId || 'Suite'}\``,
							...(found.authorId ? [`• **Author:** <@${found.authorId}>`] : []),
							...(createdTs ? [`• **Submitted:** <t:${createdTs}:R>`] : []),
						].join('\n'),
						inline: true,
					},
					{
						name: 'Community & Bounty',
						value: [
							`• **Score:** \`▲ ${netVotes >= 0 ? `+${netVotes}` : netVotes}\` (\`${upvotes}\` up / \`${downvotes}\` down)`,
							`• **Bounty:** \`${found.bountyAwarded ? '+250 Credits Awarded' : '+250 Credits on Acceptance'}\``,
						].join('\n'),
						inline: true,
					},
				])
				.setFooter({
					text: `${botName} • Suggestions`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Vote on Suggestions Hub').setStyle(ButtonStyle.Link).setURL(suggestionsUrl),
				new ButtonBuilder().setLabel('View Roadmap').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/roadmap')
			);

			return await (interaction as any)[replyMethod]({ embeds: [itemEmbed], components: [row] });
		} catch (error) {
			console.error('Error executing /suggestions:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Suggestions')
				.setDescription(`An error occurred while fetching community suggestions. Visit [info.xernerx.com/suggestions](${suggestionsUrl}).`)
				.setFooter({
					text: `${botName} • Suggestions`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
