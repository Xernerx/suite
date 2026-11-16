/** @format */

import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { fetchFaqItems, findFaqItem, searchFaq } from '../../lib/api.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

export type FaqCategoryTab = 'overview' | 'platform' | 'developers' | 'community';

const FAQ_TABS: { id: FaqCategoryTab; label: string }[] = [
	{ id: 'overview', label: 'All Categories' },
	{ id: 'platform', label: 'Account & Store' },
	{ id: 'developers', label: 'Bots & Devs' },
	{ id: 'community', label: 'Support & Safety' },
];

export async function buildFaqOverviewMessage(client: Client, tab: FaqCategoryTab = 'overview', requesterUserId?: string) {
	const botUser = client.user;
	const botAvatar = botUser?.displayAvatarURL({ size: 256 });
	const botName = botUser?.username || 'Xernerx App';

	const [accentColor, allItems] = await Promise.all([getUserAccentColor(requesterUserId), fetchFaqItems()]);

	const embed = new EmbedBuilder()
		.setColor(accentColor)
		.setTitle('Xernerx Suite • FAQ Knowledge Base')
		.setURL('https://info.xernerx.com/faq')
		.setDescription('Welcome to the **Xernerx FAQ Hub**! Search for any question directly via autocomplete (`/faq <question>`) or switch categories below.');

	if (botAvatar) {
		embed.setThumbnail(botAvatar);
	}

	if (tab === 'overview') {
		embed.addFields([
			{
				name: '🛡️ Platform & Account',
				value: '• [Ecosystem](https://info.xernerx.com/faq?category=overview) • [Environments](https://info.xernerx.com/faq?category=environments)\n• [Feedback](https://info.xernerx.com/faq?category=feedback) • [Desktop](https://info.xernerx.com/faq?category=desktop)\n• [Security](https://info.xernerx.com/faq?category=account) • [Profiles](https://info.xernerx.com/faq?category=profiles)\n• [Preferences](https://info.xernerx.com/faq?category=preferences) • [Privacy](https://info.xernerx.com/faq?category=privacy)',
				inline: true,
			},
			{
				name: '💬 Community & Billing',
				value: '• [Bots](https://info.xernerx.com/faq?category=bots) • [Servers](https://info.xernerx.com/faq?category=servers)\n• [Virtue](https://info.xernerx.com/faq?category=virtue) • [Leaderboards](https://info.xernerx.com/faq?category=leaderboards)\n• [Organizations](https://info.xernerx.com/faq?category=organizations)\n• [Subscriptions](https://info.xernerx.com/faq?category=billing) • [Credits](https://info.xernerx.com/faq?category=credits) • [Media CDN](https://info.xernerx.com/faq?category=cdn)',
				inline: true,
			},
			{
				name: '⚙️ Developers',
				value: '• [REST API](https://info.xernerx.com/faq?category=developers) • [Webhooks](https://info.xernerx.com/faq?category=webhooks) • [Packages](https://info.xernerx.com/faq?category=packages) • [Translations](https://info.xernerx.com/faq?category=translations)',
				inline: false,
			},
		]);
	} else {
		const categoryMap: Record<Exclude<FaqCategoryTab, 'overview'>, string[]> = {
			platform: ['account', 'profiles', 'preferences', 'privacy', 'billing', 'credits', 'cdn', 'desktop'],
			developers: ['bots', 'developers', 'webhooks', 'packages', 'environments'],
			community: ['overview', 'feedback', 'servers', 'virtue', 'leaderboards', 'organizations', 'translations'],
		};
		const matching = allItems.filter((item) => categoryMap[tab].some((k) => item.categoryId.toLowerCase() === k || item.categoryTitle.toLowerCase().includes(k)));
		const displayItems = (matching.length > 0 ? matching : allItems).slice(0, 8);

		embed.addFields([
			{
				name: `Featured Questions (${FAQ_TABS.find((t) => t.id === tab)?.label})`,
				value: displayItems.map((i) => `• **[${i.question}](${i.url})** — *${i.categoryTitle}*`).join('\n') || 'Browse all articles at [info.xernerx.com/faq](https://info.xernerx.com/faq).',
				inline: false,
			},
		]);
	}

	embed
		.setFooter({
			text: `${botName} • FAQ Knowledge Base`,
			iconURL: botAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...FAQ_TABS.map((t) =>
			new ButtonBuilder()
				.setCustomId(`faq:${t.id}`)
				.setLabel(t.label)
				.setStyle(t.id === tab ? ButtonStyle.Primary : ButtonStyle.Secondary)
		),
		new ButtonBuilder().setLabel('Open FAQ Hub').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/faq')
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

export default class FaqCommand extends SlashCommandBuilder {
	constructor() {
		super('faq', {
			name: 'faq',
			description: 'Browse and search the official Xernerx FAQ knowledge base.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'question',
					description: 'Search for a question or select from the list...',
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
			const results = await searchFaq(query);

			await interaction.respond(
				results.slice(0, 25).map((item) => {
					const uniqueId = item.fullId || (item.id.includes('.') ? item.id : `${item.categoryId}.${item.id}`);
					return {
						name: item.question.length > 100 ? `${item.question.slice(0, 97)}...` : item.question,
						value: uniqueId.length > 100 ? uniqueId.slice(0, 100) : uniqueId,
					};
				})
			);
		} catch (error) {
			console.error('Error in /faq autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options }: SlashCommandOptions) {
		const rawInput = (options as any)?.question?.value || (options as any)?.question || '';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL();
		const botName = botUser?.username || 'Xernerx App';
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';

		if (!rawInput || !String(rawInput).trim()) {
			const payload = await buildFaqOverviewMessage(interaction.client, 'overview', interaction.user.id);
			return await (interaction as any)[replyMethod](payload);
		}

		const [accentColor, item] = await Promise.all([getUserAccentColor(interaction.user.id), findFaqItem(String(rawInput))]);

		if (!item) {
			const notFoundEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('FAQ Entry Not Found')
				.setDescription(
					`We couldn't find an FAQ entry matching **"${rawInput}"**.\n\nPlease pick a question from the autocomplete list or explore the full knowledge base online at [info.xernerx.com/faq](https://info.xernerx.com/faq).`
				)
				.setFooter({
					text: `${botName} • FAQ`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
		}

		const embed = new EmbedBuilder()
			.setColor(accentColor)
			.setTitle(item.question)
			.setURL(item.url)
			.setDescription(item.markdown || item.answer)
			.setFooter({
				text: `${botName} • FAQ • ${item.categoryTitle}`,
				iconURL: botAvatar,
			})
			.setTimestamp();

		if (item.quickLinks && item.quickLinks.length > 0) {
			embed.addFields([
				{
					name: 'Quick Links & Source',
					value: item.quickLinks.map((ql) => `• [${ql.label}](${ql.href})${ql.vanity ? ` (\`${ql.vanity}\`)` : ''}`).join('\n'),
					inline: false,
				},
			]);
		}

		const linkButtons: ButtonBuilder[] = [
			new ButtonBuilder()
				.setLabel('Read on FAQ Hub')
				.setStyle(ButtonStyle.Link)
				.setURL(item.url || 'https://info.xernerx.com/faq'),
		];
		if (Array.isArray(item.quickLinks)) {
			for (const ql of item.quickLinks.slice(0, 3)) {
				if (ql.href && ql.href.startsWith('http')) {
					linkButtons.push(new ButtonBuilder().setLabel(ql.label.slice(0, 80)).setStyle(ButtonStyle.Link).setURL(ql.href));
				}
			}
		}
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...linkButtons);

		await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
	}
}
