/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface BotPresenceInfo {
	status: 'online' | 'idle' | 'dnd' | 'offline';
	activity: string;
}

let cachedPresenceMap: Record<string, BotPresenceInfo> | null = null;
let cachedPresenceAt = 0;
let activePresenceProbe: Promise<Record<string, BotPresenceInfo>> | null = null;
const PRESENCE_CACHE_TTL_MS = 45_000;

async function queryXernerxBotGatewayPresences(botIds: string[], preferredGuildId?: string | null): Promise<Record<string, BotPresenceInfo>> {
	const now = Date.now();
	if (cachedPresenceMap && now - cachedPresenceAt < PRESENCE_CACHE_TTL_MS) {
		return cachedPresenceMap;
	}
	if (activePresenceProbe) {
		return activePresenceProbe;
	}

	const token = process.env.DISCORD_CLIENT_TOKEN;
	if (!token || botIds.length === 0 || typeof WebSocket === 'undefined') {
		return {};
	}

	activePresenceProbe = new Promise<Record<string, BotPresenceInfo>>((resolve) => {
		const result: Record<string, BotPresenceInfo> = {};
		for (const id of botIds) {
			result[id] = { status: 'offline', activity: '' };
		}

		let settled = false;
		let ws: WebSocket | null = null;

		const finish = () => {
			if (settled) return;
			settled = true;
			try {
				ws?.close();
			} catch {}
			cachedPresenceMap = result;
			cachedPresenceAt = Date.now();
			activePresenceProbe = null;
			resolve(result);
		};

		const timeout = setTimeout(finish, 2800);

		try {
			ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
			let pendingChunks = 0;
			let receivedAnyChunk = false;

			const recordPresence = (p: any) => {
				const uid = p?.user?.id;
				if (!uid || !botIds.includes(uid)) return;
				const raw = p.status;
				const mapped: 'online' | 'idle' | 'dnd' | 'offline' = raw === 'online' || raw === 'idle' || raw === 'dnd' ? raw : 'offline';
				const act = p.activities?.[0]?.state || p.activities?.[0]?.name || '';
				if (mapped !== 'offline' || result[uid]?.status === 'offline') {
					result[uid] = { status: mapped, activity: act };
				}
			};

			ws.onmessage = (ev) => {
				try {
					const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
					if (msg.op === 10) {
						ws?.send(
							JSON.stringify({
								op: 2,
								d: {
									token,
									intents: (1 << 0) | (1 << 1) | (1 << 8),
									properties: { os: 'linux', browser: 'xernerx-status', device: 'xernerx-status' },
								},
							})
						);
					} else if (msg.t === 'READY') {
						const selfId = msg.d?.user?.id;
						if (selfId && botIds.includes(selfId)) {
							result[selfId] = { status: 'online', activity: 'Xernerx API online' };
						}
						if (Array.isArray(msg.d?.guilds) && msg.d.guilds.length === 0) {
							clearTimeout(timeout);
							finish();
						}
					} else if (msg.t === 'GUILD_CREATE') {
						const gId = msg.d?.id;
						if (Array.isArray(msg.d?.presences)) {
							for (const p of msg.d.presences) recordPresence(p);
						}
						if (gId && (!preferredGuildId || gId === preferredGuildId || pendingChunks < 3)) {
							pendingChunks++;
							ws?.send(
								JSON.stringify({
									op: 8,
									d: {
										guild_id: gId,
										user_ids: botIds,
										presences: true,
									},
								})
							);
						}
					} else if (msg.t === 'GUILD_MEMBERS_CHUNK') {
						receivedAnyChunk = true;
						if (Array.isArray(msg.d?.presences)) {
							for (const p of msg.d.presences) recordPresence(p);
						}
						pendingChunks = Math.max(0, pendingChunks - 1);
						if ((preferredGuildId && msg.d?.guild_id === preferredGuildId) || (receivedAnyChunk && pendingChunks === 0)) {
							clearTimeout(timeout);
							finish();
						}
					}
				} catch {}
			};

			ws.onerror = () => {
				clearTimeout(timeout);
				finish();
			};
			ws.onclose = () => {
				clearTimeout(timeout);
				finish();
			};
		} catch {
			clearTimeout(timeout);
			finish();
		}
	});

	return activePresenceProbe;
}

