/** @format */

const liveDiscordCache = new Map<string, { data: any; expiresAt: number }>();
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;

export function isDiscordManagedMediaValue(val: unknown): boolean {
	if (val === undefined || val === null || val === '') return true;
	const str = String(val).trim();
	if (!str) return true;
	if (!str.startsWith('http://') && !str.startsWith('https://') && !str.startsWith('/')) {
		return true;
	}
	return str.includes('cdn.discordapp.com/') || str.includes('media.discordapp.net/');
}

export function buildDiscordAvatarUrl(id: string, avatarHash?: string | null, size = 1024): string | null {
	if (!id || !avatarHash) return null;
	const clean = String(avatarHash).trim();
	if (!clean) return null;
	if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
	const ext = clean.startsWith('a_') ? 'gif' : 'png';
	return `https://cdn.discordapp.com/avatars/${id}/${clean}.${ext}?size=${size}`;
}

export function buildDiscordBannerUrl(id: string, bannerHash?: string | null, size = 1024): string | null {
	if (!id || !bannerHash) return null;
	const clean = String(bannerHash).trim();
	if (!clean) return null;
	if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
	const ext = clean.startsWith('a_') ? 'gif' : 'png';
	return `https://cdn.discordapp.com/banners/${id}/${clean}.${ext}?size=${size}`;
}

export function extractDiscordHashFromUrl(urlOrHash?: unknown): string | null {
	if (!urlOrHash || typeof urlOrHash !== 'string') return null;
	const str = urlOrHash.trim();
	if (!str) return null;
	if (!str.startsWith('http://') && !str.startsWith('https://')) return str;
	const match = str.match(/\/(?:avatars|banners)\/\d+\/([a-zA-Z0-9_]+)\./);
	return match ? match[1] : null;
}

export function isBotDiscordCacheStale(bot: any, maxAgeMs = 60 * 60 * 1000): boolean {
	const dc = bot?.discord || bot?.discordCache;
	if (!dc || (!dc.username && !dc.globalName && !dc.global_name)) return true;
	const updatedAtMs = dc.updatedAt ? new Date(dc.updatedAt).getTime() : 0;
	if (!updatedAtMs || Number.isNaN(updatedAtMs) || Date.now() - updatedAtMs > maxAgeMs) {
		return true;
	}
	if (bot?.avatar && isDiscordManagedMediaValue(bot.avatar)) {
		const storedHash = extractDiscordHashFromUrl(bot.avatar);
		if (storedHash && storedHash !== (dc.avatar || '')) {
			return true;
		}
	}
	return false;
}

export async function fetchLiveDiscordUser(userId: string): Promise<any | null> {
	if (!userId || !/^\d{15,22}$/.test(String(userId))) return null;
	const key = String(userId);
	const cached = liveDiscordCache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.data;
	}

	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
	if (tokens.length === 0) return null;

	for (const token of tokens) {
		try {
			const res = await fetch(`https://discord.com/api/v10/users/${key}`, {
				headers: { Authorization: `Bot ${token}` },
				signal: AbortSignal.timeout(2500),
				next: { revalidate: 3600 },
			});
			if (res.ok) {
				const data = await res.json();
				liveDiscordCache.set(key, { data, expiresAt: Date.now() + LIVE_CACHE_TTL_MS });
				return data;
			}
		} catch {
			// Try next token or fall back cleanly
		}
	}

	return null;
}

export function applyLiveDiscordToBot(bot: any, botId: string, discordUser: any, BotModel?: any, size = 1024): { avatarUrl: string | null; bannerUrl: string | null } {
	const liveAvatarHash = discordUser?.avatar ? String(discordUser.avatar) : '';
	const liveBannerHash = discordUser?.banner ? String(discordUser.banner) : '';
	const liveAvatarUrl = buildDiscordAvatarUrl(botId, liveAvatarHash || null, size);
	const liveBannerUrl = buildDiscordBannerUrl(botId, liveBannerHash || null, size);

	const customAvatar = bot?.avatar && !isDiscordManagedMediaValue(bot.avatar) ? String(bot.avatar) : null;
	const customBanner = bot?.banner && !isDiscordManagedMediaValue(bot.banner) ? String(bot.banner) : null;

	const resolvedAvatarUrl = customAvatar || liveAvatarUrl;
	const resolvedBannerUrl = customBanner || liveBannerUrl;

	const cacheDoc = {
		username: discordUser.username || '',
		globalName: discordUser.global_name || discordUser.globalName || discordUser.username || '',
		avatar: liveAvatarHash,
		banner: liveBannerHash,
		avatarUrl: liveAvatarUrl || '',
		bannerUrl: liveBannerUrl || '',
		updatedAt: new Date(),
	};

	bot.discord = {
		...discordUser,
		global_name: discordUser.global_name || discordUser.globalName || discordUser.username,
		avatar: liveAvatarHash || null,
		banner: liveBannerHash || null,
		avatarUrl: resolvedAvatarUrl,
		bannerUrl: resolvedBannerUrl,
		updatedAt: cacheDoc.updatedAt,
	};

	if (isDiscordManagedMediaValue(bot.avatar)) {
		bot.avatar = liveAvatarHash || '';
	}
	if (isDiscordManagedMediaValue(bot.banner)) {
		bot.banner = liveBannerHash || '';
	}

	if (BotModel) {
		const updateSet: Record<string, any> = { discordCache: cacheDoc };
		if (isDiscordManagedMediaValue(bot.avatar)) {
			updateSet.avatar = liveAvatarHash;
		}
		setTimeout(() => {
			BotModel.updateOne({ id: botId }, { $set: updateSet }).catch(() => {});
		}, 0);
	}

	return { avatarUrl: resolvedAvatarUrl, bannerUrl: resolvedBannerUrl };
}
