/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';
import { buildFallbackMetadata, fetchDiscordUser, resolveEnvUrls, type EntitySeoSummary } from './profileMetadataShared';

export { resolveEnvUrls, resolveOfficialBotDefault, type EntitySeoSummary, type OfficialBotDefault } from './profileMetadataShared';
export { buildBotMetadata, getBotSeoData, type BotSeoData } from './profileMetadataBot';
export { buildOrganizationMetadata, buildServerMetadata, getOrganizationSeoData, getServerSeoData } from './profileMetadataCommunity';

export async function buildUserMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/users/${id}`;

	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const UserModel = (db.models.users as any).User;
			const CreditModel = (db.models.users as any).Credit;
			const BotModel = (db.models.bots as any).Bot;
			const OrganizationModel = (db.models.organizations as any).Organization;

			const user = await UserModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
			if (user?.privacy === 'private' || user?.blacklisted) {
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: displayName }],
				},
				twitter: {
					card: 'summary_large_image',
					site: '@XernerxStudios',
					creator: '@XernerxStudios',
					title,
					description: ogDescription,
					images: [cardImageUrl],
				},
			};
		} catch {
			// Fall through to /core/users/[id] API lookup
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/users/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (res.status === 404) {
			return buildFallbackMetadata(
				'User Profile & Community Activity',
				'This user profile is private or does not exist on the Xernerx Studios platform. Explore public Discord bots, servers, and creators.',
				canonicalPath,
				appBase,
				true
			);
		}
		if (res.ok) {
			const u = await res.json();
			const resolvedId = String(u.id || id);
			const displayName = u.name || 'Xernerx User';
			const title = `${displayName}${u.verified ? ' ✓' : ''}${u.handle ? ` (${u.handle})` : ''}`;
			const baseDescription = u.description || `Explore ${displayName}'s profile, published bots, and communities on Xernerx Studios.`;
			const parts: string[] = [];
			if (u.streak > 0) parts.push(`🔥 Streak: ${Number(u.streak).toLocaleString()}d`);
			if (u.botCount > 0) parts.push(`🤖 Bots: ${Number(u.botCount).toLocaleString()}`);
			if (u.orgCount > 0) parts.push(`🏢 Orgs: ${Number(u.orgCount).toLocaleString()}`);
			const statsDescription = parts.join(' • ');
			const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
			const resolvedCanonicalPath = `/users/${u.vanitySlug || resolvedId}`;
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: displayName }],
				},
				twitter: {
					card: 'summary_large_image',
					site: '@XernerxStudios',
					creator: '@XernerxStudios',
					title,
					description: ogDescription,
					images: [cardImageUrl],
				},
			};
		}
	} catch {
		// Fall through
	}

	return buildFallbackMetadata(
		'User Profile & Community Activity',
		'View user profiles, daily voting streaks, published Discord bots, and affiliated organizations on the Xernerx Studios ecosystem.',
		canonicalPath,
		appBase
	);
}

export async function getUserSeoData(id: string): Promise<EntitySeoSummary | null> {
	const { apiBase, appBase } = await resolveEnvUrls();
	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const UserModel = (db.models.users as any).User;
			const user = await UserModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
			if (!user || user.privacy === 'private' || user.blacklisted) return null;

			const resolvedId = String(user.id || id);
			const discordUser = await fetchDiscordUser(resolvedId);
			const name = String(user.name || discordUser?.global_name || discordUser?.username || 'Xernerx User');
			const description = String(user.description || `Explore ${name}'s profile, published Discord bots, and communities on Xernerx Studios.`);
			const info = String(user.info || description);
			const canonicalUrl = `${appBase}/users/${encodeURIComponent(String(user.vanitySlug || resolvedId))}`;

			return {
				name,
				description,
				info,
				tags: [],
				canonicalUrl,
				jsonLd: {
					'@context': 'https://schema.org',
					'@type': 'ProfilePage',
					'@id': `${canonicalUrl}#profile`,
					url: canonicalUrl,
					mainEntity: {
						'@type': 'Person',
						name,
						description,
						url: canonicalUrl,
					},
				},
			};
		} catch {
			// Fall through to API
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/users/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (!res.ok) return null;
		const u = await res.json();
		const name = String(u.name || 'Xernerx User');
		const description = String(u.description || `Explore ${name}'s profile, published Discord bots, and communities on Xernerx Studios.`);
		const canonicalUrl = `${appBase}/users/${encodeURIComponent(String(u.vanitySlug || u.id))}`;

		return {
			name,
			description,
			info: description,
			tags: [],
			canonicalUrl,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'ProfilePage',
				'@id': `${canonicalUrl}#profile`,
				url: canonicalUrl,
				mainEntity: {
					'@type': 'Person',
					name,
					description,
					url: canonicalUrl,
				},
			},
		};
	} catch {
		return null;
	}
}
