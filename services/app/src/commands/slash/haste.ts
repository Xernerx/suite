/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

function extractPasteId(input: string): string {
	const trimmed = input.trim();
	const urlMatch = trimmed.match(/haste\.(?:dev\.|canary\.)?xernerx\.com\/(?:raw\/)?([a-zA-Z0-9_-]+)/i);
	if (urlMatch) return urlMatch[1];
	return trimmed.replace(/^\/+/, '').split(/[/?#]/)[0] || '';
}

function formatBytes(bytes: number): string {
	if (!bytes || bytes < 1024) return `${bytes || 0} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default class HasteCommand extends SlashCommandBuilder {
	constructor() {
		super('haste', {
			name: 'haste',
			description: 'Preview code snippets on Xernerx Haste or open the web pastebin.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'paste',
					description: 'Enter a paste ID, haste.xernerx.com link, or select a public paste.',
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
			const db = await database('haste');
			const DocumentModel = (db.models.documents as any).Document;
			const now = new Date();

			const docs = await DocumentModel.find({
				privacy: 'public',
				$or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
			})
				.sort({ createdAt: -1 })
				.limit(30)
				.select('id title language size')
				.lean()
				.catch(() => []);

			const filtered = !query
				? docs
				: docs.filter(
						(d: any) =>
							String(d.id || '')
								.toLowerCase()
								.includes(query) ||
							String(d.title || '')
								.toLowerCase()
								.includes(query) ||
							String(d.language || '')
								.toLowerCase()
								.includes(query)
					);

			await interaction.respond(
				filtered.slice(0, 25).map((d: any) => {
					const label = `[${d.language || 'text'}] ${d.title || d.id} (${formatBytes(d.size || 0)})`;
					return {
						name: label.length > 100 ? `${label.slice(0, 97)}...` : label,
						value: String(d.id).slice(0, 100),
					};
				})
			);
		} catch {
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
		const rawInput = ((options as any)?.paste?.value || interaction.options.getString('paste') || '').trim();

		try {
			const [db, accentColor] = await Promise.all([database('haste'), getUserAccentColor(interaction.user.id)]);
			const DocumentModel = (db.models.documents as any).Document;
			const now = new Date();

			if (!rawInput) {
				const recentPublic = await DocumentModel.find({
					privacy: 'public',
					$or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
				})
					.sort({ createdAt: -1 })
					.limit(6)
					.select('id title language size views')
					.lean()
					.catch(() => []);

				const recentLines =
					recentPublic.length > 0
						? recentPublic.map((d: any) => `• **[${d.title || d.id}](https://haste.xernerx.com/${d.id})** — \`${d.language || 'plaintext'}\` • \`${formatBytes(d.size || 0)}\``)
						: ['No public pastes available right now. Create one on **haste.xernerx.com**!'];

				const embed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Xernerx Haste • Code Pastebin')
					.setURL('https://haste.xernerx.com')
					.setDescription('Share code snippets, logs, and config files with syntax highlighting, TTL expirations, and raw streaming at **[haste.xernerx.com](https://haste.xernerx.com)**.')
					.addFields([
						{
							name: 'Recent Public Pastes',
							value: recentLines.join('\n'),
							inline: false,
						},
					])
					.setFooter({
						text: `${botName} • haste.xernerx.com`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setLabel('Create New Paste on Xernerx Haste').setStyle(ButtonStyle.Link).setURL('https://haste.xernerx.com')
				);

				return await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
			}

			const pasteId = extractPasteId(rawInput);
			const doc = await DocumentModel.findOne({
				id: pasteId,
				$or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
			})
				.lean()
				.catch(() => null);

			if (!doc || (doc.privacy === 'private' && String(doc.userId) !== interaction.user.id)) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Paste Not Found or Private')
					.setDescription(`Paste **\`${pasteId}\`** does not exist, has expired, or is set to **private**.`)
					.setFooter({
						text: `${botName} • haste.xernerx.com`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('Open Xernerx Haste').setStyle(ButtonStyle.Link).setURL('https://haste.xernerx.com'));

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed], components: [row] });
			}

			const pasteUrl = `https://haste.xernerx.com/${doc.id}`;
			const rawUrl = `https://haste.xernerx.com/raw/${doc.id}`;
			const allLines = String(doc.content || '').split('\n');
			const previewSnippet = allLines.slice(0, 8).join('\n').slice(0, 380);
			const hasMore = allLines.length > 8 || String(doc.content || '').length > 380;

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(doc.title ? `${doc.title} (${doc.id})` : `Paste #${doc.id}`)
				.setURL(pasteUrl)
				.setDescription(
					`\`\`\`${doc.language || 'txt'}\n${previewSnippet}${hasMore ? '\n// ... view full file on haste.xernerx.com' : ''}\n\`\`\`\n👉 **[Open Full Paste on Xernerx Haste](${pasteUrl})**`
				)
				.addFields([
					{
						name: 'Details',
						value: [
							`• **Language:** \`${doc.language || 'plaintext'}\``,
							`• **Lines:** \`${allLines.length.toLocaleString()}\``,
							`• **Size:** \`${formatBytes(doc.size || Buffer.byteLength(doc.content || '', 'utf8'))}\``,
						].join('\n'),
						inline: true,
					},
					{
						name: 'Visibility & TTL',
						value: [
							`• **Privacy:** \`${String(doc.privacy || 'limited').toUpperCase()}\``,
							`• **Views:** \`${Number(doc.views || 0).toLocaleString()}\``,
							`• **Expires:** ${doc.expiresAt ? `<t:${Math.floor(new Date(doc.expiresAt).getTime() / 1000)}:R>` : '`Never`'}`,
						].join('\n'),
						inline: true,
					},
				])
				.setFooter({
					text: `${botName} • haste.xernerx.com`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Open Full Paste on Xernerx Haste').setStyle(ButtonStyle.Link).setURL(pasteUrl),
				new ButtonBuilder().setLabel('Raw File').setStyle(ButtonStyle.Link).setURL(rawUrl),
				new ButtonBuilder().setLabel('Create New Paste').setStyle(ButtonStyle.Link).setURL('https://haste.xernerx.com')
			);

			await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Error executing /haste command:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Paste')
				.setDescription('An error occurred while fetching this paste from Xernerx Haste.')
				.setFooter({
					text: `${botName} • haste.xernerx.com`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
