/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { database } from '@xernerx/lib/server';

const discordUserCache = new Map<string, { payload: any; expiresAt: number }>();
const DISCORD_CACHE_TTL_MS = 5 * 60 * 1000;

interface OfficialBotDefault {
	id: string;
	slug: string;
	name: string;
	description: string;
	info: string;
	tags: string[];
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
	if (clean === 'tdl' || clean === 'to-do-list' || clean === 'to-do-list-bot') {
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

async function fetchDiscordUser(snowflake: string): Promise<any | null> {
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

function buildFallbackMetadata(title: string, description: string, canonicalPath: string, appBase: string, noIndex = false): Metadata {
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
			title,
			description,
			images: ['/banner.png'],
		},
	};
}

export interface BotSeoData {
	id: string;
	slug: string;
	name: string;
	verified: boolean;
	description: string;
	info: string;
	tags: string[];
	commands: Array<{ name: string; description: string }>;
	guildCount: number;
	userCount: number;
	voteCount: number;
	canonicalUrl: string;
	jsonLd: Record<string, any>;
}

export async function getBotSeoData(id: string): Promise<BotSeoData | null> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const official = resolveOfficialBotDefault(id);

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const VoteModel = (db.models.bots as any).Vote;
		const CommandModel = (db.models.bots as any).Command;
		const ReviewModel = (db.models.bots as any).Review;

		const queryOr: any[] = [{ id }, { vanitySlug: id.toLowerCase() }];
		if (official) {
			queryOr.push({ id: official.id }, { vanitySlug: official.slug });
		}

		const bot = await BotModel.findOne({ $or: queryOr }).lean();
		if ((!bot || bot.privacy === 'private') && !official) {
			return null;
		}

		const botId = String(bot?.id || official?.id || id);
		const [latestStat, voteCount, discordUser, syncedCmds, reviews] = await Promise.all([
			StatModel
				? StatModel.findOne({ id: botId })
						.sort({ timestamp: -1 })
						.lean()
						.catch(() => null)
				: null,
			VoteModel ? VoteModel.countDocuments({ botId }).catch(() => bot?.voteCount || 0) : bot?.voteCount || 0,
			fetchDiscordUser(botId),
			CommandModel
				? CommandModel.find({ botId })
						.sort({ type: 1, name: 1 })
						.limit(40)
						.lean()
						.catch(() => [])
				: [],
			ReviewModel
				? ReviewModel.find({ botId })
						.select('rating')
						.lean()
						.catch(() => [])
				: [],
		]);

		const name = discordUser?.global_name || discordUser?.username || bot?.discordCache?.globalName || bot?.discordCache?.username || bot?.name || official?.name || 'Discord Bot';
		const verified = Boolean(bot?.verified ?? Boolean(official));
		const slug = String(bot?.vanitySlug || official?.slug || botId);
		const description = bot?.description || official?.description || `Discover ${name} Discord Bot on Xernerx Studios.`;
		const info = bot?.info || official?.info || description;
		const tags: string[] = Array.isArray(bot?.tags) && bot.tags.length > 0 ? bot.tags.map(String) : official?.tags || [];

		const rawCommands = Array.isArray(bot?.commands) && bot.commands.length > 0 ? bot.commands : syncedCmds;
		const commands: Array<{ name: string; description: string }> = (rawCommands || [])
			.map((c: any) => ({
				name: String(c?.name || c?.body?.name || '').trim(),
				description: String(c?.description || c?.body?.description || '').trim(),
			}))
			.filter((c: { name: string; description: string }) => Boolean(c.name));

		const guildCount = Number(latestStat?.guildCount ?? latestStat?.servers ?? 0);
		const userCount = Number(latestStat?.userCount ?? latestStat?.users ?? 0);
		const totalVotes = Number(voteCount ?? bot?.voteCount ?? 0);

		const reviewList = Array.isArray(reviews) ? reviews : [];
		const reviewCount = reviewList.length;
		const avgRating = reviewCount > 0 ? Number((reviewList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1)) : 0;

		const canonicalUrl = `${appBase}/bots/${encodeURIComponent(slug)}`;
		const cardImageUrl = `${apiBase}/core/bots/${encodeURIComponent(botId)}?type=png`;

