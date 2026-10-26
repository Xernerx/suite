/** @format */

import { database } from '@xernerx/lib/core';
import { ActivityType, PresenceData } from 'discord.js';
import { getApiBaseUrl } from './api.js';

export { getApiBaseUrl };
export const DEFAULT_XERNERX_COLOR = 0x8b7cf6;

export function parseHexColor(hex?: string | null): number | null {
	if (!hex || typeof hex !== 'string') return null;
	const clean = hex.trim().replace(/^#/, '');
	if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
	const parsed = parseInt(clean, 16);
	return Number.isNaN(parsed) ? null : parsed;
}

export async function getUserAccentColor(userId?: string): Promise<number> {
	if (!userId) return DEFAULT_XERNERX_COLOR;
	try {
		const db = await database('xernerx');
		const AppearanceModel = (db.models.users as any)?.Appearance;
		if (!AppearanceModel) return DEFAULT_XERNERX_COLOR;
		const doc = await AppearanceModel.findOne({ ownerId: userId }).select('accent').lean();
		return parseHexColor(doc?.accent) ?? DEFAULT_XERNERX_COLOR;
	} catch {
		return DEFAULT_XERNERX_COLOR;
	}
}

export async function recordSelfBotUptime(client: any, status: 'online' | 'idle' | 'dnd' | 'offline', activity: string) {
	const botId = client.user?.id;
	if (!botId) return;

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any)?.Bot;
		const SettingModel = (db.models.core as any)?.Setting;
		const wsPing = typeof client.ws?.ping === 'number' && client.ws.ping > 0 ? Math.round(client.ws.ping) : null;

		if (BotModel) {
			await BotModel.findOneAndUpdate(
				{ id: botId },
				{
					$set: {
						status,
						statusUpdatedAt: new Date(),
						activity,
					},
				}
			).catch(() => null);
		}

		if (SettingModel) {
			const bucketMs = 30 * 60 * 1000;
			const currentBucket = String(Math.floor(Date.now() / bucketMs) * bucketMs);
			const cutoffTs = Number(currentBucket) - 48 * bucketMs;

			const historyDoc = await SettingModel.findOne({ id: 'system_status_history_24h' }).lean();
			let storedHistory: { services: Record<string, any>; bots: Record<string, any> } = { services: {}, bots: {} };
			if (historyDoc?.value) {
				try {
					const parsed = JSON.parse(historyDoc.value);
					if (parsed && typeof parsed === 'object') {
						storedHistory = {
							services: parsed.services || {},
							bots: parsed.bots || {},
						};
					}
				} catch {}
			}

			storedHistory.bots[botId] = storedHistory.bots[botId] || {};
			storedHistory.bots[botId][currentBucket] = { status, ping: wsPing };
			for (const tsKey of Object.keys(storedHistory.bots[botId])) {
				if (Number(tsKey) < cutoffTs) delete storedHistory.bots[botId][tsKey];
			}

			await SettingModel.findOneAndUpdate(
				{ id: 'system_status_history_24h' },
				{
					$set: {
						id: 'system_status_history_24h',
						value: JSON.stringify(storedHistory),
						valueType: 'json',
						description: 'Rolling 24-hour status & latency history for suite services and main org bots',
					},
				},
				{ upsert: true }
			).catch(() => null);
		}
	} catch (err) {
		console.error('[BotUtils] Failed to record self bot uptime:', err);
	}
}

let appPresenceIndex = 0;

