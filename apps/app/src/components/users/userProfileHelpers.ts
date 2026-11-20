/** @format */

import { BungieTricornIcon } from '@xernerx/lib';
import { AtSign, Code2, Gamepad2, Globe, MessageCircle, Music, Tv, Video } from 'lucide-react';

export const PROVIDER_META: Record<string, { label: string; icon: any }> = {
	github: { label: 'GitHub', icon: Code2 },
	twitch: { label: 'Twitch', icon: Tv },
	youtube: { label: 'YouTube', icon: Video },
	twitter: { label: 'X (Twitter)', icon: AtSign },
	x: { label: 'X (Twitter)', icon: AtSign },
	bluesky: { label: 'Bluesky', icon: Globe },
	spotify: { label: 'Spotify', icon: Music },
	steam: { label: 'Steam', icon: Gamepad2 },
	bungie: { label: 'Bungie', icon: BungieTricornIcon },
	xbox: { label: 'Xbox', icon: Gamepad2 },
	playstation: { label: 'PlayStation', icon: Gamepad2 },
	psn: { label: 'PlayStation', icon: Gamepad2 },
	epicgames: { label: 'Epic Games', icon: Gamepad2 },
	epic: { label: 'Epic Games', icon: Gamepad2 },
	riotgames: { label: 'Riot Games', icon: Gamepad2 },
	riot: { label: 'Riot Games', icon: Gamepad2 },
	battlenet: { label: 'Battle.net', icon: Gamepad2 },
	roblox: { label: 'Roblox', icon: Gamepad2 },
	reddit: { label: 'Reddit', icon: MessageCircle },
	discord: { label: 'Discord', icon: MessageCircle },
	tiktok: { label: 'TikTok', icon: Video },
};

const KNOWN_PREFIX_RE = /^(bungie|steam|github|twitch|youtube|twitter|x|bluesky|spotify|reddit|xbox|playstation|psn|epicgames|epic|riotgames|riot|battlenet|roblox|discord|tiktok):+/i;

