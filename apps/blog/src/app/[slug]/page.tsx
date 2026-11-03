/** @format */

import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';
import BlogArticleClient from '@/components/BlogArticleClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;

	try {
		const { models } = await database('xernerx');
		const BlogPost = (models.core as any)?.BlogPost;
		if (BlogPost) {
			const post = await BlogPost.findOne({ $or: [{ slug }, { id: slug }] }).lean();
			if (post && post.privacy !== 'private') {
				const url = `https://blog.xernerx.com/${post.slug}`;
				return {
					title: post.title,
					description: post.subtitle || 'Read the full article on Xernerx Blog.',
					alternates: { canonical: url },
					openGraph: {
						title: `${post.title} | Xernerx Blog`,
						description: post.subtitle || 'Read the full article on Xernerx Blog.',
						url,
						siteName: 'Xernerx Blog',
						type: 'article',
						publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
						authors: [post.author?.globalName || 'Xernerx Studios'],
						tags: Array.isArray(post.tags) ? post.tags : [],
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
		}
	} catch {}

	return {
		title: 'Article',
		description: 'Read official announcements, security advisories, and engineering deep-dives on Xernerx Blog.',
	};
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	return <BlogArticleClient slug={slug} />;
}
