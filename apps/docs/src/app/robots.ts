/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: ['/', '/llms.txt'],
				disallow: ['/api/'],
			},
			{
				userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'],
				allow: ['/', '/llms.txt'],
				disallow: ['/api/'],
			},
		],
		sitemap: 'https://docs.xernerx.com/sitemap.xml',
	};
}
