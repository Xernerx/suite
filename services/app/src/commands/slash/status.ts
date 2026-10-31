/** @format */

import { database } from '@xernerx/lib/core';
import { SlashCommandBuilder, type SlashCommandOptions } from '@xernerx/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getApiBaseUrl, getUserAccentColor } from '../../lib/botUtils.js';

const SUITE_SERVICES = [
	{ id: 'www', name: 'Website', domain: 'xernerx.com' },
	{ id: 'app', name: 'App', domain: 'app.xernerx.com' },
	{ id: 'portal', name: 'Portal', domain: 'portal.xernerx.com' },
	{ id: 'account', name: 'Account', domain: 'account.xernerx.com' },
	{ id: 'store', name: 'Store', domain: 'store.xernerx.com' },
	{ id: 'info', name: 'Info', domain: 'info.xernerx.com' },
	{ id: 'docs', name: 'Docs', domain: 'docs.xernerx.com' },
	{ id: 'admin', name: 'Admin', domain: 'admin.xernerx.com' },
	{ id: 'hosting', name: 'Hosting', domain: 'hosting.xernerx.com' },
	{ id: 'haste', name: 'Haste', domain: 'haste.xernerx.com' },
	{ id: 'api', name: 'API', domain: 'api.xernerx.com' },
	{ id: 'cdn', name: 'CDN', domain: 'cdn.xernerx.com' },
] as const;

function formatServiceStatus(status?: string): string {
	switch (status) {
		case 'operational':
			return '🟢 Operational';
		case 'degraded':
			return '🟡 Degraded';
		case 'down':
			return '🔴 Outage';
		default:
			return '🟢 Operational';
	}
}

function formatBotStatus(status?: string): string {
	switch (status) {
		case 'online':
			return '🟢 Online';
		case 'idle':
			return '🌙 Idle';
		case 'dnd':
			return '⛔ Do Not Disturb';
		default:
			return '⚫ Offline';
	}
}