export async function GET(req: NextRequest) {
	try {
		const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
		if (forceRefresh) {
			cachedPresenceMap = null;
			cachedPresenceAt = 0;
		}

		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;
		const BotModel = (models.bots as any).Bot;
		const StatModel = (models.bots as any).Stat;

		const [mainOrgSetting, adminServerSetting] = await Promise.all([SettingModel.findOne({ id: 'main_org_id' }).lean(), SettingModel.findOne({ id: 'admin_server_id' }).lean()]);

		const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;
		const adminServerId = adminServerSetting?.value ? String(adminServerSetting.value) : null;

		if (!mainOrgId || !BotModel) {
			return NextResponse.json({ mainOrgId: null, bots: [] });
		}

		const orgBots = await BotModel.find({ organization: mainOrgId, privacy: 'public' }).lean();
		if (!orgBots.length) {
			return NextResponse.json({ mainOrgId, bots: [] });
		}

		const botIds = orgBots.map((b: any) => String(b.id)).filter(Boolean);
		const now = Date.now();
		const needsLiveSync = forceRefresh || orgBots.some((b: any) => !b.statusUpdatedAt || now - new Date(b.statusUpdatedAt).getTime() > 90_000);

		const livePresences = needsLiveSync ? await queryXernerxBotGatewayPresences(botIds, adminServerId) : {};
		const token = process.env.DISCORD_CLIENT_TOKEN;

		const bots = await Promise.all(
			orgBots.map(async (bot: any) => {
				const botId = String(bot.id);
				let name = bot.name || botId;
				let avatarUrl: string | null =
					bot.avatar && String(bot.avatar).startsWith('http')
						? bot.avatar
						: bot.avatar
							? `https://cdn.discordapp.com/avatars/${botId}/${bot.avatar}.${String(bot.avatar).startsWith('a_') ? 'gif' : 'png'}?size=256`
							: null;

				const [latestStat, discordUser] = await Promise.all([
					StatModel
						? StatModel.findOne({ id: botId })
								.sort({ timestamp: -1 })
								.lean()
								.catch(() => null)
						: Promise.resolve(null),
					token
						? fetch(`https://discord.com/api/v10/users/${botId}`, {
								headers: { Authorization: `Bot ${token}` },
								next: { revalidate: 3600 },
							})
								.then((r) => (r.ok ? r.json() : null))
								.catch(() => null)
						: Promise.resolve(null),
				]);

				if (discordUser) {
					name = discordUser.global_name || discordUser.username || name;
					if (discordUser.avatar) {
						avatarUrl = `https://cdn.discordapp.com/avatars/${botId}/${discordUser.avatar}.${discordUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`;
					}
				}

				const liveInfo = livePresences[botId];
				const resolvedStatus: 'online' | 'idle' | 'dnd' | 'offline' = liveInfo?.status || (bot.status === 'online' || bot.status === 'idle' || bot.status === 'dnd' ? bot.status : 'offline');
				const resolvedActivity: string = liveInfo?.activity ?? bot.activity ?? '';
				const resolvedUpdatedAt = liveInfo ? new Date() : bot.statusUpdatedAt ? new Date(bot.statusUpdatedAt) : null;

				if (liveInfo) {
					await BotModel.updateOne(
						{ id: botId },
						{
							$set: {
								name,
								...(discordUser?.avatar ? { avatar: discordUser.avatar } : {}),
								status: resolvedStatus,
								activity: resolvedActivity,
								statusUpdatedAt: resolvedUpdatedAt,
							},
						}
					).catch(() => null);
				}

				return {
					id: botId,
					name,
					avatarUrl,
					verified: Boolean(bot.verified),
					status: resolvedStatus,
					activity: resolvedActivity || null,
					statusUpdatedAt: resolvedUpdatedAt ? resolvedUpdatedAt.toISOString() : null,
					guildCount: latestStat?.guildCount ?? 0,
					userCount: latestStat?.userCount ?? 0,
					shardCount: latestStat?.shardCount ?? 1,
				};
			})
		);

		return NextResponse.json({
			mainOrgId,
			bots,
		});
	} catch (err) {
		console.error('Failed to fetch main org bot statuses:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
