/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

const DEFAULT_SUPPORT_CHECKLIST = ['Retried the command?', 'Bot is online?', 'Have someone else try?', 'Checked if you have permissions?'];

async function fetchDiscordResource(path: string) {
	const primaryToken = process.env.DISCORD_CLIENT_TOKEN || process.env.DISCORD_BOT_TOKEN;
	const fallbackToken = process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== primaryToken ? process.env.DISCORD_BOT_TOKEN : null;

	if (!primaryToken) return null;

	try {
		let res = await fetch(`https://discord.com/api/v10${path}`, {
			headers: { Authorization: `Bot ${primaryToken}` },
			cache: 'no-store',
		});

		if (!res.ok && fallbackToken) {
			res = await fetch(`https://discord.com/api/v10${path}`, {
				headers: { Authorization: `Bot ${fallbackToken}` },
				cache: 'no-store',
			});
		}

		if (res.ok) {
			return await res.json();
		}
	} catch {}
	return null;
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const requestedGuildId = url.searchParams.get('guildId');

		const db = await database('xernerx');
		const coreModels = db.models.core as any;
		const botModels = db.models.bots as any;

		const SupportChannelModel = coreModels.SupportChannel;
		const SupportBotModel = coreModels.SupportBot;
		const SupportTicketModel = coreModels.SupportTicket;
		const SettingModel = coreModels.Setting;
		const BotProfileModel = botModels?.Bot;

		const [channels, bots, rawTickets, checklistSetting, adminServerSetting, sisterServersSetting, registeredBots] = await Promise.all([
			SupportChannelModel ? SupportChannelModel.find({}).sort({ createdAt: -1 }).lean() : [],
			SupportBotModel ? SupportBotModel.find({}).sort({ createdAt: -1 }).lean() : [],
			SupportTicketModel ? SupportTicketModel.find({}).sort({ createdAt: -1 }).limit(200).lean() : [],
			SettingModel ? SettingModel.findOne({ id: 'support_checklist' }).lean() : null,
			SettingModel ? SettingModel.findOne({ id: 'admin_server_id' }).lean() : null,
			SettingModel ? SettingModel.findOne({ id: 'sister_servers' }).lean() : null,
			BotProfileModel
				? BotProfileModel.find({})
						.select('id name avatar owners')
						.lean()
						.catch(() => [])
				: [],
		]);

		let checklist = DEFAULT_SUPPORT_CHECKLIST;
		if (checklistSetting?.value) {
			try {
				const parsed = JSON.parse(checklistSetting.value);
				if (Array.isArray(parsed) && parsed.length > 0) {
					checklist = parsed.map((item) => String(item).trim()).filter(Boolean);
				}
			} catch {}
		}

		const adminServerId = adminServerSetting?.value || '687429190165069838';
		let sisterServers: { id: string; name?: string }[] = [];
		if (sisterServersSetting?.value) {
			try {
				const parsed = JSON.parse(sisterServersSetting.value);
				if (Array.isArray(parsed)) sisterServers = parsed;
			} catch {}
		}

		const targetGuildId = requestedGuildId || adminServerId;

		const [discordGuild, discordChannelsRaw, discordRolesRaw] = targetGuildId
			? await Promise.all([fetchDiscordResource(`/guilds/${targetGuildId}`), fetchDiscordResource(`/guilds/${targetGuildId}/channels`), fetchDiscordResource(`/guilds/${targetGuildId}/roles`)])
			: [null, null, null];

		const discordChannels = Array.isArray(discordChannelsRaw)
			? discordChannelsRaw
					.filter((c: any) => [0, 5, 15].includes(c.type))
					.map((c: any) => ({
						id: c.id,
						name: c.name,
						type: c.type,
						parentId: c.parent_id || null,
					}))
			: [];

		const discordRoles = Array.isArray(discordRolesRaw)
			? discordRolesRaw
					.filter((r: any) => r.name !== '@everyone')
					.sort((a: any, b: any) => (b.position || 0) - (a.position || 0))
					.map((r: any) => ({
						id: r.id,
						name: r.name,
						color: r.color,
					}))
			: [];

		const tickets = (rawTickets || []).map((t: any) => {
			let checksObj: Record<string, boolean> = {};
			if (t.checks instanceof Map) {
				checksObj = Object.fromEntries(t.checks.entries());
			} else if (t.checks && typeof t.checks === 'object') {
				checksObj = { ...t.checks };
			}
			return {
				...t,
				checks: checksObj,
			};
		});

		const servers = [
			{
				id: adminServerId,
				name: discordGuild && targetGuildId === adminServerId && discordGuild.name ? discordGuild.name : 'Primary Server',
				isPrimary: true,
			},
			...sisterServers
				.filter((s) => s.id && s.id !== adminServerId)
				.map((s) => ({
					id: s.id,
					name: discordGuild && targetGuildId === s.id && discordGuild.name ? discordGuild.name : s.name || s.id,
					isPrimary: false,
				})),
		];

		return NextResponse.json(
			{
				channels,
				bots,
				tickets,
				checklist,
				availableBots: registeredBots || [],
				servers,
				activeGuild: {
					id: targetGuildId,
					name: discordGuild?.name || targetGuildId,
					channels: discordChannels,
					roles: discordRoles,
				},
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Failed to fetch support configuration:', error);
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { entity } = body;

		const db = await database('xernerx');
		const coreModels = db.models.core as any;
		const botModels = db.models.bots as any;

		if (entity === 'channel') {
			const { id, guild, name, role, type } = body;
			if (!id || !guild) {
				return NextResponse.json({ error: 'Channel ID and Guild ID are required.' }, { status: 400 });
			}

			let resolvedName = name || null;
			if (!resolvedName) {
				const chData = await fetchDiscordResource(`/channels/${id}`);
				if (chData?.name) resolvedName = chData.name;
			}

			const channelType = type === 'status' ? 'status' : 'support';
			const updated = await coreModels.SupportChannel.findOneAndUpdate(
				{ id: String(id).trim() },
				{
					$set: {
						id: String(id).trim(),
						guild: String(guild).trim(),
						name: resolvedName,
						role: role ? String(role).trim() : null,
						type: channelType,
					},
				},
				{ returnDocument: 'after', upsert: true }
			).lean();

			await recordAuditLog(req, {
				action: 'support.channel.upserted',
				category: 'setting',
				targetId: String(id).trim(),
				targetLabel: resolvedName ? `#${resolvedName}` : String(id).trim(),
				details: { guild, type: channelType, role: role || null },
			});

			return NextResponse.json(updated, { status: 200 });
		}

		if (entity === 'bot') {
			const { id, guild, name, avatar } = body;
			if (!id || !guild) {
				return NextResponse.json({ error: 'Bot ID and Guild ID are required.' }, { status: 400 });
			}

			const cleanBotId = String(id).trim();
			const cleanGuildId = String(guild).trim();

			let resolvedName = name || null;
			let resolvedAvatar = avatar || null;
			let owners: string[] = [];

			if (botModels?.Bot) {
				const existingBot = await botModels.Bot.findOne({ id: cleanBotId })
					.lean()
					.catch(() => null);
				if (existingBot) {
					resolvedName = resolvedName || existingBot.name || existingBot.username || null;
					resolvedAvatar = resolvedAvatar || existingBot.avatar || null;
					if (Array.isArray(existingBot.owners)) {
						owners = existingBot.owners;
					}
				}
			}

			if (!resolvedName || !resolvedAvatar) {
				const discordUser = await fetchDiscordResource(`/users/${cleanBotId}`);
				if (discordUser) {
					resolvedName = resolvedName || discordUser.global_name || discordUser.username || null;
					if (discordUser.avatar) {
						resolvedAvatar = `https://cdn.discordapp.com/avatars/${cleanBotId}/${discordUser.avatar}.${discordUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`;
					}
				}
			}

			const updated = await coreModels.SupportBot.findOneAndUpdate(
				{ id: cleanBotId, guild: cleanGuildId },
				{
					$set: {
						id: cleanBotId,
						guild: cleanGuildId,
						name: resolvedName,
						avatar: resolvedAvatar,
						owners,
					},
				},
				{ returnDocument: 'after', upsert: true }
			).lean();

			await recordAuditLog(req, {
				action: 'support.bot.added',
				category: 'setting',
				targetId: cleanBotId,
				targetLabel: resolvedName || cleanBotId,
				details: { guild: cleanGuildId },
			});

			return NextResponse.json(updated, { status: 200 });
		}

		if (entity === 'checklist') {
			const items = Array.isArray(body.items) ? body.items.map((item: any) => String(item).trim()).filter(Boolean) : [];

			if (items.length === 0) {
				return NextResponse.json({ error: 'At least one checklist item is required.' }, { status: 400 });
			}

			const updatedSetting = await coreModels.Setting.findOneAndUpdate(
				{ id: 'support_checklist' },
				{
					$set: {
						id: 'support_checklist',
						value: JSON.stringify(items),
						valueType: 'json',
						description: 'Troubleshooting checklist items presented during Discord support ticket intake.',
					},
				},
				{ returnDocument: 'after', upsert: true }
			).lean();

			await recordAuditLog(req, {
				action: 'support.checklist.updated',
				category: 'setting',
				targetId: 'support_checklist',
				targetLabel: 'Support Troubleshooting Checklist',
				details: { count: items.length },
			});

			return NextResponse.json({ checklist: items, setting: updatedSetting }, { status: 200 });
		}

		return NextResponse.json({ error: 'Invalid support entity type.' }, { status: 400 });
	} catch (error: any) {
		console.error('Failed to update support configuration:', error);
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}
