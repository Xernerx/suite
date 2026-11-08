/** @format */

import { database } from '@xernerx/lib/server';

interface CachedEntry<T> {
	data: T;
	updatedAt: number;
}

interface GuildResourceStore {
	guilds: Map<string, CachedEntry<any>>;
	channels: Map<string, CachedEntry<any[]>>;
	roles: Map<string, CachedEntry<any[]>>;
	inFlight: Map<string, Promise<any>>;
}

const FRESH_TTL_MS = 60_000; // 60 seconds

function getStore(): GuildResourceStore {
	const g = globalThis as any;
	if (!g.__xernerxGuildResourceStore) {
		g.__xernerxGuildResourceStore = {
			guilds: new Map(),
			channels: new Map(),
			roles: new Map(),
			inFlight: new Map(),
		} satisfies GuildResourceStore;
	}
	return g.__xernerxGuildResourceStore;
}

export function getCandidateDiscordTokens(): string[] {
	return Array.from(new Set([process.env.DISCORD_CLIENT_TOKEN, process.env.DISCORD_BOT_TOKEN, process.env.VIRTUE_BOT_TOKEN].map((t) => String(t || '').trim()).filter(Boolean)));
}

export async function fetchDiscordWithFallback(path: string): Promise<any | null> {
	const tokens = getCandidateDiscordTokens();
	if (tokens.length === 0) return null;

	for (const token of tokens) {
		try {
			let res = await fetch(`https://discord.com/api/v10${path}`, {
				headers: { Authorization: `Bot ${token}` },
				cache: 'no-store',
			});

			if (res.status === 429) {
				const body = (await res.json().catch(() => null)) as any;
				const retryAfterSec = Number(body?.retry_after) || 0.5;
				if (retryAfterSec <= 2.5) {
					await new Promise((resolve) => setTimeout(resolve, Math.ceil(retryAfterSec * 1000) + 50));
					res = await fetch(`https://discord.com/api/v10${path}`, {
						headers: { Authorization: `Bot ${token}` },
						cache: 'no-store',
					});
				}
			}

			if (res.ok) {
				return await res.json();
			}
		} catch {
			// Try next token
		}
	}

	return null;
}

export async function fetchGuildInfoCached(guildId: string): Promise<any | null> {
	if (!guildId) return null;
	const store = getStore();
	const now = Date.now();
	const cached = store.guilds.get(guildId);
	if (cached && now - cached.updatedAt < FRESH_TTL_MS) {
		return cached.data;
	}

	const key = `guild:${guildId}`;
	if (store.inFlight.has(key)) {
		return store.inFlight.get(key)!;
	}

	const promise = (async () => {
		try {
			const data = await fetchDiscordWithFallback(`/guilds/${encodeURIComponent(guildId)}?with_counts=false`);
			if (data && data.id) {
				store.guilds.set(guildId, { data, updatedAt: Date.now() });
				return data;
			}
			return cached?.data || null;
		} finally {
			store.inFlight.delete(key);
		}
	})();

	store.inFlight.set(key, promise);
	return promise;
}

export async function fetchGuildChannelsCached(guildId: string): Promise<any[]> {
	if (!guildId) return [];
	const store = getStore();
	const now = Date.now();
	const cached = store.channels.get(guildId);
	if (cached && cached.data.length > 0 && now - cached.updatedAt < FRESH_TTL_MS) {
		return cached.data;
	}

	const key = `channels:${guildId}`;
	if (store.inFlight.has(key)) {
		return store.inFlight.get(key)!;
	}

	const promise = (async () => {
		try {
			const raw = await fetchDiscordWithFallback(`/guilds/${encodeURIComponent(guildId)}/channels`);
			if (Array.isArray(raw) && raw.length > 0) {
				store.channels.set(guildId, { data: raw, updatedAt: Date.now() });
				return raw;
			}

			if (cached && cached.data.length > 0) {
				return cached.data;
			}

			// Fallback to Virtue DB synced channels
			const virtueDb = await database('virtue').catch(() => null);
			const VirtueGuildModel = (virtueDb?.models?.profiles as any)?.Guild;
			if (VirtueGuildModel) {
				const virtueProfile: any = await VirtueGuildModel.findOne({ id: guildId })
					.select('serverChannels')
					.lean()
					.catch(() => null);
				if (Array.isArray(virtueProfile?.serverChannels) && virtueProfile.serverChannels.length > 0) {
					store.channels.set(guildId, { data: virtueProfile.serverChannels, updatedAt: Date.now() });
					return virtueProfile.serverChannels;
				}
			}

			return [];
		} finally {
			store.inFlight.delete(key);
		}
	})();

	store.inFlight.set(key, promise);
	return promise;
}

export async function fetchGuildRolesCached(guildId: string): Promise<any[]> {
	if (!guildId) return [];
	const store = getStore();
	const now = Date.now();
	const cached = store.roles.get(guildId);
	if (cached && cached.data.length > 0 && now - cached.updatedAt < FRESH_TTL_MS) {
		return cached.data;
	}

	const key = `roles:${guildId}`;
	if (store.inFlight.has(key)) {
		return store.inFlight.get(key)!;
	}

	const promise = (async () => {
		try {
			const raw = await fetchDiscordWithFallback(`/guilds/${encodeURIComponent(guildId)}/roles`);
			if (Array.isArray(raw) && raw.length > 0) {
				store.roles.set(guildId, { data: raw, updatedAt: Date.now() });
				return raw;
			}

			if (cached && cached.data.length > 0) {
				return cached.data;
			}

			// Fallback to Virtue DB synced roles
			const virtueDb = await database('virtue').catch(() => null);
			const VirtueGuildModel = (virtueDb?.models?.profiles as any)?.Guild;
			if (VirtueGuildModel) {
				const virtueProfile: any = await VirtueGuildModel.findOne({ id: guildId })
					.select('serverRoles')
					.lean()
					.catch(() => null);
				if (Array.isArray(virtueProfile?.serverRoles) && virtueProfile.serverRoles.length > 0) {
					store.roles.set(guildId, { data: virtueProfile.serverRoles, updatedAt: Date.now() });
					return virtueProfile.serverRoles;
				}
			}

			return [];
		} finally {
			store.inFlight.delete(key);
		}
	})();

	store.inFlight.set(key, promise);
	return promise;
}
