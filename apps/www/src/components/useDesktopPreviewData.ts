/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { headerSubdomainsCatalog, type HeaderSubdomainItem } from '@xernerx/lib';
import { DEFAULT_HEADER_SUBDOMAINS, useEnvironment, useNotifications, usePermissions, useSession, useTheme, useUser } from '@xernerx/providers';
import type { PreviewControlStyle } from './DesktopPreviewHeader';

export const PREVIEW_CRESTS = [
	{ id: 'default', src: '/icon.png' },
	{ id: 'blue', src: '/icon-blue.png' },
	{ id: 'cyan', src: '/icon-cyan.png' },
	{ id: 'green', src: '/icon-green.png' },
	{ id: 'gold', src: '/icon-gold.png' },
	{ id: 'orange', src: '/icon-orange.png' },
	{ id: 'red', src: '/icon-red.png' },
	{ id: 'pink', src: '/icon-pink.png' },
	{ id: 'white', src: '/icon-white.png' },
	{ id: 'black', src: '/icon-black.png' },
] as const;

const DISCORD_NAMEPLATE_PALETTES: Record<string, string> = {
	crimson: 'linear-gradient(90deg, #2a0a10 0%, #591321 55%, #7a1b2d 100%)',
	berry: 'linear-gradient(90deg, #281024 0%, #521c45 55%, #6e265c 100%)',
	bubblegum: 'linear-gradient(90deg, #2d1222 0%, #5c2244 55%, #7d2f5d 100%)',
	bubble_gum: 'linear-gradient(90deg, #2d1222 0%, #5c2244 55%, #7d2f5d 100%)',
	violet: 'linear-gradient(90deg, #1d1130 0%, #3b2063 55%, #4f2b82 100%)',
	cobalt: 'linear-gradient(90deg, #0e1a33 0%, #1b3669 55%, #24488a 100%)',
	sky: 'linear-gradient(90deg, #0d2233 0%, #194566 55%, #225c87 100%)',
	teal: 'linear-gradient(90deg, #0c2629 0%, #174d52 55%, #1f666d 100%)',
	forest: 'linear-gradient(90deg, #0f2618 0%, #1e4d31 55%, #286641 100%)',
	clover: 'linear-gradient(90deg, #122915 0%, #24522a 55%, #306e38 100%)',
	lemon: 'linear-gradient(90deg, #2b230d 0%, #574619 55%, #735d22 100%)',
	white: 'linear-gradient(90deg, #1e2028 0%, #343846 55%, #464b5e 100%)',
};

export interface PreviewGuildItem {
	id: string;
	name: string;
	iconUrl: string | null;
	bannerUrl: string | null;
	badge: string;
}

export interface PreviewBotTickerItem {
	name: string;
	count: string;
}

export interface PreviewGuildConfig {
	id: string;
	name: string;
	bot: boolean;
	verified: boolean;
	locale: string;
	description: string;
	info: string;
	tags: string[];
	privacy: 'public' | 'limited' | 'private';
	vanitySlug: string;
	vanityUnlocked: boolean;
	links: { invite: string; website: string };
	stats: { members: number; messages: number; bots: number; boosts: number };
}

const DEMO_GUILDS: PreviewGuildItem[] = [
	{ id: '687429190165069838', name: 'Xernerx Studios', iconUrl: '/icon.png', bannerUrl: null, badge: 'X' },
	{ id: '100000000000000000', name: 'Xernerx Community Hub', iconUrl: null, bannerUrl: null, badge: 'C' },
];

const DEMO_TICKER_BOTS: PreviewBotTickerItem[] = [
	{ name: 'Virtue', count: '1.2k' },
	{ name: 'YourApps', count: '827' },
	{ name: 'Xernerx', count: '420' },
];

