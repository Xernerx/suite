/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: ['/', '/llms.txt', '/rss.xml'],
				disallow: ['/api/'],
			},
			{
				userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'],
				allow: ['/', '/llms.txt', '/rss.xml'],
				disallow: ['/api/'],
			},
		],
		sitemap: 'https://blog.xernerx.com/sitemap.xml',
	};
}
