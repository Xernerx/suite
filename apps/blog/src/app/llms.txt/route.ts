/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { FALLBACK_BLOG_POSTS } from '@/lib/fallbackPosts';

export const revalidate = 3600;

interface LlmsArticleEntry {
	slug: string;
	title: string;
	subtitle: string;
	category: string;
	publishedAt: string;
	tags: string[];
}

async function fetchPublishedBlogPosts(): Promise<LlmsArticleEntry[]> {
	const now = new Date();
	const posts: LlmsArticleEntry[] = [];
	const seen = new Set<string>();

	const pushPost = (raw: any) => {
		const slug = String(raw?.slug || '').trim();
		const title = String(raw?.title || '').trim();
		if (!slug || !title || seen.has(slug) || raw?.privacy === 'private' || raw?.privacy === 'limited') return;
		seen.add(slug);
		posts.push({
			slug,
			title,
			subtitle: String(raw?.subtitle || '').trim(),
			category: String(raw?.category || 'announcements').trim(),
			publishedAt: raw?.publishedAt ? new Date(raw.publishedAt).toISOString().split('T')[0] : '',
			tags: Array.isArray(raw?.tags) ? raw.tags.map(String) : [],
		});
	};

	if (process.env.MONGO_XERNERX) {
		try {
			const dbResult = await Promise.race([
				(async () => {
					const { models } = await database('xernerx');
					const BlogPost = (models.core as any)?.BlogPost;
					if (!BlogPost) return [];
					return BlogPost.find({
						privacy: 'public',
						publishedAt: { $lte: now },
					})
						.sort({ publishedAt: -1 })
						.select('slug title subtitle category publishedAt tags privacy')
						.limit(100)
						.lean();
				})(),
				new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
			]);

			if (Array.isArray(dbResult)) {
				for (const doc of dbResult) pushPost(doc);
			}
		} catch {
			// Fall through to public API
		}
	}

	if (posts.length === 0) {
		try {
			const res = await fetch('https://api.xernerx.com/core/blog?limit=100', {
				signal: AbortSignal.timeout(2500),
				next: { revalidate: 3600 },
			});
			if (res.ok) {
				const data = await res.json();
				const list = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
				for (const item of list) pushPost(item);
			}
		} catch {
			// Fall through to built-in fallback articles
		}
	}

	if (posts.length === 0) {
		for (const fallback of FALLBACK_BLOG_POSTS) pushPost(fallback);
	}

	return posts;
}

export async function GET() {
	const posts = await fetchPublishedBlogPosts();
	const articleLines = posts
		.map((post) => {
			const url = `https://blog.xernerx.com/${encodeURIComponent(post.slug)}`;
			const metaParts = [post.category, post.publishedAt].filter(Boolean).join(' · ');
			const summary = post.subtitle || 'Official Xernerx Studios announcement and engineering update.';
			return `- [${post.title}](${url})${metaParts ? ` (${metaParts})` : ''}: ${summary}`;
		})
		.join('\n');

	const body = `# Xernerx Newsroom & Blog (blog.xernerx.com/llms.txt)

> Official announcements, platform security architecture deep-dives, product releases, and engineering updates from Xernerx Studios.

## Published Articles

${articleLines}

## Feeds & Related Resources

- [Xernerx Blog RSS Feed](https://blog.xernerx.com/rss.xml): Syndicated XML feed of official newsroom articles.
- [Xernerx Studios Ecosystem Index](https://www.xernerx.com/llms.txt): Overview of official Discord bots (Virtue, YourApps, To-Do List Bot, Metamorphosis, Zodiac), Suite web apps, and SDKs.
- [Xernerx Developer Documentation](https://docs.xernerx.com/llms.txt): Interactive v1 REST API, WebSocket RPC, Media CDN, and open-source TypeScript package references.
- [Platform & Bot Security Hub](https://www.xernerx.com/security): Zero message content logging, 3-Tier Privacy Truth, and cryptographic webhook verification.
`;

	return new NextResponse(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
}