		const jsonLd: Record<string, any> = {
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			'@id': `${canonicalUrl}#bot`,
			name: `${name} Discord Bot`,
			alternateName: [name, `${name} Bot`],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: canonicalUrl,
			image: cardImageUrl,
			description,
			keywords: [name, `${name} Discord Bot`, 'Discord Bot', ...tags].join(', '),
			author: {
				'@type': 'Organization',
				name: 'Xernerx Studios',
				url: 'https://www.xernerx.com',
			},
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD',
			},
			...(reviewCount > 0
				? {
						aggregateRating: {
							'@type': 'AggregateRating',
							ratingValue: avgRating,
							reviewCount,
							bestRating: 5,
							worstRating: 1,
						},
					}
				: {}),
		};

		return {
			id: botId,
			slug,
			name,
			verified,
			description,
			info,
			tags,
			commands,
			guildCount,
			userCount,
			voteCount: totalVotes,
			canonicalUrl,
			jsonLd,
		};
	} catch {
		if (!official) return null;
		const canonicalUrl = `${appBase}/bots/${official.slug}`;
		const cardImageUrl = `${apiBase}/core/bots/${encodeURIComponent(official.id)}?type=png`;
		return {
			id: official.id,
			slug: official.slug,
			name: official.name,
			verified: true,
			description: official.description,
			info: official.info,
			tags: official.tags,
			commands: [],
			guildCount: 0,
			userCount: 0,
			voteCount: 0,
			canonicalUrl,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				'@id': `${canonicalUrl}#bot`,
				name: `${official.name} Discord Bot`,
				alternateName: [official.name, `${official.name} Bot`],
				applicationCategory: 'UtilitiesApplication',
				operatingSystem: 'Discord, Web',
				url: canonicalUrl,
				image: cardImageUrl,
				description: official.description,
				keywords: [official.name, `${official.name} Discord Bot`, 'Discord Bot', ...official.tags].join(', '),
				author: {
					'@type': 'Organization',
					name: 'Xernerx Studios',
					url: 'https://www.xernerx.com',
				},
			},
		};
	}
}

export async function buildBotMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/bots/${id}`;

	try {
		const seo = await getBotSeoData(id);
		if (!seo) {
			return buildFallbackMetadata(
				'Discord Bot Not Found',
				'This Discord bot profile is private or does not exist on the Xernerx Studios ecosystem directory. Explore public bots and commands.',
				canonicalPath,
				appBase,
				true
			);
		}

		const parts: string[] = [
			`🌐 Servers: ${Number(seo.guildCount).toLocaleString()}`,
			`👥 Users: ${Number(seo.userCount).toLocaleString()}`,
			`🔼 Votes: ${Number(seo.voteCount).toLocaleString()}`,
		];
		const statsDescription = parts.join(' • ');

		const hasBotWord = /\bbot\b/i.test(seo.name);
		const pageTitle = `${seo.name}${seo.verified ? ' ✓' : ''} — ${hasBotWord ? 'Discord App & Commands' : 'Discord Bot'}`;
		const ogTitle = `${seo.name}${seo.verified ? ' ✓' : ''} — Discord Bot`;
		const baseDescription = seo.description || seo.info || `Check out ${seo.name} Discord Bot on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const resolvedCanonicalPath = `/bots/${seo.slug}`;
		const currentUrl = `${appBase}${resolvedCanonicalPath}`;
		const cardImageUrl = `${apiBase}/core/bots/${encodeURIComponent(seo.id)}?type=png`;

		return {
			title: pageTitle,
			description: baseDescription,
			keywords: [seo.name, `${seo.name} Discord Bot`, `${seo.name} bot`, `${seo.name} commands`, 'Discord Bot', 'Xernerx Studios', ...seo.tags],
			alternates: { canonical: resolvedCanonicalPath },
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'website',
				title: ogTitle,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: `${seo.name} Discord Bot`,
					},
				],
			},
			twitter: {
				card: 'summary_large_image',
				title: ogTitle,
				description: ogDescription,
				images: [cardImageUrl],
			},
		};
	} catch {
		return buildFallbackMetadata(
			'Discord Bot Profile & Commands',
			'View Discord bot statistics, slash commands, server count metrics, and community reviews on the Xernerx Studios bot directory.',
			canonicalPath,
			appBase
		);
	}
}

