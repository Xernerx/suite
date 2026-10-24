/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../../../lib/botUtils.js';

function formatIssueStatus(status?: string): string {
	return status === 'resolved' ? 'Resolved' : 'Open';
}

export default class IssuesCommand extends SlashCommandBuilder {
	constructor() {
		super('issues', {
			name: 'issues',
			description: 'View tracked known issues, bug reports, and release fixes across the Xernerx Suite.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'issue',
					description: 'Search and select a tracked issue or bug report to inspect...',
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
			const IssueModel = (db.models.core as any).Issue;
			const items = IssueModel
				? await IssueModel.find({ acknowledged: true })
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
					const statusLabel = formatIssueStatus(item.status);
					const rawLabel = `[${statusLabel}] ${item.title}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: String(item.id || item._id).slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /issues autocomplete:', error);
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
		const rawInput = (options as any)?.issue?.value || interaction.options.getString('issue') || '';
		const issuesUrl = 'https://info.xernerx.com/bugs';

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const IssueModel = (db.models.core as any).Issue;

			const items = IssueModel
				? await IssueModel.find({ acknowledged: true })
						.sort({ createdAt: -1 })
						.lean()
						.catch(() => [])
				: [];

			if (rawInput && String(rawInput).trim()) {
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
						.setTitle('Issue Not Found')
						.setDescription(`We couldn't find a tracked issue matching **"${rawInput}"**.\n\nReport bugs or view known issues at [info.xernerx.com/bugs](${issuesUrl}).`)
						.setFooter({
							text: `${botName} • Issues`,
							iconURL: botAvatar,
						})
						.setTimestamp();

					return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
				}

				const createdTs = found.createdAt ? Math.floor(new Date(found.createdAt).getTime() / 1000) : null;
				const resolvedTs = found.resolvedAt ? Math.floor(new Date(found.resolvedAt).getTime() / 1000) : null;

				const resolutionLines: string[] = [`• **Bounty:** \`${found.bountyAwarded ? '+500 Credits Awarded' : '+500 Credits on Verification'}\``];
				if (found.resolvedApp || found.resolvedVersion) {
					resolutionLines.unshift(`• **Fix Target:** \`${found.resolvedApp || 'suite'}${found.resolvedVersion ? ` v${found.resolvedVersion}` : ''}\``);
				}
				if (resolvedTs) {
					resolutionLines.unshift(`• **Resolved:** <t:${resolvedTs}:R>`);
				}

				const itemEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle(found.title)
					.setURL(issuesUrl)
					.setDescription(found.description || 'No description provided.')
					.addFields([
						{
							name: 'Issue Details',
							value: [
								`• **Status:** ${formatIssueStatus(found.status)}`,
								`• **Product:** \`${found.productId || 'Suite'}\``,
								...(found.authorId ? [`• **Reporter:** <@${found.authorId}>`] : []),
								...(createdTs ? [`• **Reported:** <t:${createdTs}:R>`] : []),
							].join('\n'),
							inline: true,
						},
						{
							name: 'Resolution & Bounty',
							value: resolutionLines.join('\n'),
							inline: true,
						},
					])
					.setFooter({
						text: `${botName} • Issues`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('View Bug Tracker').setStyle(ButtonStyle.Link).setURL(issuesUrl));

				return await (interaction as any)[replyMethod]({ embeds: [itemEmbed], components: [row] });
			}

			// Overview of issues
			const openIssues = items.filter((i: any) => i.status !== 'resolved');
			const resolvedIssues = items.filter((i: any) => i.status === 'resolved');

			const formatList = (list: any[], emptyText: string) =>
				list.length > 0
					? list
							.slice(0, 6)
							.map((i: any) => {
								const fixTag = i.resolvedVersion ? ` — Fixed in \`v${i.resolvedVersion}\`` : '';
								return `• **${i.title}** (\`${i.productId || 'Suite'}\`)${fixTag}`;
							})
							.join('\n')
					: emptyText;

			const overviewEmbed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle('Xernerx Issue & Bug Tracker')
				.setURL(issuesUrl)
				.setDescription(`Report bugs on [info.xernerx.com/bugs](${issuesUrl}). Acknowledged bug reports automatically award a **+500 Credit Bounty** to the reporter.`)
				.addFields([
					{
						name: `Known Open Issues (${openIssues.length})`,
						value: formatList(openIssues, 'No open known issues currently tracked.'),
						inline: false,
					},
					{
						name: `Recently Resolved (${resolvedIssues.length})`,
						value: formatList(resolvedIssues, 'No recently resolved issues listed.'),
						inline: false,
					},
				])
				.setFooter({
					text: `${botName} • Issues`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('Report a Bug').setStyle(ButtonStyle.Link).setURL(issuesUrl));

			await (interaction as any)[replyMethod]({ embeds: [overviewEmbed], components: [row] });
		} catch (error) {
			console.error('Error executing /issues:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Issues')
				.setDescription(`An error occurred while fetching tracked issues. Visit [info.xernerx.com/bugs](${issuesUrl}).`)
				.setFooter({
					text: `${botName} • Issues`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
