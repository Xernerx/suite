/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { DEFAULT_BLOG_POSTS, ensureSeededBlogPosts, serializeBlogPost } from '@/lib/defaultBlogPosts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const category = searchParams.get('category');
		const audience = searchParams.get('audience');
		const tag = searchParams.get('tag');
		const q = (searchParams.get('q') || '').trim().toLowerCase();
		const featuredOnly = searchParams.get('featured') === 'true';
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;

		await ensureSeededBlogPosts(BlogPost);

		const caller = await resolveCallerAuth(req).catch(() => ({ userId: null }));
		const now = new Date();

		const query: Record<string, any> = {
			privacy: 'public',
			publishedAt: { $lte: now },
		};

		if (category && category !== 'all') {
			query.category = category;
		}
		if (audience && audience !== 'all') {
			query.$or = [{ audience }, { audience: 'all' }];
		}
		if (tag) {
			query.tags = tag;
		}
		if (featuredOnly) {
			query.featured = true;
		}

		let docs = await BlogPost.find(query).sort({ featured: -1, publishedAt: -1, createdAt: -1 }).limit(limit).lean();

		if (q) {
			docs = docs.filter((d: any) => {
				const hay = `${d.title || ''} ${d.subtitle || ''} ${d.category || ''} ${(d.tags || []).join(' ')} ${d.author?.globalName || ''}`.toLowerCase();
				return q.split(/\s+/).every((tok) => hay.includes(tok));
			});
		}

		const posts = docs.map((d: any) => serializeBlogPost(d, caller?.userId, false));

		const allTagsSet = new Set<string>();
		for (const d of docs) {
			if (Array.isArray(d.tags)) {
				d.tags.forEach((t: string) => t && allTagsSet.add(t));
			}
		}

		return NextResponse.json({
			posts,
			tags: Array.from(allTagsSet),
		});
	} catch (err: any) {
		console.warn('Falling back to default blog posts on /core/blog error:', err?.message);
		const fallbackPosts = DEFAULT_BLOG_POSTS.map((d) => serializeBlogPost(d, null, false));
		const fallbackTags = Array.from(new Set(DEFAULT_BLOG_POSTS.flatMap((d) => d.tags || [])));
		return NextResponse.json({ posts: fallbackPosts, tags: fallbackTags });
	}
}