export async function buildUserMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/users/${id}`;

	try {
		const db = await database('xernerx');
		const UserModel = (db.models.users as any).User;
		const CreditModel = (db.models.users as any).Credit;
		const BotModel = (db.models.bots as any).Bot;
		const OrganizationModel = (db.models.organizations as any).Organization;

		const user = await UserModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (user?.privacy === 'private') {
			return buildFallbackMetadata(
				'User Profile & Community Activity',
				'This user profile is private or does not exist on the Xernerx Studios platform. Explore public Discord bots, servers, and creators.',
				canonicalPath,
				appBase,
				true
			);
		}

		const resolvedId = String(user?.id || id);
		const [discordUser, creditDoc, botCount, orgCount] = await Promise.all([
			fetchDiscordUser(resolvedId),
			CreditModel.findOne({ ownerId: resolvedId })
				.select('streak')
				.lean()
				.catch(() => null),
			BotModel.countDocuments({ owners: resolvedId, privacy: 'public' }).catch(() => 0),
			OrganizationModel.countDocuments({
				$or: [{ owner: resolvedId }, { members: resolvedId }],
				$and: [{ $or: [{ 'config.privacy': 'public' }, { privacy: 'public' }] }],
			}).catch(() => 0),
		]);

		if (!user && !discordUser) {
			return buildFallbackMetadata(
				'User Profile & Community Activity',
				'This user profile is private or does not exist on the Xernerx Studios platform. Explore public Discord bots, servers, and creators.',
				canonicalPath,
				appBase,
				true
			);
		}

		const displayName = user?.name || discordUser?.global_name || discordUser?.username || 'Xernerx User';
		const username = discordUser?.username || null;
		const handle = username && username !== displayName ? `@${username}` : null;
		const streak = Number((creditDoc as any)?.streak || 0);

		const parts: string[] = [];
		if (streak > 0) parts.push(`🔥 Streak: ${streak.toLocaleString()}d`);
		if (botCount > 0) parts.push(`🤖 Bots: ${Number(botCount).toLocaleString()}`);
		if (orgCount > 0) parts.push(`🏢 Orgs: ${Number(orgCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const title = `${displayName}${user?.verified ? ' ✓' : ''}${handle ? ` (${handle})` : ''}`;
		const baseDescription = user?.description || user?.info || `Explore ${displayName}'s profile, published bots, and communities on Xernerx Studios.`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const resolvedCanonicalPath = `/users/${user?.vanitySlug || resolvedId}`;
		const currentUrl = `${appBase}${resolvedCanonicalPath}`;
		const cardImageUrl = `${apiBase}/core/users/${encodeURIComponent(resolvedId)}?type=png`;

		return {
			title,
			description: ogDescription,
			alternates: { canonical: resolvedCanonicalPath },
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'profile',
				title,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: displayName,
					},
				],
			},
			twitter: {
				card: 'summary_large_image',
				title,
				description: ogDescription,
				images: [cardImageUrl],
			},
		};
	} catch {
		return buildFallbackMetadata(
			'User Profile & Community Activity',
			'View user profiles, daily voting streaks, published Discord bots, and affiliated organizations on the Xernerx Studios ecosystem.',
			canonicalPath,
			appBase
		);
	}
}

