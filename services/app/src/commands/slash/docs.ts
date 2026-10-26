/** @format */

import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { fetchDocsItems, findDocsItem, searchDocs } from '../../lib/api.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export type DocsSectionTab = 'overview' | 'api' | 'cdn' | 'websocket' | 'packages';

const DOCS_TABS: { id: DocsSectionTab; label: string }[] = [
	{ id: 'overview', label: 'Overview' },
	{ id: 'api', label: 'REST API v1' },
	{ id: 'cdn', label: 'CDN & Media' },
	{ id: 'packages', label: 'Packages & SDKs' },
];

export async function buildDocsOverviewMessage(client: Client, tab: DocsSectionTab = 'overview', requesterUserId?: string) {
	const botUser = client.user;
	const botAvatar = botUser?.displayAvatarURL({ size: 256 });
	const botName = botUser?.username || 'Xernerx App';

	const [accentColor, allDocs] = await Promise.all([getUserAccentColor(requesterUserId), fetchDocsItems()]);

	const embed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle('Xernerx Suite • Developer Documentation')
		.setURL('https://docs.xernerx.com')
		.setDescription(
			'Explore official developer guides, interactive REST API v1 endpoints, WebSocket RPC protocols, and open-source SDK packages.\nUse `/docs <topic>` to inspect any endpoint or package directly.'
		);

	if (botAvatar) {
		embed.setThumbnail(botAvatar);
	}

	if (tab === 'overview') {
		embed.addFields([
			{
				name: '🌐 REST API v1',
				value: '• [API Overview](https://docs.xernerx.com/api/v1#overview)\n• [Authentication](https://docs.xernerx.com/api/v1#authentication)\n• [Bot & Metric Endpoints](https://docs.xernerx.com/api/v1#fetch-bot-profile)',
				inline: true,
			},
			{
				name: '🖼️ CDN Services',
				value: '• [CDN Overview](https://docs.xernerx.com/cdn#overview)\n• [Upload API](https://docs.xernerx.com/cdn#upload)\n• [Media Streaming Proxy](https://docs.xernerx.com/cdn#proxy)',
				inline: true,
			},
			{
				name: '⚡ WebSocket Gateway',
				value: '• [Gateway Architecture](https://docs.xernerx.com/websocket#overview)\n• [Connecting & Auth](https://docs.xernerx.com/websocket#connecting)\n• [RPC Protocol](https://docs.xernerx.com/websocket#protocol)',
				inline: true,
			},
			{
				name: '📦 Official NPM Packages',
				value: '• [xernerx](https://docs.xernerx.com/packages/xernerx) • [@xernerx/framework](https://docs.xernerx.com/packages/@xernerx/framework) • [@xernerx/commands](https://docs.xernerx.com/packages/@xernerx/commands) • [@xernerx/stats](https://docs.xernerx.com/packages/@xernerx/stats) • [@xernerx/websocket](https://docs.xernerx.com/packages/@xernerx/websocket) • [@xernerx/terminal](https://docs.xernerx.com/packages/@xernerx/terminal)',
				inline: false,
			},
		]);
	} else {
		const filtered = allDocs.filter((d) => d.category.toLowerCase().includes(tab) || d.categoryTitle.toLowerCase().includes(tab));
		const display = (filtered.length > 0 ? filtered : allDocs).slice(0, 8);
		embed.addFields([
			{
				name: `${DOCS_TABS.find((t) => t.id === tab)?.label || 'Documentation'} Reference`,
				value:
					display
						.map((d) => {
							const prefix = d.method && d.path ? `\`${d.method} ${d.path}\` — ` : '';
							return `• ${prefix}**[${d.title}](${d.url})**`;
						})
						.join('\n') || 'Browse the full reference at [docs.xernerx.com](https://docs.xernerx.com).',
				inline: false,
			},
		]);
	}

	embed
		.setFooter({
			text: `${botName} • Developer Docs`,
			iconURL: botAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...DOCS_TABS.map((t) =>
			new ButtonBuilder()
				.setCustomId(`docs:${t.id}`)
				.setLabel(t.label)
				.setStyle(t.id === tab ? ButtonStyle.Primary : ButtonStyle.Secondary)
		),
		new ButtonBuilder().setLabel('Open Docs').setStyle(ButtonStyle.Link).setURL('https://docs.xernerx.com')
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

export default class DocsCommand extends SlashCommandBuilder {
	constructor() {
		super('docs', {
			name: 'docs',
			description: 'Browse official Xernerx developer documentation, API endpoints, and SDKs.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'topic',
					description: 'Search documentation topic, endpoint, or package...',
					type: 'string',
					required: false,
					autocomplete: true,
				},
			],
		});
	}

	override async autocomplete({ interaction, focused }: SlashCommandAutocomplete) {
		try {
			const query = (focused?.value as string) || '';
			const results = await searchDocs(query);

			await interaction.respond(
				results.slice(0, 25).map((item) => {
					const prefix = item.method && item.path ? `${item.method} ${item.path}` : item.title;
					const label = item.method && item.path ? `${prefix} (${item.title})` : `[${item.categoryTitle}] ${prefix}`;
					return {
						name: label.length > 100 ? `${label.slice(0, 97)}...` : label,
						value: item.id.length > 100 ? item.id.slice(0, 100) : item.id,
					};
				})
			);
		} catch (error) {
			console.error('Error in /docs autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options }: SlashCommandOptions) {
		const rawInput = (options as any)?.topic?.value || (options as any)?.topic || '';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL();
		const botName = botUser?.username || 'Xernerx App';
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';

		if (!rawInput || !String(rawInput).trim()) {
			const payload = await buildDocsOverviewMessage(interaction.client, 'overview', interaction.user.id);
			return await (interaction as any)[replyMethod](payload);
		}

		const [accentColor, item] = await Promise.all([getUserAccentColor(interaction.user.id), findDocsItem(String(rawInput))]);

		if (!item) {
			const notFoundEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Documentation Topic Not Found')
				.setDescription(
					`We couldn't find documentation matching **"${rawInput}"**.\n\nPlease select one of the suggested topics or explore our developer documentation online at [docs.xernerx.com](https://docs.xernerx.com).`
				)
				.setFooter({
					text: `${botName} • Docs`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
		}

		const title = item.method && item.path ? `${item.method} ${item.path} • ${item.title}` : item.title;

		const embed = new EmbedBuilder()
			.setColor(accentColor)
			.setTitle(title)
			.setURL(item.url)
			.setDescription(item.description || item.markdown)
			.setFooter({
				text: `${botName} • Docs • ${item.categoryTitle}`,
				iconURL: botAvatar,
			})
			.setTimestamp();

		if (item.method && item.path) {
			embed.addFields([
				{
					name: 'Endpoint Signature',
					value: `• **Method:** \`${item.method}\` • **Path:** \`${item.path}\``,
					inline: false,
				},
			]);
		}

		if (item.quickLinks && item.quickLinks.length > 0) {
			embed.addFields([
				{
					name: 'Links & Source',
					value: item.quickLinks.map((ql) => `• [${ql.label}](${ql.href})${ql.vanity ? ` (\`${ql.vanity}\`)` : ''}`).join('\n'),
					inline: false,
				},
			]);
		}

		const buttons: ButtonBuilder[] = [
			new ButtonBuilder()
				.setLabel('Read on Developer Docs')
				.setStyle(ButtonStyle.Link)
				.setURL(item.url || 'https://docs.xernerx.com'),
			new ButtonBuilder().setLabel('Developer Portal').setStyle(ButtonStyle.Link).setURL('https://portal.xernerx.com'),
		];
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

		await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
	}
}
