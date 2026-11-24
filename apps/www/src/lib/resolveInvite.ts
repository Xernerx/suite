/** @format */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { database, resetDatabaseConnection } from '@xernerx/lib/server';
import { findDefaultOfficialInvite, type DefaultOfficialInvite } from './defaultOfficialInvites';

export type InviteHostEnv = 'public' | 'canary' | 'dev';

export const INVITE_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export interface ResolvedInviteResult {
	status: 'found' | 'not_found' | 'unavailable';
	invite: any | null;
	botDoc: any | null;
	fallbackInvite: DefaultOfficialInvite | null;
	source: 'db' | 'api' | 'default' | 'none';
}

export interface ResolvedDiscordBotProfile {
	name: string | null;
	avatarUrl: string | null;
}

class UncacheableInviteOutcome extends Error {
	constructor(public readonly result: ResolvedInviteResult) {
		super(`Uncacheable invite outcome: ${result.status} (${result.source})`);
	}
}

class UncacheableDiscordProfileError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export function resolveInviteHostEnv(host: string | null | undefined): InviteHostEnv {
	const h = (host || '').toLowerCase();
	if (h.includes('.dev.xernerx.com') || h.startsWith('localhost:') || h.startsWith('127.0.0.1:')) return 'dev';
	if (h.includes('.canary.xernerx.com')) return 'canary';
	return 'public';
}

export function resolveAppBaseUrlForEnv(env: InviteHostEnv): string {
	if (env === 'dev') return 'https://app.dev.xernerx.com';
	if (env === 'canary') return 'https://app.canary.xernerx.com';
	return 'https://app.xernerx.com';
}

function resolveApiBaseUrlForEnv(env: InviteHostEnv): string {
	if (env === 'dev') {
		return process.env.ENVIRONMENT?.toLowerCase() === 'development' ? 'http://127.0.0.1:4001' : 'https://api.dev.xernerx.com';
	}
	if (env === 'canary') return 'https://api.canary.xernerx.com';
	return 'https://api.xernerx.com';
}

function resolveWwwOriginForEnv(env: InviteHostEnv): string {
	if (env === 'dev') return 'https://www.dev.xernerx.com';
	if (env === 'canary') return 'https://www.canary.xernerx.com';
	return 'https://www.xernerx.com';
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPlainJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
			}),
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

