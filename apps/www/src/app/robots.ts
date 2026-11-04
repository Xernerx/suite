/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/api/'],
			},
			{
				userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'],
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/api/'],
			},
		],
		sitemap: [
			'https://www.xernerx.com/sitemap.xml',
			'https://app.xernerx.com/sitemap.xml',
			'https://docs.xernerx.com/sitemap.xml',
			'https://info.xernerx.com/sitemap.xml',
			'https://blog.xernerx.com/sitemap.xml',
			'https://store.xernerx.com/sitemap.xml',
		],
	};
}
