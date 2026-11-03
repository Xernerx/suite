/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://blog.xernerx.com';
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 }];

	try {
		const db = await database('xernerx');
		const BlogPost = (db.models.core as any)?.BlogPost;
		if (BlogPost) {
			const publicPosts = await BlogPost.find({
				privacy: 'public',
				publishedAt: { $lte: now },
			})
				.sort({ publishedAt: -1 })
				.select('slug updatedAt publishedAt createdAt')
				.limit(200)
				.lean()
				.catch(() => []);

			for (const post of publicPosts) {
				if (!post.slug) continue;
				entries.push({
					url: `${baseUrl}/${encodeURIComponent(String(post.slug))}`,
					lastModified: post.updatedAt || post.publishedAt || post.createdAt ? new Date(post.updatedAt || post.publishedAt || post.createdAt) : now,
					changeFrequency: 'weekly',
					priority: 0.8,
				});
			}
		}
	} catch {
		// Gracefully fall back if database is unreachable during build
	}

	return entries;
}