export async function updateBotPresence(client: any) {
	const versionUrl = process.env.URL ? `${process.env.URL}/api/version` : `${getApiBaseUrl()}/api/version`;
	const status: any = await fetch(versionUrl)
		.then((res) => res.json())
		.catch(() => null);

	const isApiOnline = Boolean(status && status.version);
	const versionLabel = status?.version ? `v${status.version}` : 'Unknown';

	const onlineRotations: { type: ActivityType; name: string; state: string }[] = [
		{
			type: ActivityType.Watching,
			name: `Xernerx Suite ${versionLabel}`,
			state: '🟢 All systems operational • /status',
		},
		{
			type: ActivityType.Listening,
			name: 'Support & Community Hub',
			state: 'Need help? Use /faq, /docs or open a support post',
		},
		{
			type: ActivityType.Watching,
			name: 'Roadmap, Issues & Ideas',
			state: 'Track updates with /roadmap, /issues & /suggestions',
		},
		{
			type: ActivityType.Playing,
			name: `docs.xernerx.com • ${versionLabel}`,
			state: 'Explore SDK docs, API specs & /changelog',
		},
	];

	const current = onlineRotations[appPresenceIndex % onlineRotations.length];
	appPresenceIndex = (appPresenceIndex + 1) % onlineRotations.length;

	const presence: PresenceData = {
		status: isApiOnline ? 'online' : 'dnd',
		activities: isApiOnline
			? [
					{
						type: current.type,
						name: current.name,
						state: current.state,
					},
				]
			: [
					{
						type: ActivityType.Watching,
						name: 'Xernerx Platform Status',
						state: '⚠️ API unreachable — check /status for live updates',
					},
				],
	};

	const envUpper = process.env.ENVIRONMENT?.toUpperCase();
	if (envUpper === 'DEVELOPMENT' || envUpper === 'CANARY') {
		const envLabel = envUpper === 'CANARY' ? 'Canary' : 'Development';
		presence.activities = [
			{
				type: ActivityType.Streaming,
				name: `Xernerx App (${envLabel})`,
				url: 'https://www.youtube.com/watch?v=nOv9HorOcJo',
				state: isApiOnline ? `🟢 Suite ${versionLabel} (${envLabel}) • ${current.name}` : `⚠️ API (${envLabel}) Offline • Check local dev gateway`,
			},
		];
		presence.status = isApiOnline ? 'online' : 'dnd';
	}

	client.user?.setPresence(presence);

	const effectiveStatus: 'online' | 'dnd' = presence.status === 'dnd' ? 'dnd' : 'online';
	const effectiveActivity = (presence.activities?.[0] as any)?.state || (presence.activities?.[0] as any)?.name || '';
	await recordSelfBotUptime(client, effectiveStatus, effectiveActivity);

	setTimeout(() => updateBotPresence(client), 60_000);
}

export async function syncBotCommands(client: any, xernerxToken?: string) {
	const botId = client.user?.id;
	if (!botId) return;

	// When a Xernerx API token is configured, the loaded `XernerxCommands` extension (@xernerx/commands)
	// automatically posts and synchronizes commands via `/v1/bots/:id/commands`.
	if (xernerxToken) return;

	const slashCommands = Array.from(client.commands?.slash?.values?.() || []).map((cmd: any) => ({
		...cmd.data.toJSON(),
		type: 1,
	}));
	const contextCommands = Array.from(client.commands?.context?.values?.() || []).map((cmd: any) => ({
		...cmd.data.toJSON(),
		description: cmd.description || '',
	}));
	const commands = [...slashCommands, ...contextCommands];

	try {
		const db = await database('xernerx');
		const CommandModel = (db.models.bots as any)?.Command;
		if (CommandModel) {
			await CommandModel.deleteMany({ botId });
			const insertPayload = commands.map((cmd: any) => ({
				botId,
				commandId: cmd.id || cmd.name,
				name: cmd.name,
				description: cmd.description,
				type: cmd.type || 1,
				body: cmd,
			}));
			if (insertPayload.length > 0) {
				await CommandModel.insertMany(insertPayload);
				console.log(`[Commands] Synced ${insertPayload.length} commands for ${client.user?.username || botId} directly to database.`);
			}
			const BotModel = (db.models.bots as any)?.Bot;
			if (BotModel) {
				await BotModel.updateOne({ id: botId }, { $set: { commands } }).catch(() => null);
			}
		}
	} catch (dbErr: any) {
		console.error('[Commands] Direct database sync fallback failed:', dbErr?.message || dbErr);
	}
}