function buildFallbackGuildConfig(guildId: string, guildName: string): PreviewGuildConfig {
	const isOfficial = guildId === '687429190165069838';
	return {
		id: guildId,
		name: guildName,
		bot: true,
		verified: isOfficial,
		locale: 'en-GB',
		description: isOfficial
			? 'Official home of Xernerx Studios — Discord bots, web apps, server leveling, and developer tools.'
			: 'Your Discord server directory profile, live analytics, and Virtue XP & voice leveling modules.',
		info: 'Configure your server directory listing, community discovery tags, external links, and Virtue & YourApps modules right from your desktop.',
		tags: isOfficial ? ['Community', 'Developer', 'Tech', 'Gaming'] : ['Community', 'Gaming', 'Chill'],
		privacy: 'public',
		vanitySlug: isOfficial ? 'xernerx' : '',
		vanityUnlocked: isOfficial,
		links: {
			invite: isOfficial ? 'https://discord.gg/yrm8gqTuXa' : 'https://discord.gg/community',
			website: isOfficial ? 'https://xernerx.com' : '',
		},
		stats: isOfficial ? { members: 1420, messages: 48290, bots: 6, boosts: 14 } : { members: 384, messages: 12450, bots: 4, boosts: 7 },
	};
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

export function usePreviewGuildConfig(guild: PreviewGuildItem | undefined) {
	const { getEnvUrl, isReady } = useEnvironment();
	const guildId = guild?.id || '687429190165069838';
	const guildName = guild?.name || 'Xernerx Studios';

	const [config, setConfig] = useState<PreviewGuildConfig>(() => buildFallbackGuildConfig(guildId, guildName));

	useEffect(() => {
		const fallback = buildFallbackGuildConfig(guildId, guildName);
		setConfig(fallback);
		if (!isReady || !/^\d{15,22}$/.test(guildId) || guildId === '100000000000000000') return;

		let cancelled = false;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${encodeURIComponent(guildId)}`), { credentials: 'include' })
			.then((r) => (r.ok ? r.json() : null))
			.then((raw) => {
				if (cancelled || !raw || typeof raw !== 'object') return;
				const latestStat = Array.isArray(raw.stats) && raw.stats.length > 0 ? raw.stats[raw.stats.length - 1] : null;
				const isRegistered = raw.name && raw.name !== 'Unknown Guild';
				setConfig({
					id: String(raw.id || guildId),
					name: isRegistered ? String(raw.name) : guildName,
					bot: typeof raw.bot === 'boolean' ? raw.bot : fallback.bot,
					verified: Boolean(raw.verified),
					locale: typeof raw.locale === 'string' && raw.locale ? raw.locale : 'en-GB',
					description: typeof raw.description === 'string' && raw.description ? raw.description : isRegistered ? '' : fallback.description,
					info: typeof raw.info === 'string' && raw.info ? raw.info : isRegistered ? '' : fallback.info,
					tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags.map(String) : isRegistered ? [] : fallback.tags,
					privacy: raw.privacy === 'limited' || raw.privacy === 'private' || raw.privacy === 'public' ? raw.privacy : 'public',
					vanitySlug: typeof raw.vanitySlug === 'string' ? raw.vanitySlug : '',
					vanityUnlocked: Boolean(raw.vanityUnlocked || raw.verified || raw.vanitySlug),
					links: {
						invite: typeof raw.links?.invite === 'string' ? raw.links.invite : fallback.links.invite,
						website: typeof raw.links?.website === 'string' ? raw.links.website : fallback.links.website,
					},
					stats: latestStat
						? {
								members: Number(latestStat.members) || 0,
								messages: Number(latestStat.messages) || 0,
								bots: Number(latestStat.bots) || 0,
								boosts: Number(latestStat.boosts) || 0,
							}
						: fallback.stats,
				});
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [guildId, guildName, isReady, getEnvUrl]);

	return { config, setConfig };
}

export function useDesktopPreviewData() {
	const { user } = useUser();
	const { data: session } = useSession();
	const { preferences } = useTheme();
	const { hasPermission } = usePermissions();
	const { unreadCount } = useNotifications();
	const { getEnvUrl, isReady } = useEnvironment();

	const activeUser: any = user || (session as any)?.user || null;
	const userId: string | null = activeUser?.id ? String(activeUser.id) : null;
	const isSignedIn = Boolean(userId);

	const [liveGuilds, setLiveGuilds] = useState<PreviewGuildItem[]>([]);
	const [liveBots, setLiveBots] = useState<PreviewBotTickerItem[]>([]);

	useEffect(() => {
		if (!isReady || !userId) {
			setLiveGuilds([]);
			setLiveBots([]);
			return;
		}
		let cancelled = false;
		const accessToken = (session as any)?.accessToken;
		const headers: Record<string, string> = {};
		if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(userId)}/discord/guilds`), {
			credentials: 'include',
			headers,
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((raw) => {
				if (cancelled || !raw) return;
				const list = Array.isArray(raw) ? raw : Array.isArray(raw.guilds) ? raw.guilds : [];
				const managed = list
					.filter((g: any) => {
						if (g?.owner) return true;
						try {
							const perms = BigInt(g?.permissions || 0);
							return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
						} catch {
							return false;
						}
					})
					.slice(0, 7)
					.map((g: any): PreviewGuildItem => ({
						id: String(g.id),
						name: String(g.name || g.id),
						iconUrl:
							typeof g.iconUrl === 'string' && g.iconUrl
								? g.iconUrl
								: g.icon
									? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${String(g.icon).startsWith('a_') ? 'gif' : 'png'}?size=128`
									: null,
						bannerUrl:
							typeof g.bannerUrl === 'string' && g.bannerUrl
								? g.bannerUrl
								: g.banner
									? `https://cdn.discordapp.com/banners/${g.id}/${g.banner}.${String(g.banner).startsWith('a_') ? 'gif' : 'png'}?size=1024`
									: null,
						badge: String(g.name || 'S')
							.trim()
							.charAt(0)
							.toUpperCase(),
					}));
				if (managed.length > 0) setLiveGuilds(managed);
			})
			.catch(() => {});

		fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${encodeURIComponent(userId)}`), { credentials: 'include' })
			.then((r) => (r.ok ? r.json() : null))
			.then((raw) => {
				if (cancelled || !Array.isArray(raw) || raw.length === 0) return;
				const mapped = raw.slice(0, 3).map((b: any): PreviewBotTickerItem => ({
					name: String(b.discord?.global_name || b.name || b.id),
					count: formatCompact(Number(b.guildCount ?? b.stats?.guildCount ?? 0)),
				}));
				if (mapped.length > 0) setLiveBots(mapped);
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [isReady, userId, getEnvUrl, (session as any)?.accessToken]);

	const displayName: string = isSignedIn ? String(activeUser?.global_name || activeUser?.name || activeUser?.username || 'User') : 'Alex';
	const rawUsername: string = isSignedIn
		? String(activeUser?.username || activeUser?.name || 'user')
				.toLowerCase()
				.replace(/\s+/g, '')
		: 'alex';
	const handle = `@${rawUsername}`;
	const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

	const avatarUrl: string | null =
		isSignedIn && activeUser?.avatar && userId
			? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.${String(activeUser.avatar).startsWith('a_') ? 'gif' : 'png'}?size=128`
			: isSignedIn && typeof activeUser?.image === 'string'
				? activeUser.image
				: null;

	const bannerUrl: string | null =
		isSignedIn && activeUser?.banner && userId ? `https://cdn.discordapp.com/banners/${userId}/${activeUser.banner}.${String(activeUser.banner).startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
	const bannerColor: string | null = isSignedIn && typeof activeUser?.banner_color === 'string' ? activeUser.banner_color : null;

	const decorationUrl: string | null =
		isSignedIn && preferences.showDiscordCollectibles !== false && activeUser?.avatar_decoration_data?.asset
			? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png`
			: null;

	const nameplateUrl: string | null =
		isSignedIn && preferences.showDiscordCollectibles !== false && activeUser?.collectibles?.nameplate?.asset
			? `https://cdn.discordapp.com/assets/collectibles/${activeUser.collectibles.nameplate.asset}asset.webm`
			: null;

	const clanTag: string | null = isSignedIn && typeof activeUser?.clan?.tag === 'string' ? activeUser.clan.tag : null;
	const clanBadgeUrl: string | null =
		isSignedIn && preferences.showDiscordCollectibles !== false && activeUser?.clan?.badge && activeUser?.clan?.identity_guild_id
			? `https://cdn.discordapp.com/clan-badges/${activeUser.clan.identity_guild_id}/${activeUser.clan.badge}.png`
			: null;

	const paletteKey = String(activeUser?.collectibles?.nameplate?.palette || '').toLowerCase();
	const nameplateGradient =
		DISCORD_NAMEPLATE_PALETTES[paletteKey] || 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 28%, #14141b) 0%, color-mix(in srgb, var(--accent) 48%, #1c1c26) 100%)';

	const profileCosmetics = (user as any)?.credits?.profileCosmetics || {};
	const customNameplate: string = profileCosmetics.nameplate || 'none';
	const customAvatarFrame: string = profileCosmetics.avatarFrame || 'none';
	const customCardTheme: string = profileCosmetics.cardTheme || 'default';
	const activeVanityBadges: string[] = Array.isArray((user as any)?.credits?.activeBadges) ? (user as any).credits.activeBadges : [];
	const hasDotMatrixBanner = activeVanityBadges.includes('dot_matrix_banner');
	const dotMatrixVariant: string = (user as any)?.credits?.dotMatrixVariant || 'orbit';

	const currentLevel: number = isSignedIn ? Number(activeUser?.level?.level ?? activeUser?.levels?.[0]?.level ?? 1) || 1 : 12;
	const totalXp: number = isSignedIn ? Number(activeUser?.level?.xp ?? activeUser?.levels?.[0]?.xp ?? 0) || 0 : 780;
	const xpRequired = Math.max(100, currentLevel * 100);
	const currentLevelXp = totalXp % xpRequired;
	const levelProgress = Math.min(100, Math.max(totalXp > 0 ? 4 : 0, Math.round((currentLevelXp / xpRequired) * 100)));
	const creditsBalance: number = isSignedIn ? Number((user as any)?.credits?.balance ?? 0) || 0 : 1450;

	const hasAdminAccess = Boolean(isSignedIn && hasPermission('access'));
	const staffSubscription = Boolean(isSignedIn && activeUser?.staffSubscription);
	const hasActiveSub = Boolean(staffSubscription || (isSignedIn && Array.isArray(activeUser?.subscriptions) && activeUser.subscriptions.some((s: any) => s.status === 'active')));

	const savedWindowControls: PreviewControlStyle | null =
		isSignedIn && preferences.windowControls && preferences.windowControls !== 'system' ? (preferences.windowControls as PreviewControlStyle) : null;
	const savedAlignment: 'left' | 'right' | null = preferences.alignment === 'left' || preferences.alignment === 'right' ? preferences.alignment : null;
	const showShortcutHints = preferences.showShortcutHints !== false;

	const savedCrestIdx = useMemo(() => {
		const iconId = String((user as any)?.preferences?.appIcon || 'default').toLowerCase();
		const idx = PREVIEW_CRESTS.findIndex((c) => c.id === iconId);
		return idx >= 0 ? idx : 0;
	}, [(user as any)?.preferences?.appIcon]);

	const pinnedSubdomains: HeaderSubdomainItem[] = useMemo(() => {
		const ids = isSignedIn && Array.isArray(preferences.headerSubdomains) ? preferences.headerSubdomains : DEFAULT_HEADER_SUBDOMAINS;
		return headerSubdomainsCatalog.filter((sub) => ids.includes(sub.id) && (!sub.adminOnly || (isSignedIn && hasPermission(sub.requiredPermission || 'access'))));
	}, [isSignedIn, preferences.headerSubdomains, hasPermission]);

	const streakDays: number = isSignedIn && typeof (user as any)?.credits?.streak === 'number' ? Math.max(0, (user as any).credits.streak) : 14;
	const giftInMs = isSignedIn && (user as any)?.credits?.giftIn ? new Date((user as any).credits.giftIn).getTime() : null;
	const isGiftInitiallyClaimed = Boolean(isSignedIn && giftInMs !== null && Number.isFinite(giftInMs) && giftInMs > Date.now());

	return {
		isSignedIn,
		userId: userId || '687429190165069838',
		displayName,
		handle,
		initial,
		avatarUrl,
		bannerUrl,
		bannerColor,
		decorationUrl,
		nameplateUrl,
		nameplateGradient,
		customNameplate,
		customAvatarFrame,
		customCardTheme,
		hasDotMatrixBanner,
		dotMatrixVariant,
		clanTag,
		clanBadgeUrl,
		currentLevel,
		currentLevelXp,
		xpRequired,
		levelProgress,
		creditsBalance,
		hasAdminAccess,
		hasActiveSub,
		staffSubscription,
		savedWindowControls,
		savedAlignment,
		showShortcutHints,
		savedCrestIdx,
		pinnedSubdomains,
		unreadCount: isSignedIn ? unreadCount : 1,
		guilds: liveGuilds.length > 0 ? liveGuilds : DEMO_GUILDS,
		hasLiveGuilds: liveGuilds.length > 0,
		tickerBots: liveBots.length > 0 ? liveBots : DEMO_TICKER_BOTS,
		streakDays,
		isGiftInitiallyClaimed,
	};
}
