/** @format */

import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { findFaqItem, searchFaq } from '../../lib/api.js';

export default class FaqCommand extends SlashCommandBuilder {
	constructor() {
		super('faq', {
			name: 'faq',
			description: 'Browse and search the official Xernerx FAQ knowledge base.',
			defer: true,
			deploy: { global: true },
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
				results.slice(0, 25).map((item) => ({
					name: item.question.length > 100 ? `${item.question.slice(0, 97)}...` : item.question,
					value: item.id.length > 100 ? item.id.slice(0, 100) : item.id,
				}))
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
		const botName = botUser?.username || 'Xernerx Bot';
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';

		if (!rawInput || !String(rawInput).trim()) {
			const overviewEmbed = new EmbedBuilder()
				.setColor(0x5865f2)
				.setTitle('Xernerx FAQ Knowledge Base')
				.setURL('https://info.xernerx.com/faq')
				.setDescription('Welcome to the **Xernerx FAQ Hub**! Search for any topic using autocomplete (`/faq <question>`) or explore our key platform sections below.')
				.addFields([
					{
						name: 'Platform & Identity',
						value: '• [Account & Security](https://info.xernerx.com/faq?category=account)\n• [Store, Virtue & Billing](https://info.xernerx.com/faq?category=store)',
						inline: true,
					},
					{
						name: 'Developer Ecosystem',
						value: '• [Bot Directory](https://info.xernerx.com/faq?category=bots)\n• [Developer Portal](https://info.xernerx.com/faq?category=portal)\n• [SDKs & Libraries](https://info.xernerx.com/faq?category=developers)',
						inline: true,
					},
					{
						name: 'Community & Governance',
						value: '• [Support & Feedback](https://info.xernerx.com/faq?category=support)\n• [Moderation & Safety](https://info.xernerx.com/faq?category=moderation)\n• [General Ecosystem](https://info.xernerx.com/faq?category=general)',
						inline: false,
					},
				])
				.setFooter({
					text: `${botName} • Xernerx FAQ Hub`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			return await (interaction as any)[replyMethod]({ embeds: [overviewEmbed] });
		}

		const item = await findFaqItem(String(rawInput));

		if (!item) {
			const notFoundEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('FAQ Entry Not Found')
				.setDescription(
					`We couldn't find an FAQ entry matching **"${rawInput}"**.\n\nPlease pick a question from the autocomplete list or explore the full knowledge base online at [info.xernerx.com/faq](https://info.xernerx.com/faq).`
				)
				.setFooter({
					text: `${botName} • Xernerx FAQ Hub`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
		}

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(item.question)
			.setURL(item.url)
			.setDescription(item.markdown || item.answer)
			.setFooter({
				text: `${botName} • Xernerx FAQ • ${item.sectionTitle} › ${item.categoryTitle}`,
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

		await (interaction as any)[replyMethod]({ embeds: [embed] });
	}
}
