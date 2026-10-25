/** @format */

import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { findDocsItem, searchDocs } from '../../lib/api.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

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
		const accentColor = await getUserAccentColor(interaction.user.id);

		if (!rawInput || !String(rawInput).trim()) {
			const overviewEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle('Xernerx Developer Documentation')
				.setURL('https://docs.xernerx.com')
				.setDescription('Explore official guides, API references, and open-source packages for the **Xernerx Suite**. Use `/docs <topic>` to view specific endpoints or SDK details.')
				.addFields([
					{
						name: 'REST API v1',
						value: '• [API Overview](https://docs.xernerx.com/api/v1#overview)\n• [Authentication](https://docs.xernerx.com/api/v1#authentication)\n• [Bot & Metric Endpoints](https://docs.xernerx.com/api/v1#fetch-bot-profile)',
						inline: true,
					},
					{
						name: 'CDN Services',
						value: '• [Overview](https://docs.xernerx.com/cdn#overview)\n• [Upload API](https://docs.xernerx.com/cdn#upload)\n• [Media Streaming Proxy](https://docs.xernerx.com/cdn#proxy)',
						inline: true,
					},
					{
						name: 'WebSocket Gateway',
						value: '• [Gateway Architecture](https://docs.xernerx.com/websocket#overview)\n• [Connecting & Auth](https://docs.xernerx.com/websocket#connecting)\n• [RPC Protocol](https://docs.xernerx.com/websocket#protocol)',
						inline: true,
					},
					{
						name: 'Developer Packages',
						value: '• [@xernerx/framework](https://docs.xernerx.com/packages/@xernerx/framework)\n• [@xernerx/stats](https://docs.xernerx.com/packages/@xernerx/stats)\n• [@xernerx/websocket](https://docs.xernerx.com/packages/@xernerx/websocket)\n• [@xernerx/ui](https://docs.xernerx.com/packages/@xernerx/ui)',
						inline: false,
					},
				])
				.setFooter({
					text: `${botName} • Docs`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			return await (interaction as any)[replyMethod]({ embeds: [overviewEmbed] });
		}

		const item = await findDocsItem(String(rawInput));

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
					name: 'Endpoint',
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

		await (interaction as any)[replyMethod]({ embeds: [embed] });
	}
}
