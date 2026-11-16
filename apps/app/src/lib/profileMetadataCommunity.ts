/** @format */

import 'server-only';
import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';
import { buildFallbackMetadata, resolveEnvUrls, type EntitySeoSummary } from './profileMetadataShared';

export async function buildOrganizationMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/organization/${id}`;

	if (process.env.MONGO_XERNERX) {
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: name }],
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
			// Fall through to /core/organizations/[id]
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/organizations/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (res.status === 404) {
			return buildFallbackMetadata(
				'Organization Profile Not Found',
				'This organization profile is private or does not exist on the Xernerx Studios platform. Explore public organizations and teams.',
				canonicalPath,
				appBase,
				true
			);
		}
		if (res.ok) {
			const org = await res.json();
			const orgId = String(org.id || id);
			const name = org.name || 'Organization';
			const parts: string[] = [
				`👥 Members: ${Number(org.memberCount ?? 0).toLocaleString()}`,
				`🤖 Bots: ${Number(org.botCount ?? 0).toLocaleString()}`,
				`🌐 Servers: ${Number(org.serverCount ?? 0).toLocaleString()}`,
			];
			const statsDescription = parts.join(' • ');
			const title = `${name}${org.verified ? ' ✓' : ''}`;
			const baseDescription = org.description || org.info || `Check out ${name} on Xernerx Studios!`;
			const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
			const resolvedCanonicalPath = `/organization/${org.vanitySlug || orgId}`;
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: name }],
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
		'Organization Profile & Team Directory',
		'View organization team members, published Discord bots, and official community servers on the Xernerx Studios ecosystem directory.',
		canonicalPath,
		appBase
	);
}

export async function buildServerMetadata(id: string): Promise<Metadata> {
	const { apiBase, appBase } = await resolveEnvUrls();
	const canonicalPath = `/servers/${id}`;

	if (process.env.MONGO_XERNERX) {
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

			const parts: string[] = [
				`👥 Members: ${Number(memberCount).toLocaleString()}`,
				`💬 Messages: ${Number(messageCount).toLocaleString()}`,
				`🔼 Votes: ${Number(totalVotes).toLocaleString()}`,
			];
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: name }],
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
			// Fall through to /core/guilds/[id]
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/guilds/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (res.status === 404) {
			return buildFallbackMetadata(
				'Discord Server Not Found',
				'This Discord server profile is private or does not exist on the Xernerx Studios community directory. Explore public Discord servers.',
				canonicalPath,
				appBase,
				true
			);
		}
		if (res.ok) {
			const g = await res.json();
			const guildId = String(g.id || id);
			const name = g.name || 'Discord Server';
			const parts: string[] = [
				`👥 Members: ${Number(g.memberCount ?? 0).toLocaleString()}`,
				`💬 Messages: ${Number(g.messageCount ?? 0).toLocaleString()}`,
				`🔼 Votes: ${Number(g.voteCount ?? 0).toLocaleString()}`,
			];
			const statsDescription = parts.join(' • ');
			const title = `${name}${g.verified ? ' ✓' : ''}`;
			const baseDescription = g.description || g.info || `Join ${name} on Xernerx Studios!`;
			const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
			const resolvedCanonicalPath = `/servers/${g.vanitySlug || guildId}`;
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
					images: [{ url: cardImageUrl, width: 840, height: 360, alt: name }],
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
		'Discord Server Profile & Community',
		'View Discord server member statistics, activity metrics, community information, and invite links on the Xernerx Studios directory.',
		canonicalPath,
		appBase
	);
}

export async function getServerSeoData(id: string): Promise<EntitySeoSummary | null> {
	const { apiBase, appBase } = await resolveEnvUrls();
	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const GuildModel = (db.models.guilds as any).Guild;
			const guild = await GuildModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
			if (!guild || guild.privacy === 'private') return null;

			const name = String(guild.name || 'Discord Server');
			const description = String(guild.description || `Join the ${name} Discord community on Xernerx Studios.`);
			const info = String(guild.info || description);
			const tags: string[] = Array.isArray(guild.tags) ? guild.tags.map(String) : [];
			const canonicalUrl = `${appBase}/servers/${encodeURIComponent(String(guild.vanitySlug || guild.id))}`;

			return {
				name,
				description,
				info,
				tags,
				canonicalUrl,
				jsonLd: {
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'@id': `${canonicalUrl}#server`,
					name,
					description,
					url: canonicalUrl,
				},
			};
		} catch {
			// Fall through to API
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/guilds/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (!res.ok) return null;
		const g = await res.json();
		const name = String(g.name || 'Discord Server');
		const description = String(g.description || `Join the ${name} Discord community on Xernerx Studios.`);
		const info = String(g.info || description);
		const tags: string[] = Array.isArray(g.tags) ? g.tags.map(String) : [];
		const canonicalUrl = `${appBase}/servers/${encodeURIComponent(String(g.vanitySlug || g.id))}`;

		return {
			name,
			description,
			info,
			tags,
			canonicalUrl,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				'@id': `${canonicalUrl}#server`,
				name,
				description,
				url: canonicalUrl,
			},
		};
	} catch {
		return null;
	}
}

export async function getOrganizationSeoData(id: string): Promise<EntitySeoSummary | null> {
	const { apiBase, appBase } = await resolveEnvUrls();
	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const OrganizationModel = (db.models.organizations as any).Organization;
			const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
			const query = isObjectId ? { $or: [{ _id: id }, { vanitySlug: id.toLowerCase() }] } : { vanitySlug: id.toLowerCase() };
			const org = await OrganizationModel.findOne(query).lean();
			const privacy = org?.config?.privacy || org?.privacy;
			if (!org || privacy === 'private') return null;

			const name = String(org.name || 'Organization');
			const description = String(org.description || `Explore ${name}'s published Discord bots and communities on Xernerx Studios.`);
			const info = String(org.info || description);
			const canonicalUrl = `${appBase}/organization/${encodeURIComponent(String(org.vanitySlug || org._id))}`;

			return {
				name,
				description,
				info,
				tags: [],
				canonicalUrl,
				jsonLd: {
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'@id': `${canonicalUrl}#organization`,
					name,
					description,
					url: canonicalUrl,
				},
			};
		} catch {
			// Fall through to API
		}
	}

	try {
		const res = await fetch(`${apiBase}/core/organizations/${encodeURIComponent(id)}?type=json`, { next: { revalidate: 300 } });
		if (!res.ok) return null;
		const org = await res.json();
		const name = String(org.name || 'Organization');
		const description = String(org.description || `Explore ${name}'s published Discord bots and communities on Xernerx Studios.`);
		const info = String(org.info || description);
		const canonicalUrl = `${appBase}/organization/${encodeURIComponent(String(org.vanitySlug || org.id))}`;

		return {
			name,
			description,
			info,
			tags: [],
			canonicalUrl,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				'@id': `${canonicalUrl}#organization`,
				name,
				description,
				url: canonicalUrl,
			},
		};
	} catch {
		return null;
	}
}