function humanizeSlug(input: string): string {
	return input
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveUserLevelAndXp(user: any): { level: number; xp: number } {
	const levelObj = user?.level && typeof user.level === 'object' ? user.level : Array.isArray(user?.levels) && user.levels.length > 0 && typeof user.levels[0] === 'object' ? user.levels[0] : null;

	const rawLevel = levelObj ? Number(levelObj.level) : typeof user?.level === 'number' ? user.level : Number(user?.level);
	const rawXp = levelObj ? Number(levelObj.xp) : Number(user?.xp ?? 0);

	return {
		level: Number.isFinite(rawLevel) && rawLevel > 0 ? Math.floor(rawLevel) : 1,
		xp: Number.isFinite(rawXp) && rawXp >= 0 ? Math.floor(rawXp) : 0,
	};
}

export interface NormalizedUserConnection {
	key: string;
	label: string;
	handle: string;
	href: string | null;
	icon: any;
}

export interface NormalizedUserShowcase {
	id: string;
	title: string;
	description: string;
	imageUrl: string | null;
	href: string | null;
	displayHost: string | null;
	tag: string | null;
}

export function normalizeUserConnection(conn: any): NormalizedUserConnection {
	const rawProviderStr = String(conn?.provider || '').trim();
	const rawCandidateHandle = String(conn?.displayName || conn?.username || conn?.name || conn?.id || '').trim();

	let inferredProvider = rawProviderStr.split(':')[0].trim().toLowerCase();
	const prefixMatch = rawCandidateHandle.match(/^([a-z0-9_-]{2,20}):(.+)$/i);
	if ((!inferredProvider || inferredProvider === 'custom' || inferredProvider === 'connection') && prefixMatch) {
		inferredProvider = prefixMatch[1].toLowerCase();
	}

	const meta = PROVIDER_META[inferredProvider] || {
		label: inferredProvider ? humanizeSlug(inferredProvider) : 'Account',
		icon: Globe,
	};

	let cleanHandle = rawCandidateHandle;
	if (inferredProvider) {
		const escaped = inferredProvider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		cleanHandle = cleanHandle.replace(new RegExp(`^${escaped}:+`, 'i'), '').trim();
	}
	cleanHandle = cleanHandle.replace(KNOWN_PREFIX_RE, '').trim();
	if (!cleanHandle) {
		const cleanId = String(conn?.id || '')
			.replace(KNOWN_PREFIX_RE, '')
			.trim();
		cleanHandle = cleanId || meta.label;
	}

	const rawUrl = typeof conn?.url === 'string' ? conn.url.trim() : '';
	const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : null;

	return {
		key: `${inferredProvider || 'conn'}-${conn?.id || cleanHandle}`,
		label: meta.label,
		handle: cleanHandle,
		href,
		icon: meta.icon,
	};
}

function isUrlLikeString(value: string): boolean {
	if (!value) return false;
	return /^https?:\/\//i.test(value) || (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value) && !value.includes(' '));
}

export function deriveShowcaseMetaFromUrl(urlStr: string): { derivedTitle: string; displayHost: string } {
	try {
		const normalized = /^https?:\/\//i.test(urlStr) ? urlStr : `https://${urlStr}`;
		const parsed = new URL(normalized);
		const host = parsed.hostname.replace(/^www\./i, '');
		const segments = parsed.pathname
			.split('/')
			.filter(Boolean)
			.map((s) => {
				try {
					return decodeURIComponent(s);
				} catch {
					return s;
				}
			});

		const displayPath = segments.length > 0 ? `/${segments.slice(0, 2).join('/')}${segments.length > 2 ? '/…' : ''}` : '';
		const displayHost = `${host}${displayPath}`;

		if (host === 'github.com' && segments.length >= 2) {
			return { derivedTitle: `${segments[0]} / ${segments[1]}`, displayHost };
		}

		if (segments.length >= 1) {
			const last = segments[segments.length - 1];
			if (/^\d{15,22}$/.test(last) && segments.length >= 2) {
				return { derivedTitle: `${humanizeSlug(segments[segments.length - 2])} · ${host}`, displayHost };
			}
			return { derivedTitle: humanizeSlug(last), displayHost };
		}

		const domainRoot = host.split('.')[0] || host;
		const providerMatch = PROVIDER_META[domainRoot.toLowerCase()];
		return { derivedTitle: providerMatch ? providerMatch.label : humanizeSlug(domainRoot), displayHost: host };
	} catch {
		return { derivedTitle: urlStr, displayHost: urlStr };
	}
}

export function normalizeUserShowcase(
	raw: any,
	index: number,
	getEnvUrl: (url: string) => string
): {
	id: string;
	title: string;
	description: string;
	imageUrl: string | null;
	href: string | null;
	displayHost: string | null;
	tag: string | null;
} {
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		const isUrl = isUrlLikeString(trimmed);
		const rawUrl = isUrl ? (/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`) : null;
		const resolvedHref = rawUrl ? (rawUrl.includes('xernerx.com') ? getEnvUrl(rawUrl) : rawUrl) : null;
		const urlMeta = rawUrl ? deriveShowcaseMetaFromUrl(resolvedHref || rawUrl) : null;
		return {
			id: `sc-${index}`,
			title: urlMeta ? urlMeta.derivedTitle : trimmed || `#${index + 1}`,
			description: '',
			imageUrl: null,
			href: resolvedHref,
			displayHost: urlMeta ? urlMeta.displayHost : null,
			tag: null,
		};
	}

	const rawTitle = String(raw?.title || '').trim();
	const rawLinkCandidate = String(raw?.linkUrl || raw?.url || (isUrlLikeString(rawTitle) ? rawTitle : '')).trim();
	const normalizedLink = rawLinkCandidate ? (/^https?:\/\//i.test(rawLinkCandidate) || rawLinkCandidate.startsWith('/') ? rawLinkCandidate : `https://${rawLinkCandidate}`) : '';
	const resolvedHref = normalizedLink ? (normalizedLink.includes('xernerx.com') ? getEnvUrl(normalizedLink) : normalizedLink) : null;
	const urlMeta = resolvedHref ? deriveShowcaseMetaFromUrl(resolvedHref) : isUrlLikeString(rawTitle) ? deriveShowcaseMetaFromUrl(rawTitle) : null;

	const finalTitle = !rawTitle || isUrlLikeString(rawTitle) ? urlMeta?.derivedTitle || rawTitle || `#${index + 1}` : rawTitle;
	const rawImage = typeof raw?.imageUrl === 'string' && raw.imageUrl.trim() ? raw.imageUrl.trim() : null;

	return {
		id: String(raw?.id || `sc-${index}`),
		title: finalTitle,
		description: typeof raw?.description === 'string' ? raw.description.trim() : '',
		imageUrl: rawImage ? (rawImage.includes('xernerx.com') ? getEnvUrl(rawImage) : rawImage) : null,
		href: resolvedHref,
		displayHost: urlMeta?.displayHost || null,
		tag: typeof raw?.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : null,
	};
}