async function queryInviteFromDatabase(trimmed: string, fallbackInvite: DefaultOfficialInvite | null): Promise<{ found: boolean; invite: any | null; botDoc: any | null }> {
	const db = await database('xernerx');
	const AppInviteModel = db.models.core?.AppInvite;
	const BotModel = (db.models.bots as any)?.Bot;

	if (!AppInviteModel) {
		throw new Error('AppInvite model is not initialized.');
	}

	// Fast indexed exact-ID match first
	let foundInvite: any = await AppInviteModel.findOne({ id: trimmed }).lean();
	let foundBot: any = null;

	// Case-insensitive, alias, clientId, and Bot vanitySlug fallbacks
	if (!foundInvite) {
		const candidateIds = new Set<string>([trimmed.toLowerCase()]);
		if (fallbackInvite) {
			candidateIds.add(fallbackInvite.id.toLowerCase());
			candidateIds.add(fallbackInvite.vanitySlug.toLowerCase());
			for (const alias of fallbackInvite.aliases) {
				candidateIds.add(alias.toLowerCase());
			}
		}

		const orClauses: Record<string, any>[] = [{ id: { $in: Array.from(candidateIds) } }, { id: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' } }];

		if (fallbackInvite?.clientId) {
			orClauses.push({ clientId: fallbackInvite.clientId });
		}
		if (/^\d{17,22}$/.test(trimmed)) {
			orClauses.push({ clientId: trimmed });
		}

		foundInvite = await AppInviteModel.findOne({ $or: orClauses }).lean();
	}

	if (!foundInvite && BotModel) {
		const matchedBot = await BotModel.findOne({ vanitySlug: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' } })
			.select('id name avatar description vanitySlug discordCache')
			.lean()
			.catch(() => null);
		if (matchedBot?.id) {
			foundInvite = await AppInviteModel.findOne({ clientId: String(matchedBot.id) }).lean();
			if (foundInvite) {
				foundBot = matchedBot;
			}
		}
	}

	if (!foundInvite) {
		return { found: false, invite: null, botDoc: null };
	}

	if (!foundBot && BotModel && foundInvite.clientId) {
		foundBot = await BotModel.findOne({ id: String(foundInvite.clientId) })
			.select('name avatar description vanitySlug discordCache')
			.lean()
			.catch(() => null);
	}

	return { found: true, invite: foundInvite, botDoc: foundBot };
}

async function fetchInviteFromApiFallback(
	trimmed: string,
	fallbackInvite: DefaultOfficialInvite | null,
	hostEnv: InviteHostEnv
): Promise<{ reachable: boolean; invite: any | null; botDoc: any | null }> {
	try {
		const res = await fetch(`${resolveApiBaseUrlForEnv(hostEnv)}/secure/invites`, {
			headers: {
				Origin: resolveWwwOriginForEnv(hostEnv),
				Accept: 'application/json',
			},
			signal: AbortSignal.timeout(4500),
			cache: 'no-store',
		});

		if (!res.ok) {
			return { reachable: false, invite: null, botDoc: null };
		}

		const data = await res.json();
		if (!Array.isArray(data)) {
			return { reachable: false, invite: null, botDoc: null };
		}

		const lower = trimmed.toLowerCase();
		const candidateKeys = new Set<string>([lower]);
		if (fallbackInvite) {
			candidateKeys.add(fallbackInvite.id.toLowerCase());
			candidateKeys.add(fallbackInvite.clientId.toLowerCase());
			candidateKeys.add(fallbackInvite.vanitySlug.toLowerCase());
			for (const alias of fallbackInvite.aliases) {
				candidateKeys.add(alias.toLowerCase());
			}
		}

		const matched = data.find((item: any) => {
			const itemId = String(item?.id || '')
				.trim()
				.toLowerCase();
			const itemClientId = String(item?.clientId || '')
				.trim()
				.toLowerCase();
			const itemVanity = String(item?.botVanitySlug || '')
				.trim()
				.toLowerCase();
			return (itemId && candidateKeys.has(itemId)) || (itemClientId && candidateKeys.has(itemClientId)) || (itemVanity && candidateKeys.has(itemVanity));
		});

		if (!matched) {
			return { reachable: true, invite: null, botDoc: null };
		}

		return {
			reachable: true,
			invite: matched,
			botDoc: {
				name: matched.botName || matched.name,
				avatar: matched.botAvatar || null,
				description: matched.description,
				vanitySlug: matched.botVanitySlug || null,
			},
		};
	} catch (err: any) {
		console.warn(`[invites] API fallback lookup failed for "${trimmed}":`, err?.message || err);
		return { reachable: false, invite: null, botDoc: null };
	}
}

async function resolveInviteLive(trimmed: string, hostEnv: InviteHostEnv): Promise<ResolvedInviteResult> {
	const fallbackInvite = findDefaultOfficialInvite(trimmed);

	// Tier 1: Direct MongoDB lookup with one automatic stale-connection reset & retry
	if (process.env.MONGO_XERNERX) {
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				const timeoutMs = attempt === 1 ? 6500 : 4500;
				const dbRes = await withTimeout(queryInviteFromDatabase(trimmed, fallbackInvite), timeoutMs, `MongoDB invite lookup (attempt ${attempt})`);

				if (dbRes.found && dbRes.invite) {
					const matchedDefault = fallbackInvite || findDefaultOfficialInvite(dbRes.invite.id) || findDefaultOfficialInvite(dbRes.invite.clientId);
					return toPlainJson({
						status: 'found',
						invite: dbRes.invite,
						botDoc: dbRes.botDoc,
						fallbackInvite: matchedDefault,
						source: 'db',
					});
				}

				// Query succeeded cleanly and confirmed the document is absent from MongoDB
				if (fallbackInvite) {
					return { status: 'found', invite: fallbackInvite, botDoc: null, fallbackInvite, source: 'default' };
				}
				return { status: 'not_found', invite: null, botDoc: null, fallbackInvite: null, source: 'db' };
			} catch (err: any) {
				if (attempt === 1) {
					console.warn(`[invites] Primary MongoDB lookup failed for "${trimmed}", resetting pool and retrying:`, err?.message || err);
					await resetDatabaseConnection('xernerx');
				} else {
					console.error(`[invites] Retry MongoDB lookup failed for "${trimmed}":`, err?.message || err);
				}
			}
		}
	}

	// Tier 2: Warm API gateway fallback when direct MongoDB is unavailable or unconfigured
	const apiRes = await fetchInviteFromApiFallback(trimmed, fallbackInvite, hostEnv);
	if (apiRes.invite) {
		const matchedDefault = fallbackInvite || findDefaultOfficialInvite(apiRes.invite.id) || findDefaultOfficialInvite(apiRes.invite.clientId);
		return toPlainJson({
			status: 'found',
			invite: apiRes.invite,
			botDoc: apiRes.botDoc,
			fallbackInvite: matchedDefault,
			source: 'api',
		});
	}

	if (apiRes.reachable) {
		if (fallbackInvite) {
			return { status: 'found', invite: fallbackInvite, botDoc: null, fallbackInvite, source: 'default' };
		}
		return { status: 'not_found', invite: null, botDoc: null, fallbackInvite: null, source: 'api' };
	}

	// Tier 3: Static official invite defaults if both DB and API are transiently unreachable
	if (fallbackInvite) {
		return { status: 'found', invite: fallbackInvite, botDoc: null, fallbackInvite, source: 'default' };
	}

	// Both backends failed transiently — never emit a false 404
	return { status: 'unavailable', invite: null, botDoc: null, fallbackInvite: null, source: 'none' };
}

export async function resolveInvite(rawSlug: string, hostEnv: InviteHostEnv = 'public'): Promise<ResolvedInviteResult> {
	const trimmed = String(rawSlug || '').trim();
	if (!trimmed) {
		return { status: 'not_found', invite: null, botDoc: null, fallbackInvite: null, source: 'none' };
	}

	const cacheKeySlug = trimmed.toLowerCase();

	// 24h cross-request Data Cache (backed by Vercel Data Cache across all containers in the region).
	// Only confirmed live DB/API hits are cached; not_found, unavailable, and static default fallbacks
	// throw UncacheableInviteOutcome so transient errors or typos are never pinned for 24 hours.
	const cachedLookup = unstable_cache(
		async () => {
			const live = await resolveInviteLive(trimmed, hostEnv);
			if (live.status === 'found' && (live.source === 'db' || live.source === 'api')) {
				return live;
			}
			throw new UncacheableInviteOutcome(live);
		},
		['www-invite-resolve-v1', hostEnv, cacheKeySlug],
		{
			revalidate: INVITE_CACHE_TTL_SECONDS,
			tags: ['www-invites', `www-invite:${cacheKeySlug}`],
		}
	);

	try {
		return await cachedLookup();
	} catch (err) {
		if (err instanceof UncacheableInviteOutcome) {
			return err.result;
		}
		console.warn(`[invites] Data cache error for "${trimmed}", falling back to live lookup:`, (err as any)?.message || err);
		return resolveInviteLive(trimmed, hostEnv);
	}
}

export const resolveInviteCached = cache(resolveInvite);

export async function resolveDiscordBotProfile(clientId: string): Promise<ResolvedDiscordBotProfile | null> {
	const cleanId = String(clientId || '').trim();
	if (!cleanId) return null;

	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
	if (tokens.length === 0) return null;

	const cachedDiscordLookup = unstable_cache(
		async (): Promise<ResolvedDiscordBotProfile> => {
			for (const token of tokens) {
				try {
					const res = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(cleanId)}`, {
						headers: { Authorization: `Bot ${token}` },
						signal: AbortSignal.timeout(2500),
						cache: 'no-store',
					});
					if (res.ok) {
						const data = await res.json();
						return {
							name: data.global_name || data.username || null,
							avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${cleanId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512` : null,
						};
					}
				} catch {}
			}
			throw new UncacheableDiscordProfileError(`Unable to fetch Discord profile for ${cleanId}`);
		},
		['www-invite-discord-bot-v1', cleanId],
		{
			revalidate: INVITE_CACHE_TTL_SECONDS,
			tags: ['www-invites', `www-invite-bot:${cleanId}`],
		}
	);

	try {
		return await cachedDiscordLookup();
	} catch (err) {
		if (err instanceof UncacheableDiscordProfileError) {
			return null;
		}
		return null;
	}
}

export const resolveDiscordBotProfileCached = cache(resolveDiscordBotProfile);
