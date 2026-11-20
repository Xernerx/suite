/** @format */

import { MetadataRoute } from 'next';
import { getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { DEFAULT_OFFICIAL_INVITES } from '@/lib/defaultOfficialInvites';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://www.xernerx.com';
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [
		{ url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: `${baseUrl}/download`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: `${baseUrl}/invites`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
		{ url: `${baseUrl}/applications`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
		{ url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
		{ url: `${baseUrl}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
		{ url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: `${baseUrl}/license`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
	];

	// Include canonical multi-option invite chooser pages (never /invites/<bot>/<preset> OAuth redirect endpoints)
	const seenInviteIds = new Set<string>();
	for (const inv of DEFAULT_OFFICIAL_INVITES) {
		if (getEnabledInviteOptions(inv).length > 1) {
			seenInviteIds.add(inv.id.toLowerCase());
			entries.push({
				url: `${baseUrl}/invites/${encodeURIComponent(inv.id)}`,
				lastModified: now,
				changeFrequency: 'weekly',
				priority: 0.8,
			});
		}
	}

	if (process.env.MONGO_XERNERX) {
		try {
			const db = await database('xernerx');
			const AppInviteModel = (db.models.core as any)?.AppInvite;
			if (AppInviteModel) {
				const invites = await AppInviteModel.find({})
					.select('id options permissions updatedAt')
					.limit(100)
					.lean()
					.catch(() => []);
				for (const inv of invites) {
					const id = String(inv?.id || '').trim();
					if (!id || seenInviteIds.has(id.toLowerCase())) continue;
					if (getEnabledInviteOptions(inv).length <= 1) continue;
					seenInviteIds.add(id.toLowerCase());
					entries.push({
						url: `${baseUrl}/invites/${encodeURIComponent(id)}`,
						lastModified: inv.updatedAt ? new Date(inv.updatedAt) : now,
						changeFrequency: 'weekly',
						priority: 0.75,
					});
				}
			}
		} catch {
			// Gracefully fall back to static entries if database is unreachable during build
		}
	}

	return entries;
}
