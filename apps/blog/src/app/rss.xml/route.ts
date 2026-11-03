/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
	return String(str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export async function GET() {
	const baseUrl = 'https://blog.xernerx.com';
	let itemsXml = '';

	try {
		const { models } = await database('xernerx');
		const BlogPost = (models.core as any)?.BlogPost;
		if (BlogPost) {
			const posts = await BlogPost.find({
				privacy: 'public',
				publishedAt: { $lte: new Date() },
			})
				.sort({ publishedAt: -1 })
				.limit(40)
				.lean();

			itemsXml = posts
				.map((post: any) => {
					const url = `${baseUrl}/${encodeURIComponent(post.slug)}`;
					const pubDate = new Date(post.publishedAt || post.createdAt || Date.now()).toUTCString();
					return `		<item>
			<title>${escapeXml(post.title)}</title>
			<link>${url}</link>
			<guid isPermaLink="true">${url}</guid>
			<pubDate>${pubDate}</pubDate>
			<category>${escapeXml(post.category || 'announcements')}</category>
			<description>${escapeXml(post.subtitle || '')}</description>
		</item>`;
				})
				.join('\n');
		}
	} catch {
		// Fallback to empty items if DB is unavailable
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Xernerx Blog — Announcements, Security &amp; Engineering</title>
		<link>${baseUrl}</link>
		<description>Official announcements, security advisories, product updates, and engineering deep-dives from Xernerx Studios.</description>
		<language>en-gb</language>
		<atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
	</channel>
</rss>`;

	return new NextResponse(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600, s-maxage=600',
		},
	});
}
