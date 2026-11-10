/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://blog.xernerx.com';
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 }];

	let addedPosts = false;
	if (process.env.MONGO_XERNERX) {
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
					addedPosts = true;
					entries.push({
						url: `${baseUrl}/${encodeURIComponent(String(post.slug))}`,
						lastModified: post.updatedAt || post.publishedAt || post.createdAt ? new Date(post.updatedAt || post.publishedAt || post.createdAt) : now,
						changeFrequency: 'weekly',
						priority: 0.8,
					});
				}
			}
		} catch {
			// Fall through to /core/blog API
		}
	}

	if (!addedPosts) {
		try {
			const res = await fetch('https://api.xernerx.com/core/blog?limit=200', { next: { revalidate: 3600 } });
			if (res.ok) {
				const data = await res.json();
				const posts = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
				for (const post of posts) {
					if (!post?.slug || post.privacy === 'private' || post.privacy === 'limited') continue;
					entries.push({
						url: `${baseUrl}/${encodeURIComponent(String(post.slug))}`,
						lastModified: post.updatedAt || post.publishedAt ? new Date(post.updatedAt || post.publishedAt) : now,
						changeFrequency: 'weekly',
						priority: 0.8,
					});
				}
			}
		} catch {
			// Gracefully fall back if API is unreachable during build
		}
	}

	return entries;
}
