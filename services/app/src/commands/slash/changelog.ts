/** @format */

import fs from 'fs';
import path from 'path';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getApiBaseUrl, getUserAccentColor } from '../../lib/botUtils.js';

interface ChangelogPayload {
	versions: string[];
	selectedVersion: string;
	content: string;
}

function parseLocalChangelog(requestedVersion?: string): ChangelogPayload | null {
	const candidatePaths = [path.resolve(process.cwd(), '../../apps/api/CHANGELOG.md'), path.resolve(process.cwd(), '../../apps/info/CHANGELOG.md'), path.resolve(process.cwd(), 'CHANGELOG.md')];

	for (const filePath of candidatePaths) {
		try {
			if (!fs.existsSync(filePath)) continue;
			const content = fs.readFileSync(filePath, 'utf8');
			const versionRegex = /^#{2}\s+(?:\[?v?([\d.-]+\w*)\]?|([\d.-]+\w*))/gm;
			const matches = [...content.matchAll(versionRegex)];

			if (matches.length === 0) continue;

			const versions: string[] = [];
			const parsedSections: { version: string; content: string }[] = [];

			for (let i = 0; i < matches.length; i++) {
				const currentMatch = matches[i];
				const version = currentMatch[1] || currentMatch[2];
				versions.push(version);

				const startIndex = currentMatch.index!;
				const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
				const sectionContent = content.slice(startIndex, endIndex).trim();
				parsedSections.push({ version, content: sectionContent });
			}

			const selected = requestedVersion ? parsedSections.find((s) => s.version === requestedVersion) || parsedSections[0] : parsedSections[0];

			return {
				versions,
				selectedVersion: selected.version,
				content: selected.content,
			};
		} catch {}
	}

	return null;
}

async function fetchChangelogData(requestedVersion?: string): Promise<ChangelogPayload | null> {
	try {
		const query = requestedVersion ? `?version=${encodeURIComponent(requestedVersion)}` : '';
		const res = await fetch(`${getApiBaseUrl()}/api/changelog${query}`, {
			headers: { Accept: 'application/json' },
		});
		if (res.ok) {
			const data: any = await res.json();
			if (data?.content) {
				return {
					versions: Array.isArray(data.versions) ? data.versions : [],
					selectedVersion: String(data.selectedVersion || 'latest'),
					content: String(data.content),
				};
			}
		}
	} catch {}

	return parseLocalChangelog(requestedVersion);
}

function cleanChangelogMarkdown(raw: string): string {
	const cleaned = raw
		.replace(/<!--\s*@format\s*-->/g, '')
		.replace(/^#{1,2}\s+[\d.-]+\w*\s*/m, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	if (cleaned.length <= 3800) {
		return cleaned;
	}

	return `${cleaned.slice(0, 3750)}\n\n*...Release notes truncated. Read the full release on [info.xernerx.com/changelog](https://info.xernerx.com/changelog).*`;
}

export default class ChangelogCommand extends SlashCommandBuilder {
	constructor() {
		super('changelog', {
			name: 'changelog',
			description: 'View the latest Xernerx Suite release notes and version history.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
			options: [
				{
					name: 'version',
					description: 'Select a specific release version to inspect (defaults to latest)...',
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
			const payload = await fetchChangelogData();
			const versions = payload?.versions || [];

			const filtered = !query ? versions : versions.filter((v) => v.toLowerCase().includes(query));

			await interaction.respond(
				filtered.slice(0, 25).map((v, idx) => ({
					name: idx === 0 && !query ? `v${v} (Latest)` : `v${v}`,
					value: v.slice(0, 100),
				}))
			);
		} catch (error) {
			console.error('Error in /changelog autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL({ size: 256 });
		const botName = botUser?.username || 'Xernerx App';
		const rawVersion = (options as any)?.version?.value || interaction.options.getString('version') || '';

		try {
			const [payload, accentColor] = await Promise.all([fetchChangelogData(rawVersion ? String(rawVersion).trim() : undefined), getUserAccentColor(interaction.user.id)]);

			if (!payload || !payload.content) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Changelog Unavailable')
					.setDescription('Release notes could not be loaded right now. View the full changelog at [info.xernerx.com/changelog](https://info.xernerx.com/changelog).')
					.setFooter({
						text: `${botName} • Changelog`,
						iconURL: botAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const formattedBody = cleanChangelogMarkdown(payload.content);
			const changelogUrl = 'https://info.xernerx.com/changelog';

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(`Xernerx Suite Release Notes • v${payload.selectedVersion}`)
				.setURL(changelogUrl)
				.setDescription(formattedBody || 'No release notes recorded for this version.')
				.setFooter({
					text: `${botName} • Release Changelog`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			if (botAvatar) {
				embed.setThumbnail(botAvatar);
			}

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Read Full Changelog').setStyle(ButtonStyle.Link).setURL(changelogUrl),
				new ButtonBuilder().setLabel('RSS Feed').setStyle(ButtonStyle.Link).setURL('https://api.xernerx.com/v1/changelog/rss.xml'),
				new ButtonBuilder().setLabel('Product Roadmap').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/roadmap')
			);

			await (interaction as any)[replyMethod]({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Error executing /changelog:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Changelog')
				.setDescription('An error occurred while fetching release notes. View the changelog at [info.xernerx.com/changelog](https://info.xernerx.com/changelog).')
				.setFooter({
					text: `${botName} • Changelog`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
