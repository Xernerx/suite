/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandAutocomplete, type SlashCommandOptions } from '@xernerx/framework';
import { EmbedBuilder } from 'discord.js';
import { getUserAccentColor } from '../../../../lib/botUtils.js';

interface CachedOrgChoice {
	id: string;
	name: string;
	description: string;
}

let cachedOrgChoices: { data: CachedOrgChoice[]; timestamp: number } | null = null;
const ORG_CACHE_TTL_MS = 60_000;

async function getOrgChoices(): Promise<CachedOrgChoice[]> {
	const now = Date.now();
	if (cachedOrgChoices && now - cachedOrgChoices.timestamp < ORG_CACHE_TTL_MS) {
		return cachedOrgChoices.data;
	}

	try {
		const db = await database('xernerx');
		const OrganizationModel = (db.models.organizations as any).Organization;
		const orgs = await OrganizationModel.find({ privacy: 'public' }).select('_id name description').lean();

		const list: CachedOrgChoice[] = orgs.map((o: any) => ({
			id: String(o._id),
			name: String(o.name || o._id),
			description: String(o.description || ''),
		}));

		cachedOrgChoices = { data: list, timestamp: now };
		return list;
	} catch {
		return cachedOrgChoices?.data || [];
	}
}

export default class OrganizationCommand extends SlashCommandBuilder {
	constructor() {
		super('organization', {
			name: 'organization',
			description: 'View Xernerx organization profiles, members, bots, and servers.',
			defer: true,
			deploy: { global: true },
			subcommands: [
				{
					name: 'profile',
					description: 'View an organization profile on the Xernerx directory.',
					options: [
						{
							name: 'organization',
							description: 'Search and select a public organization (defaults to Xernerx Studios).',
							type: 'string',
							required: false,
							autocomplete: true,
						},
					],
				},
			],
		});
	}

	override async autocomplete({ interaction, focused }: SlashCommandAutocomplete) {
		try {
			const query = ((focused?.value as string) || '').trim().toLowerCase();
			const visibleOrgs = await getOrgChoices();

			const filtered = !query
				? visibleOrgs
				: visibleOrgs.filter((o) => o.name.toLowerCase().includes(query) || o.id.toLowerCase().includes(query) || o.description.toLowerCase().includes(query));

			await interaction.respond(
				filtered.slice(0, 25).map((o) => {
					const descSnippet = o.description ? ` — ${o.description}` : '';
					const rawLabel = `${o.name}${descSnippet}`;
					return {
						name: rawLabel.length > 100 ? `${rawLabel.slice(0, 97)}...` : rawLabel,
						value: o.id.slice(0, 100),
					};
				})
			);
		} catch (error) {
			console.error('Error in /organization autocomplete:', error);
			try {
				await interaction.respond([]);
			} catch {}
		}
	}