export async function buildOrganizationMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/organization/${id}`;

	try {
		const db = await database('xernerx');
		const OrganizationModel = (db.models.organizations as any).Organization;
		const BotModel = (db.models.bots as any).Bot;
		const GuildModel = (db.models.guilds as any).Guild;

		const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
		const query = isObjectId ? { $or: [{ _id: id }, { vanitySlug: id.toLowerCase() }] } : { vanitySlug: id.toLowerCase() };
		const organization = await OrganizationModel.findOne(query).lean();
		const privacy = organization?.config?.privacy || organization?.privacy;

		if (!organization || privacy === 'private') {
			return buildFallbackMetadata(
				'Organization Profile Not Found',
				'This organization profile is private or does not exist on the Xernerx Studios platform. Explore public organizations and teams.',
				canonicalPath,
				appBase,
				true
			);
		}

		const orgId = String(organization._id);
		const [botCount, serverCount] = await Promise.all([
			BotModel.countDocuments({ organization: orgId, privacy: { $ne: 'private' } }).catch(() => 0),
			GuildModel.countDocuments({ organization: orgId, privacy: { $ne: 'private' } }).catch(() => 0),
		]);

		const memberCount = new Set([organization.owner, ...(organization.members || [])].filter(Boolean)).size;
		const name = organization.name || 'Organization';

		const parts: string[] = [`👥 Members: ${Number(memberCount).toLocaleString()}`, `🤖 Bots: ${Number(botCount).toLocaleString()}`, `🌐 Servers: ${Number(serverCount).toLocaleString()}`];
		const statsDescription = parts.join(' • ');

		const title = `${name}${organization.verified ? ' ✓' : ''}`;
		const baseDescription = organization.description || organization.info || `Check out ${name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const resolvedCanonicalPath = `/organization/${organization.vanitySlug || orgId}`;
		const currentUrl = `${appBase}${resolvedCanonicalPath}`;
		const cardImageUrl = `${apiBase}/core/organizations/${encodeURIComponent(orgId)}?type=png`;

		return {
			title,
			description: ogDescription,
			alternates: { canonical: resolvedCanonicalPath },
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'website',
				title,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: name,
					},
				],
			},
			twitter: {
				card: 'summary_large_image',
				title,
				description: ogDescription,
				images: [cardImageUrl],
			},
		};
	} catch {
		return buildFallbackMetadata(
			'Organization Profile & Team Directory',
			'View organization team members, published Discord bots, and official community servers on the Xernerx Studios ecosystem directory.',
			canonicalPath,
			appBase
		);
	}
}

export async function buildServerMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/servers/${id}`;

	try {
		const db = await database('xernerx');
		const GuildModel = (db.models.guilds as any).Guild;
		const StatModel = (db.models.guilds as any).Stat;
		const VoteModel = (db.models.guilds as any).Vote;

		const guild = await GuildModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!guild || guild.privacy === 'private') {
			return buildFallbackMetadata(
				'Discord Server Not Found',
				'This Discord server profile is private or does not exist on the Xernerx Studios community directory. Explore public Discord servers.',
				canonicalPath,
				appBase,
				true
			);
		}

		const guildId = String(guild.id);
		const [latestStat, voteCount] = await Promise.all([
			StatModel.findOne({ id: guildId })
				.sort({ timestamp: -1 })
				.lean()
				.catch(() => null),
			VoteModel.countDocuments({ guildId }).catch(() => guild.voteCount || 0),
		]);

		const name = guild.name || 'Discord Server';
		const memberCount = latestStat?.members ?? guild.memberCount ?? 0;
		const messageCount = latestStat?.messages ?? guild.messages ?? 0;
		const totalVotes = voteCount ?? guild.voteCount ?? 0;

		const parts: string[] = [`👥 Members: ${Number(memberCount).toLocaleString()}`, `💬 Messages: ${Number(messageCount).toLocaleString()}`, `🔼 Votes: ${Number(totalVotes).toLocaleString()}`];
		const statsDescription = parts.join(' • ');

		const title = `${name}${guild.verified ? ' ✓' : ''}`;
		const baseDescription = guild.description || guild.info || `Join ${name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const resolvedCanonicalPath = `/servers/${guild.vanitySlug || guildId}`;
		const currentUrl = `${appBase}${resolvedCanonicalPath}`;
		const cardImageUrl = `${apiBase}/core/guilds/${encodeURIComponent(guildId)}?type=png`;

		return {
			title,
			description: ogDescription,
			alternates: { canonical: resolvedCanonicalPath },
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'website',
				title,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: name,
					},
				],
			},
			twitter: {
				card: 'summary_large_image',
				title,
				description: ogDescription,
				images: [cardImageUrl],
			},
		};
	} catch {
		return buildFallbackMetadata(
			'Discord Server Profile & Community',
			'View Discord server member statistics, activity metrics, community information, and invite links on the Xernerx Studios directory.',
			canonicalPath,
			appBase
		);
	}
}
