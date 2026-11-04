/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../lib/botUtils.js';

const CATEGORY_LABELS: Record<string, string> = {
	announcements: '📢 Announcements',
	security: '🛡️ Security',
	product: '✨ Product',
	engineering: '⚙️ Engineering',
	community: '🌐 Community',
};

export default class BlogCommand extends SlashCommandBuilder {
	constructor() {
		super('blog', {
			name: 'blog',
			description: 'Browse official Xernerx Studios newsroom articles, engineering deep-dives, and announcements.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'article',
					description: 'Search and select an article (defaults to the latest featured article).',
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
			const BlogPost = (db.models.core as any).BlogPost;
			const posts = await BlogPost.find({
				privacy: 'public',
				publishedAt: { $lte: new Date() },
			})
				.sort({ featured: -1, publishedAt: -1 })
				.limit(40)
				.select('slug title category readingTimeMinutes')
				.lean()
				.catch(() => []);

			const filtered = !query
				? posts
				: posts.filter(
						(p: any) =>
							String(p.title || '')
								.toLowerCase()
								.includes(query) ||
							String(p.slug || '')
								.toLowerCase()
								.includes(query) ||
							String(p.category || '')
								.toLowerCase()
								.includes(query)
					);

			await interaction.respond(
				filtered.slice(0, 25).map((p: any) => {
					const label = `[${String(p.category || 'news').toUpperCase()}] ${p.title}`;
					return {
						name: label.length > 100 ? `${label.slice(0, 97)}...` : label,
						value: String(p.slug).slice(0, 100),
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
		const slugInput = ((options as any)?.article?.value || interaction.options.getString('article') || '').trim();

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const BlogPost = (db.models.core as any).BlogPost;
			const now = new Date();

			const recentPosts = await BlogPost.find({
				privacy: 'public',
				publishedAt: { $lte: now },
			})
				.sort({ featured: -1, publishedAt: -1 })
				.limit(10)
				.lean()
				.catch(() => []);

			let targetPost: any = null;
			if (slugInput) {
				targetPost = await BlogPost.findOne({
					$or: [{ slug: slugInput }, { id: slugInput }],
					publishedAt: { $lte: now },
				})
					.lean()
					.catch(() => null);

				if (targetPost && targetPost.privacy === 'private' && targetPost.author?.id !== interaction.user.id) {
					targetPost = null;
				}
			} else {
				targetPost = recentPosts[0] || null;
			}

			if (!targetPost) {
				const emptyEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Xernerx Studios Newsroom')
					.setURL('https://blog.xernerx.com')
					.setDescription('Explore official product announcements, security advisories, and engineering deep-dives at **blog.xernerx.com**.')
					.setFooter({
						text: `${botName} • Xernerx Blog`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('Visit Xernerx Blog').setStyle(ButtonStyle.Link).setURL('https://blog.xernerx.com'));

				return await (interaction as any)[replyMethod]({ embeds: [emptyEmbed], components: [row] });
			}

			const articleUrl = `https://blog.xernerx.com/${targetPost.slug}`;
			const excerpt =
				targetPost.subtitle ||
				String(targetPost.content || '')
					.replace(/[#*`>_~\[\]]/g, '')
					.slice(0, 260)
					.trim() + '...';

			const publishedUnix = Math.floor(new Date(targetPost.publishedAt || Date.now()).getTime() / 1000);
			const categoryLabel = CATEGORY_LABELS[targetPost.category] || targetPost.category || 'Announcements';

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(targetPost.title)
				.setURL(articleUrl)
				.setDescription(`${excerpt}\n\n👉 **[Read the full article on Xernerx Blog](${articleUrl})**`)
				.addFields([
					{
						name: 'Article Info',
						value: [
							`• **Category:** ${categoryLabel}`,
							`• **Reading Time:** \`${targetPost.readingTimeMinutes || 3} min read\``,
							`• **Published:** <t:${publishedUnix}:D> (<t:${publishedUnix}:R>)`,
						].join('\n'),
						inline: true,
					},
					{
						name: 'Author & Engagement',
						value: [
							`• **Author:** ${targetPost.author?.globalName || 'Xernerx Studios'}`,
							`• **Role:** \`${targetPost.author?.role || 'Core Engineering'}\``,
							`• **Views:** \`${Number(targetPost.views || 0).toLocaleString()}\``,
						].join('\n'),
						inline: true,
					},
				]);

			const otherPosts = recentPosts.filter((p: any) => p.slug !== targetPost.slug).slice(0, 4);
			if (otherPosts.length > 0) {
				embed.addFields([
					{
						name: 'More on Xernerx Blog',
						value: otherPosts.map((p: any) => `• **[${p.title}](https://blog.xernerx.com/${p.slug})** (\`${p.readingTimeMinutes || 3} min\`)`).join('\n'),
						inline: false,
					},
				]);
			}

			if (targetPost.coverImage && String(targetPost.coverImage).startsWith('http')) {
				embed.setImage(targetPost.coverImage);
			}

			embed
				.setFooter({
					text: `${botName} • blog.xernerx.com`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Read Full Article on Xernerx Blog').setStyle(ButtonStyle.Link).setURL(articleUrl),
				new ButtonBuilder().setLabel('All Newsroom Articles').setStyle(ButtonStyle.Link).setURL('https://blog.xernerx.com')
			);

			await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Error executing /blog command:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Blog Article')
				.setDescription('An error occurred while loading articles from Xernerx Blog.')
				.setFooter({
					text: `${botName} • Xernerx Blog`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
