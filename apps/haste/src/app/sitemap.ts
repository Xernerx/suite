/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://haste.xernerx.com';
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 }];

	try {
		const db = await database('xernerx');
		const PasteModel = (db.models.core as any)?.Paste || (db.models as any)?.Paste;
		if (PasteModel) {
			const publicPastes = await PasteModel.find({
				privacy: 'public',
				$or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
			})
				.sort({ createdAt: -1 })
				.select('id updatedAt createdAt')
				.limit(200)
				.lean()
				.catch(() => []);

			for (const paste of publicPastes) {
				if (!paste.id) continue;
				entries.push({
					url: `${baseUrl}/${encodeURIComponent(String(paste.id))}`,
					lastModified: paste.updatedAt || paste.createdAt ? new Date(paste.updatedAt || paste.createdAt) : now,
					changeFrequency: 'weekly',
					priority: 0.7,
				});
			}
		}
	} catch {
		// Gracefully fall back if database is unreachable during build
	}

	return entries;
}
