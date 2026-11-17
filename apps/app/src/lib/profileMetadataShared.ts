/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

const discordUserCache = new Map<string, { payload: any; expiresAt: number }>();
const DISCORD_CACHE_TTL_MS = 5 * 60 * 1000;

export interface OfficialBotDefault {
	id: string;
	slug: string;
	name: string;
	description: string;
	info: string;
	tags: string[];
}

export type LookupOutcome<T> = { status: 'ok'; data: T } | { status: 'not_found' } | { status: 'error' };

export interface EntitySeoSummary {
	name: string;
	description: string;
	info: string;
	tags: string[];
	canonicalUrl: string;
	jsonLd: Record<string, any>;
}

const OFFICIAL_BOTS: OfficialBotDefault[] = [
	{
		id: '1484880634844287138',
		slug: 'virtue',
		name: 'Virtue',
		description: 'Text and voice XP leveling Discord bot by Xernerx Studios with global & server leaderboards, customizable XP curves, role rewards, and booster multipliers.',
		info: 'Virtue is a text and voice XP leveling Discord bot developed by Xernerx Studios as part of the Xernerx Suite. Track progression across global and server-specific tracks, configure XP curve modes, daily/weekly/monthly leaderboard resets, server booster XP multipliers, role rewards, and channel/role exclusions in one unified dashboard.',
		tags: ['Leveling', 'XP', 'Voice', 'Leaderboard', 'Role Rewards', 'Community'],
	},
	{
		id: '619328560141697036',
		slug: 'yourapps',
		name: 'YourApps',
		description: 'Discord-native server forms, staff recruitment, appeals, and Modal V2 applications bot by Xernerx Studios with resumable drafts and automated role workflows.',
		info: 'YourApps is an official Discord-native forms and server applications bot by Xernerx Studios. Build up to 25-question positions across 13 Discord Modal V2 field types in the Server Dashboard, deploy interactive Apply panels, support resumable multi-modal drafts, and automate reviewer approvals and role rewards.',
		tags: ['Applications', 'Forms', 'Moderation', 'Recruitment', 'Utility', 'Community'],
	},
	{
		id: '782105629572464652',
		slug: 'todo',
		name: 'To-Do List Bot',
		description: 'Collaborative Discord task boards, personal checklists, reminders, and workflow management bot by Xernerx Studios.',
		info: 'To-Do List Bot is an official Discord productivity bot by Xernerx Studios that brings personal and shared server task boards, priority tracking, and seamless dashboard synchronization directly to Discord.',
		tags: ['Productivity', 'Tasks', 'To-Do List Bot', 'Utility', 'Organization'],
	},
	{
		id: '881678826906730547',
		slug: 'metamorphosis',
		name: 'Metamorphosis',
		description: 'Dynamic temporary voice channels, automated room management, and community moderation Discord bot by Xernerx Studios.',
		info: 'Metamorphosis is an official Discord utility and voice automation bot by Xernerx Studios that creates on-demand custom voice channels, room permissions, and streamlined server management.',
		tags: ['Voice Channels', 'Automation', 'Moderation', 'Utility'],
	},
	{
		id: '950251264095162418',
		slug: 'zodiac',
		name: 'Zodiac',
		description: 'Daily horoscopes, astrology signs, compatibility readings, and birth chart insights Discord bot by Xernerx Studios.',
		info: 'Zodiac is an official astrology Discord bot by Xernerx Studios offering daily horoscope readings, zodiac sign profiles, cosmic compatibility checks, and automated horoscope channels.',
		tags: ['Astrology', 'Horoscope', 'Zodiac', 'Fun', 'Community'],
	},
];

export function resolveOfficialBotDefault(idOrSlug: string): OfficialBotDefault | null {
	const clean = String(idOrSlug || '')
		.trim()
		.toLowerCase();
	if (!clean) return null;
	if (clean === 'tdl' || clean === 'to-do-list' || clean === 'to-do-list-bot' || clean === 'todolistbot') {
		return OFFICIAL_BOTS.find((b) => b.slug === 'todo') || null;
	}
	return OFFICIAL_BOTS.find((b) => b.id === clean || b.slug === clean) || null;
}

export async function resolveEnvUrls(): Promise<{ apiBase: string; appBase: string }> {
	const headersList = await headers();
	const rawHost = (headersList.get('x-forwarded-host') || headersList.get('host') || '').split(',')[0].trim().toLowerCase();
	const domain = process.env.DOMAIN || 'xernerx.com';
	const envVar = (process.env.ENVIRONMENT || '').toLowerCase();

	const isLocalHost = rawHost.startsWith('localhost:') || rawHost.startsWith('127.0.0.1:') || rawHost === 'localhost' || rawHost === '127.0.0.1';
	const isCanary = rawHost.includes('.canary.') || (!rawHost && envVar === 'canary');
	const isDev = !isCanary && (isLocalHost || rawHost.includes('.dev.') || (!rawHost && envVar === 'development'));

	const apiBase = isLocalHost ? 'http://localhost:4001' : isCanary ? `https://api.canary.${domain}` : isDev ? `https://api.dev.${domain}` : `https://api.${domain}`;

	const appBase = isLocalHost ? 'http://localhost:4004' : isCanary ? `https://app.canary.${domain}` : isDev ? `https://app.dev.${domain}` : `https://app.${domain}`;

	return { apiBase, appBase };
}

export async function fetchDiscordUser(snowflake: string): Promise<any | null> {
	if (!snowflake || !/^\d{15,22}$/.test(snowflake)) return null;

	const cached = discordUserCache.get(snowflake);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.payload;
	}

	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
	if (tokens.length === 0) return null;

	for (const token of tokens) {
		try {
			const res = await fetch(`https://discord.com/api/v10/users/${snowflake}`, {
				headers: { Authorization: `Bot ${token}` },
				next: { revalidate: 3600 },
			});
			if (res.ok) {
				const data = await res.json();
				discordUserCache.set(snowflake, { payload: data, expiresAt: Date.now() + DISCORD_CACHE_TTL_MS });
				return data;
			}
		} catch {
			// Try next token
		}
	}

	return null;
}

export function buildFallbackMetadata(title: string, description: string, canonicalPath: string, appBase: string, noIndex = false): Metadata {
	const currentUrl = `${appBase}${canonicalPath}`;
	return {
		title,
		description,
		alternates: { canonical: canonicalPath },
		...(noIndex ? { robots: { index: false, follow: false } } : {}),
		openGraph: {
			siteName: 'Xernerx Studios',
			type: 'website',
			title,
			description,
			url: currentUrl,
			images: [{ url: '/banner.png', width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: 'summary_large_image',
			site: '@XernerxStudios',
			creator: '@XernerxStudios',
			title,
			description,
			images: ['/banner.png'],
		},
	};
}
