/** @format */

import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';
import BlogArticleClient from '@/components/BlogArticleClient';
import type { BlogPostItem, ReactionKey } from '@/components/types';

export const dynamic = 'force-dynamic';

const REACTION_KEYS: ReactionKey[] = ['rocket', 'heart', 'sparkles', 'shield', 'fire'];

function serializeBlogPost(doc: any): BlogPostItem {
	const rawReactions = doc.reactions && typeof doc.reactions === 'object' ? doc.reactions : {};
	const reactionCounts: Record<ReactionKey, number> = {
		rocket: 0,
		heart: 0,
		sparkles: 0,
		shield: 0,
		fire: 0,
	};
	let totalReactions = 0;
	for (const key of REACTION_KEYS) {
		const arr = Array.isArray(rawReactions[key]) ? rawReactions[key] : [];
		reactionCounts[key] = arr.length;
		totalReactions += arr.length;
	}

	return {
		id: String(doc.id || doc._id),
		slug: String(doc.slug || doc.id),
		title: String(doc.title || ''),
		subtitle: String(doc.subtitle || ''),
		content: String(doc.content || ''),
		coverImage: doc.coverImage || null,
		coverGradient: doc.coverGradient || 'accent',
		category: doc.category || 'announcements',
		audience: doc.audience || 'all',
		tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
		privacy: doc.privacy || 'public',
		featured: Boolean(doc.featured),
		readingTimeMinutes: Number(doc.readingTimeMinutes || 3),
		author: {
			id: String(doc.author?.id || 'system'),
			username: String(doc.author?.username || 'Xernerx Studios'),
			globalName: String(doc.author?.globalName || 'Xernerx Studios'),
			avatar: doc.author?.avatar || null,
			role: String(doc.author?.role || 'Xernerx Team'),
		},
		publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : new Date().toISOString(),
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
		views: Number(doc.views || 0),
		reactionCounts,
		totalReactions,
		viewerReactions: [],
		linkedAnnouncementId: doc.linkedAnnouncementId || null,
	};
}

async function fetchPublicOrLimitedBlogPost(slug: string): Promise<BlogPostItem | null> {
	if (process.env.MONGO_XERNERX) {
		try {
			const { models } = await database('xernerx');
			const BlogPost = (models.core as any)?.BlogPost;
			if (BlogPost) {
				const post = await BlogPost.findOne({ $or: [{ slug }, { id: slug }] }).lean();
				if (post) {
					return post.privacy === 'private' ? null : serializeBlogPost(post);
				}
			}
		} catch {
			// Fall through to public API lookup
		}
	}

	try {
		const domain = process.env.DOMAIN || 'xernerx.com';
		const envVar = (process.env.ENVIRONMENT || '').toLowerCase();
		const apiBase = envVar === 'canary' ? `https://api.canary.${domain}` : envVar === 'development' ? 'http://localhost:4001' : `https://api.${domain}`;
		const res = await fetch(`${apiBase}/core/blog/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
		if (!res.ok) return null;
		const data = await res.json();
		const post = data?.post || data;
		if (!post || post.privacy === 'private') return null;
		return serializeBlogPost(post);
	} catch {
		return null;
	}
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const post = await fetchPublicOrLimitedBlogPost(slug);

	if (post) {
		const url = `https://blog.xernerx.com/${post.slug}`;
		return {
			title: post.title,
			description: post.subtitle || 'Read the full article on Xernerx Blog.',
			keywords: ['Xernerx', 'Xernerx Studios', 'Xernerx Blog', post.category, ...post.tags],
			alternates: { canonical: url },
			...(post.privacy === 'limited' ? { robots: { index: false, follow: true } } : {}),
			openGraph: {
				title: `${post.title} | Xernerx Blog`,
				description: post.subtitle || 'Read the full article on Xernerx Blog.',
				url,
				siteName: 'Xernerx Blog',
				type: 'article',
				publishedTime: post.publishedAt,
				modifiedTime: post.updatedAt || post.publishedAt,
				authors: [post.author?.globalName || 'Xernerx Studios'],
				tags: post.tags,
				images: [{ url: post.coverImage || '/opengraph-image', width: 1200, height: 630, alt: post.title }],
			},
			twitter: {
				card: 'summary_large_image',
				title: `${post.title} | Xernerx Blog`,
				description: post.subtitle || 'Read the full article on Xernerx Blog.',
				images: [post.coverImage || '/opengraph-image'],
			},
		};
	}

	return {
		title: 'Article',
		description: 'Read official announcements, security advisories, and engineering deep-dives on Xernerx Blog.',
	};
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await fetchPublicOrLimitedBlogPost(slug);

	const jsonLd = post
		? {
				'@context': 'https://schema.org',
				'@graph': [
					{
						'@type': 'BlogPosting',
						'@id': `https://blog.xernerx.com/${post.slug}#article`,
						headline: post.title,
						description: post.subtitle,
						url: `https://blog.xernerx.com/${post.slug}`,
						datePublished: post.publishedAt,
						dateModified: post.updatedAt || post.publishedAt,
						articleSection: post.category,
						keywords: post.tags.join(', '),
						author: {
							'@type': 'Person',
							name: post.author.globalName || post.author.username || 'Xernerx Studios',
							jobTitle: post.author.role || 'Xernerx Team',
						},
						publisher: {
							'@type': 'Organization',
							name: 'Xernerx Studios',
							url: 'https://www.xernerx.com',
							logo: {
								'@type': 'ImageObject',
								url: 'https://www.xernerx.com/logo.png',
							},
						},
						mainEntityOfPage: {
							'@type': 'WebPage',
							'@id': `https://blog.xernerx.com/${post.slug}`,
						},
					},
					{
						'@type': 'BreadcrumbList',
						itemListElement: [
							{
								'@type': 'ListItem',
								position: 1,
								name: 'Xernerx Newsroom & Blog',
								item: 'https://blog.xernerx.com',
							},
							{
								'@type': 'ListItem',
								position: 2,
								name: post.title,
								item: `https://blog.xernerx.com/${post.slug}`,
							},
						],
					},
				],
			}
		: null;

	return (
		<>
			{jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
			{post && (
				<article className="sr-only">
					<h1>{post.title}</h1>
					<p>{post.subtitle}</p>
					<div>{post.content}</div>
				</article>
			)}
			<BlogArticleClient slug={slug} initialPost={post} />
		</>
	);
}
