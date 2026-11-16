/** @format */

export interface PresetAction {
	id: string;
	label: string;
	service: 'xernerx' | 'virtue';
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	action: string;
	body: Record<string, any>;
}

export interface WebsocketDispatchHistoryItem {
	id: string;
	service: string;
	method: string;
	action: string;
	bodyText: string;
	responseJson: string;
	latencyMs: number;
	mode: 'live' | 'simulated';
}

export const PRESET_ACTIONS: PresetAction[] = [
	{ id: 'ping', label: 'ping', service: 'xernerx', method: 'GET', action: 'ping', body: { echo: 'heartbeat' } },
	{ id: 'stats', label: 'stats', service: 'xernerx', method: 'POST', action: 'bots', body: { id: '102938475612345678', guildCount: 420, shardCount: 2, userCount: 84500 } },
	{ id: 'guilds', label: 'guilds', service: 'virtue', method: 'GET', action: 'guilds', body: { id: '102938475612345678' } },
	{ id: 'levels', label: 'levels', service: 'xernerx', method: 'GET', action: 'levels', body: { ownerId: '482513687417061376' } },
	{ id: 'users', label: 'users', service: 'xernerx', method: 'GET', action: 'users', body: { id: '482513687417061376' } },
	{ id: 'credits', label: 'credits', service: 'xernerx', method: 'PATCH', action: 'credits', body: { ownerId: '482513687417061376', streak: 7 } },
];

export function buildSimulatedResponse(reqId: string, service: string, method: string, action: string, parsedBody: Record<string, any>) {
	const nowIso = new Date().toISOString();

	if (action === 'ping') {
		return {
			id: reqId,
			ok: true,
			status: 200,
			service,
			action: 'ping',
			pong: true,
			echo: parsedBody.echo || 'heartbeat',
			timestamp: nowIso,
		};
	}

	if (service === 'virtue' && action === 'guilds') {
		return {
			id: reqId,
			_id: '64e0a7bc9e1234567890abcd',
			id_guild: parsedBody.id || '102938475612345678',
			mode: parsedBody.mode || 'default',
			levelUp: parsedBody.levelUp ?? true,
			levelMessage: parsedBody.levelMessage || 'GG [@mention], you advanced to level [@level]!',
			cycles: { daily: true, weekly: true, monthly: false },
			updatedAt: nowIso,
		};
	}

	if (action === 'levels' || action === 'globalLevel') {
		return {
			id: reqId,
			ownerId: parsedBody.ownerId || parsedBody.id || '482513687417061376',
			level: 24,
			xp: 18450,
			nextLevelXp: 20000,
			updatedAt: nowIso,
		};
	}

	if (action === 'credits') {
		return {
			id: reqId,
			ownerId: parsedBody.ownerId || parsedBody.id || '482513687417061376',
			balance: 4250,
			streak: parsedBody.streak ?? 7,
			updatedAt: nowIso,
		};
	}

	if (action === 'bots' || action === 'stats') {
		return {
			id: reqId,
			botId: parsedBody.id || '102938475612345678',
			guildCount: parsedBody.guildCount ?? 420,
			shardCount: parsedBody.shardCount ?? 2,
			userCount: parsedBody.userCount ?? 84500,
			syncedAt: nowIso,
		};
	}

	return {
		id: reqId,
		ok: true,
		service,
		method,
		action: action || 'default',
		data: {
			...parsedBody,
			_simulated: true,
			processedAt: nowIso,
		},
	};
}