export async function buildStatusMessage(client: Client, requesterUserId?: string) {
	const botUser = client.user;
	const botAvatar = botUser?.displayAvatarURL({ size: 256 });
	const botName = botUser?.username || 'Xernerx App';

	const [db, accentColor, apiHistory] = await Promise.all([
		database('xernerx'),
		getUserAccentColor(requesterUserId),
		fetch(`${getApiBaseUrl()}/info/status/history`, {
			headers: { Accept: 'application/json' },
		})
			.then((r) => (r.ok ? (r.json() as Promise<any>) : null))
			.catch(() => null),
	]);

	const SettingModel = (db.models.core as any).Setting;
	const BotModel = (db.models.bots as any).Bot;

	const [settingDoc, mainOrgSetting] = await Promise.all([
		SettingModel
			? SettingModel.findOne({ id: 'system_status_history_24h' })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		SettingModel
			? SettingModel.findOne({ id: 'main_org_id' })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
	]);

	let storedServices: Record<string, Record<string, { status: string; ping: number | null }>> = {};
	if (settingDoc?.value) {
		try {
			const parsed = JSON.parse(settingDoc.value);
			if (parsed?.services) storedServices = parsed.services;
		} catch {}
	}

	const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
	const orgBots =
		mainOrgId && BotModel
			? await BotModel.find({ organization: mainOrgId, privacy: 'public' })
					.select('id name status activity')
					.lean()
					.catch(() => [])
			: [];

	let degradedCount = 0;
	const serviceLines = SUITE_SERVICES.map((svc) => {
		const apiSeries: any[] | undefined = apiHistory?.services?.[svc.id];
		let latestStatus = 'operational';
		let latestPing: number | null = null;

		if (Array.isArray(apiSeries) && apiSeries.length > 0) {
			const nonEmpty = [...apiSeries].reverse().find((pt) => pt && pt.status && pt.status !== 'empty');
			if (nonEmpty) {
				latestStatus = nonEmpty.status;
				latestPing = typeof nonEmpty.ping === 'number' ? nonEmpty.ping : null;
			}
		} else if (storedServices[svc.id]) {
			const keys = Object.keys(storedServices[svc.id]).sort((a, b) => Number(b) - Number(a));
			if (keys.length > 0) {
				const pt = storedServices[svc.id][keys[0]];
				if (pt?.status) latestStatus = pt.status;
				if (typeof pt?.ping === 'number') latestPing = pt.ping;
			}
		}

		if (latestStatus !== 'operational') degradedCount++;
		const pingSuffix = latestPing !== null ? ` • \`${latestPing}ms\`` : '';
		return `**[${svc.name}](https://${svc.domain})** — ${formatServiceStatus(latestStatus)}${pingSuffix}`;
	});

	const botLines = orgBots.map((b: any) => {
		const statusLabel = formatBotStatus(b.status);
		const actSuffix = b.activity ? ` — *${b.activity}*` : '';
		return `**[${b.name || b.id}](https://app.xernerx.com/bots/${b.id})** — ${statusLabel}${actSuffix}`;
	});

	const wsPing = Math.max(1, client.ws.ping);
	const overallSummary =
		degradedCount === 0
			? `🟢 **All Systems Operational** — All **${SUITE_SERVICES.length}** Xernerx web applications and gateways are online.\nGateway Heartbeat: \`${wsPing}ms\` • Updated <t:${Math.floor(Date.now() / 1000)}:R>`
			: `🟡 **Partial Degradation** — **${SUITE_SERVICES.length - degradedCount} / ${SUITE_SERVICES.length}** services operational. Visit [info.xernerx.com/status](https://info.xernerx.com/status) for live incident telemetry.`;

	const embed = new EmbedBuilder()
		.setColor(degradedCount === 0 ? accentColor : 0xf59e0b)
		.setTitle('Xernerx Suite • Live System Status')
		.setURL('https://info.xernerx.com/status')
		.setDescription(overallSummary)
		.addFields([
			{
				name: 'Web Applications',
				value: serviceLines.slice(0, 6).join('\n'),
				inline: true,
			},
			{
				name: 'Platform & Infrastructure',
				value: serviceLines.slice(6).join('\n'),
				inline: true,
			},
		]);

	if (botAvatar) {
		embed.setThumbnail(botAvatar);
	}

	if (botLines.length > 0) {
		embed.addFields([
			{
				name: 'Official Ecosystem Bots',
				value: botLines.join('\n'),
				inline: false,
			},
		]);
	}

	embed
		.setFooter({
			text: `${botName} • System Telemetry`,
			iconURL: botAvatar,
		})
		.setTimestamp();

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId('status:refresh').setLabel('Refresh Telemetry').setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setLabel('Live Status Hub').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/status'),
		new ButtonBuilder().setLabel('Report an Issue').setStyle(ButtonStyle.Link).setURL('https://info.xernerx.com/bugs')
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

export default class StatusCommand extends SlashCommandBuilder {
	constructor() {
		super('status', {
			name: 'status',
			description: 'View live operational status and latency across Xernerx Suite services and bots.',
			defer: true,
			deploy: {
				global: false,
				guilds: ['687429190165069838', '784094726432489522'],
			},
		});
	}

	override async exec({ interaction }: SlashCommandOptions) {
		const replyMethod = interaction.deferred ? 'editReply' : 'reply';
		const botUser = interaction.client.user;
		const botAvatar = botUser?.displayAvatarURL();
		const botName = botUser?.username || 'Xernerx App';

		try {
			const payload = await buildStatusMessage(interaction.client, interaction.user.id);
			await (interaction as any)[replyMethod](payload);
		} catch (error) {
			console.error('Error executing /status:', error);
			const errEmbed = new EmbedBuilder()
				.setColor(0xe06c75)
				.setTitle('Failed to Load Status')
				.setDescription('An error occurred while checking system status. View live telemetry at [info.xernerx.com/status](https://info.xernerx.com/status).')
				.setFooter({
					text: `${botName} • System Status`,
					iconURL: botAvatar,
				})
				.setTimestamp();

			await (interaction as any)[replyMethod]({ embeds: [errEmbed] });
		}
	}
}
