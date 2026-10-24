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

	if (process.env.ENVIRONMENT?.toUpperCase() === 'DEVELOPMENT') {
		presence.activities = [
			{
				type: ActivityType.Streaming,
				name: 'Xernerx API (Development)',
				url: 'https://www.youtube.com/watch?v=nOv9HorOcJo',
				state: `API: ${status ? 'Online' : 'Offline'} - Version: ${status?.version || 'Unknown'}`,
			},
		];
		presence.status = 'online';
	}

	client.user?.setPresence(presence);

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
