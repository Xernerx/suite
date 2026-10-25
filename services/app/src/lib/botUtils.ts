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

export async function updateBotPresence(client: any) {
	const versionUrl = process.env.URL ? `${process.env.URL}/api/version` : `${getApiBaseUrl()}/api/version`;
	const status: any = await fetch(versionUrl)
		.then((res) => res.json())
		.catch(() => null);

	const presence: PresenceData = {
		status: 'dnd',
		activities: [],
	};

	if (!status || !status.version) {
		presence.status = 'dnd';
		presence.activities = [{ name: 'Xernerx API offline', state: 'API is offline, some features may not respond as intended.' }];
	} else {
		presence.status = 'online';
		presence.activities = [{ name: 'Xernerx API online', state: `API is online, all features are working. (v${status.version})` }];
	}

	const envUpper = process.env.ENVIRONMENT?.toUpperCase();
	if (envUpper === 'DEVELOPMENT' || envUpper === 'CANARY') {
		const envLabel = envUpper === 'CANARY' ? 'Canary' : 'Development';
		presence.activities = [
			{
				type: ActivityType.Streaming,
				name: `Xernerx API (${envLabel})`,
				url: 'https://www.youtube.com/watch?v=nOv9HorOcJo',
				state: `API (${envLabel}): ${status ? 'Online' : 'Offline'} - Version: ${status?.version || 'Unknown'}`,
			},
		];
		presence.status = 'online';
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

	const slashCommands = Array.from(client.commands?.slash?.values?.() || []).map((cmd: any) => ({
		...cmd.data.toJSON(),
		type: 1,
	}));
	const contextCommands = Array.from(client.commands?.context?.values?.() || []).map((cmd: any) => ({
		...cmd.data.toJSON(),
		description: cmd.description || '',
	}));
	const commands = [...slashCommands, ...contextCommands];

	if (xernerxToken) {
		try {
			const apiUrl = `${getApiBaseUrl()}/v1/bots/${botId}/commands`;
			const res = await fetch(apiUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${xernerxToken}`,
				},
				body: JSON.stringify(commands),
			});

			if (res.ok) {
				console.log(`[Commands] Synced ${commands.length} slash commands for ${client.user?.username || botId} to Xernerx API (${apiUrl})`);
				return;
			}
			console.warn(`[Commands] API returned ${res.status} when syncing commands for ${client.user?.username || botId} to ${apiUrl}`);
		} catch (err: any) {
			console.error(`[Commands] Failed to sync commands via API for ${client.user?.username || botId}:`, err?.message || err);
		}
	}

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
