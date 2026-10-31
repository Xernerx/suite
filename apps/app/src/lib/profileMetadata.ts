/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { database } from '@xernerx/lib/server';

const discordUserCache = new Map<string, { payload: any; expiresAt: number }>();
const DISCORD_CACHE_TTL_MS = 5 * 60 * 1000;

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

export async function buildBotMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/bots/${id}`;

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const VoteModel = (db.models.bots as any).Vote;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!bot || bot.privacy === 'private') {
			return buildFallbackMetadata(
				'Discord Bot Not Found',
				'This Discord bot profile is private or does not exist on the Xernerx Studios ecosystem directory. Explore public bots and commands.',
				canonicalPath,
				appBase,
				true
			);
		}

		const botId = String(bot.id);
		const [latestStat, voteCount, discordUser] = await Promise.all([
			StatModel.findOne({ id: botId })
				.sort({ timestamp: -1 })
				.lean()
				.catch(() => null),
			VoteModel.countDocuments({ botId }).catch(() => bot.voteCount || 0),
			fetchDiscordUser(botId),
		]);

		const name = discordUser?.global_name || discordUser?.username || bot.name || 'Discord Bot';
		const guildCount = latestStat?.guildCount ?? latestStat?.servers ?? 0;
		const userCount = latestStat?.userCount ?? latestStat?.users ?? 0;
		const totalVotes = voteCount ?? bot.voteCount ?? 0;

		const parts: string[] = [`🌐 Servers: ${Number(guildCount).toLocaleString()}`, `👥 Users: ${Number(userCount).toLocaleString()}`, `🔼 Votes: ${Number(totalVotes).toLocaleString()}`];
		const statsDescription = parts.join(' • ');

		const title = `${name}${bot.verified ? ' ✓' : ''}`;
		const baseDescription = bot.description || bot.info || `Check out ${name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const resolvedCanonicalPath = `/bots/${bot.vanitySlug || botId}`;
		const currentUrl = `${appBase}${resolvedCanonicalPath}`;
		const cardImageUrl = `${apiBase}/core/bots/${encodeURIComponent(botId)}?type=png`;

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
