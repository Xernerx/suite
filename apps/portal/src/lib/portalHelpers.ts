/** @format */

export const VALID_ORG_TABS = ['info', 'members', 'roles', 'bots', 'servers', 'links', 'settings'] as const;

export function resolveBotAvatarUrl(bot: any, size = 128): string | null {
	if (!bot) return null;
	if (bot.discord?.avatarUrl) return String(bot.discord.avatarUrl);
	if (bot.discord?.avatar && bot.id) {
		const hash = String(bot.discord.avatar).trim();
		if (hash.startsWith('http://') || hash.startsWith('https://')) return hash;
		const ext = hash.startsWith('a_') ? 'gif' : 'png';
		return `https://cdn.discordapp.com/avatars/${bot.id}/${hash}.${ext}?size=${size}`;
	}
	if (bot.avatar) {
		const raw = String(bot.avatar).trim();
		if (!raw) return null;
		if (raw.startsWith('http://') || raw.startsWith('https://')) {
			// If discord object exists and explicitly has empty/null avatar, ignore stale cdn.discordapp.com URL
			if (bot.discord && !bot.discord.avatar && raw.includes('cdn.discordapp.com/')) {
				return null;
			}
			return raw;
		}
		if (bot.id) {
			const ext = raw.startsWith('a_') ? 'gif' : 'png';
			return `https://cdn.discordapp.com/avatars/${bot.id}/${raw}.${ext}?size=${size}`;
		}
	}
	return null;
}

export function resolveGuildIconUrl(guild: any, size = 128): string | null {
	if (!guild) return null;
	if (guild.iconUrl) return String(guild.iconUrl);
	if (guild.icon && guild.id) {
		const hash = String(guild.icon).trim();
		if (!hash) return null;
		if (hash.startsWith('http://') || hash.startsWith('https://')) return hash;
		const ext = hash.startsWith('a_') ? 'gif' : 'png';
		return `https://cdn.discordapp.com/icons/${guild.id}/${hash}.${ext}?size=${size}`;
	}
	return null;
}

export function resolveUserAvatarUrl(userId: string | undefined, profile: any, size = 128): string | null {
	if (!profile) return null;
	if (profile.avatarUrl) return String(profile.avatarUrl);
	if (profile.avatar && (userId || profile.id)) {
		const id = userId || profile.id;
		const hash = String(profile.avatar).trim();
		if (!hash) return null;
		if (hash.startsWith('http://') || hash.startsWith('https://')) return hash;
		const ext = hash.startsWith('a_') ? 'gif' : 'png';
		return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=${size}`;
	}
	return null;
}

export function filterManagedDiscordGuilds(rawPayload: any): any[] {
	const list = Array.isArray(rawPayload) ? rawPayload : Array.isArray(rawPayload?.guilds) ? rawPayload.guilds : Array.isArray(rawPayload?.data) ? rawPayload.data : [];

	return list.filter((guild: any) => {
		if (!guild?.id) return false;
		if (guild.owner === true) return true;
		const rawPerms = guild.permissions ?? guild.permissions_new ?? 0;
		try {
			const perms = BigInt(String(rawPerms || '0'));
			const ADMIN = BigInt(0x8);
			const MANAGE_GUILD = BigInt(0x20);
			return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
		} catch {
			return false;
		}
	});
}

export async function populateBotsWithFreshDiscord(botList: any[], getEnvUrl: (url: string) => string): Promise<any[]> {
	const now = Date.now();
	return Promise.all(
		botList.map(async (bot: any) => {
			if (!bot?.id) return bot;
			const updatedAtMs = bot.discord?.updatedAt ? new Date(bot.discord.updatedAt).getTime() : 0;
			const isFresh = Boolean((bot.discord?.username || bot.discord?.global_name) && updatedAtMs && now - updatedAtMs < 5 * 60_000);
			if (isFresh) return bot;
			try {
				const discordRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`));
				if (discordRes.ok) {
					const liveDiscord = await discordRes.json();
					return { ...bot, discord: liveDiscord };
				}
			} catch {
				// Keep existing bot record if Discord endpoint is unreachable
			}
			return bot;
		})
	);
}

export function syncSidebarOrgView(setView: (view: string | null) => void, targetView: string): void {
	if (typeof window === 'undefined') {
		setView(targetView);
		return;
	}
	const currentParams = new URLSearchParams(window.location.search);
	const savedTab = currentParams.get('tab');
	setView(targetView);
	if (savedTab && (VALID_ORG_TABS as readonly string[]).includes(savedTab)) {
		const nextParams = new URLSearchParams(window.location.search);
		nextParams.set('tab', savedTab);
		const qs = nextParams.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}
}