	override async exec({ interaction, options }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const clientBotUser = interaction.client.user;
		const clientBotAvatar = clientBotUser?.displayAvatarURL();
		const clientBotName = clientBotUser?.username || 'Xernerx';

		const rawOrgInput = (options as any)?.organization?.value || interaction.options.getString('organization') || '';

		try {
			const [db, accentColor] = await Promise.all([database('xernerx'), getUserAccentColor(interaction.user.id)]);
			const OrganizationModel = (db.models.organizations as any).Organization;
			const BotModel = (db.models.bots as any).Bot;
			const GuildModel = (db.models.guilds as any).Guild;
			const SettingModel = (db.models.core as any).Setting;

			let targetOrgId = rawOrgInput ? String(rawOrgInput).trim() : '';
			if (!targetOrgId && SettingModel) {
				const mainOrgSetting = await SettingModel.findOne({ id: 'main_org_id' })
					.lean()
					.catch(() => null);
				targetOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : '';
			}

			let orgDoc: any = null;
			if (targetOrgId && /^[a-f\d]{24}$/i.test(targetOrgId)) {
				orgDoc = await OrganizationModel.findById(targetOrgId)
					.lean()
					.catch(() => null);
			}
			if (!orgDoc && targetOrgId) {
				orgDoc = await OrganizationModel.findOne({
					name: { $regex: new RegExp(`^${targetOrgId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
				})
					.lean()
					.catch(() => null);
			}
			if (!orgDoc && !rawOrgInput) {
				orgDoc = await OrganizationModel.findOne({ privacy: 'public' })
					.lean()
					.catch(() => null);
			}

			if (!orgDoc) {
				const notFoundEmbed = new EmbedBuilder()
					.setColor(0xe06c75)
					.setTitle('Organization Not Found')
					.setDescription(`We couldn't find a registered Xernerx organization matching **\`${targetOrgId || 'query'}\`**.`)
					.setFooter({
						text: `${clientBotName} • Organization Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [notFoundEmbed] });
			}

			const orgId = String(orgDoc._id);
			const isOrgMember = String(orgDoc.owner) === interaction.user.id || (Array.isArray(orgDoc.members) && orgDoc.members.map(String).includes(interaction.user.id));

			if (orgDoc.privacy === 'private' && !isOrgMember) {
				const privateEmbed = new EmbedBuilder()
					.setColor(accentColor)
					.setTitle('Private Organization')
					.setDescription(`**${orgDoc.name}** is set to **private**.`)
					.setFooter({
						text: `${clientBotName} • Organization Directory`,
						iconURL: clientBotAvatar,
					})
					.setTimestamp();

				return await (interaction as any)[replyMethod]({ embeds: [privateEmbed] });
			}

			const [publicBots, publicServers] = await Promise.all([
				BotModel.find({ organization: orgId, privacy: 'public' })
					.select('id name verified')
					.lean()
					.catch(() => []),
				GuildModel.find({ organization: orgId, privacy: 'public' })
					.select('id name verified')
					.lean()
					.catch(() => []),
			]);

			const orgUrl = `https://app.xernerx.com/organizations/${orgId}`;
			const iconUrl = orgDoc.iconUrl && String(orgDoc.iconUrl).startsWith('http') ? orgDoc.iconUrl : orgDoc.icon && String(orgDoc.icon).startsWith('http') ? orgDoc.icon : undefined;

			const uniqueMembers = new Set<string>([String(orgDoc.owner), ...(Array.isArray(orgDoc.members) ? orgDoc.members.map(String) : [])].filter(Boolean));

			const overviewLines = [`• **Owner:** <@${orgDoc.owner}>`, `• **Members:** \`${uniqueMembers.size.toLocaleString()}\``, ...(orgDoc.verified ? ['• **Verified:** Yes'] : [])];

			const embed = new EmbedBuilder()
				.setColor(accentColor)
				.setTitle(orgDoc.name)
				.setURL(orgUrl)
				.setDescription(orgDoc.description || orgDoc.info || `Explore **${orgDoc.name}** on the Xernerx Organization Directory.`)
				.addFields([
					{
						name: 'Overview',
						value: overviewLines.join('\n'),
						inline: true,
					},
					{
						name: 'Ecosystem',
						value: [`• **Bots:** \`${publicBots.length}\``, `• **Servers:** \`${publicServers.length}\``].join('\n'),
						inline: true,
					},
				]);

			if (publicBots.length > 0) {
				embed.addFields([
					{
						name: `Bots (${publicBots.length})`,
						value: publicBots
							.slice(0, 8)
							.map((b: any) => `[${b.name || b.id}](https://app.xernerx.com/bots/${b.id})`)
							.join(' • '),
						inline: false,
					},
				]);
			}

			if (publicServers.length > 0) {
				embed.addFields([
					{
						name: `Servers (${publicServers.length})`,
						value: publicServers
							.slice(0, 8)
							.map((s: any) => `[${s.name || s.id}](https://app.xernerx.com/servers/${s.id})`)
							.join(' • '),
						inline: false,
					},
				]);
			}

			const links: string[] = [`[Directory](${orgUrl})`];
			if (orgDoc.links?.website) links.push(`[Website](${orgDoc.links.website})`);
			if (orgDoc.links?.invite) links.push(`[Invite](${orgDoc.links.invite})`);
			if (orgDoc.links?.support) links.push(`[Support](${orgDoc.links.support})`);
			if (orgDoc.links?.github) links.push(`[GitHub](${orgDoc.links.github})`);

			embed.addFields([
				{
					name: 'Links',
					value: links.join(' • '),
					inline: false,
				},
			]);

			if (iconUrl) {
				embed.setThumbnail(iconUrl);
			}

			embed
				.setFooter({
					text: `${clientBotName} • Organization Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [embed] });
		} catch (error) {
			console.error('Error executing /organization profile:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Organization')
				.setDescription('An error occurred while fetching organization information. Please try again shortly.')
				.setFooter({
					text: `${clientBotName} • Organization Profile`,
					iconURL: clientBotAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
