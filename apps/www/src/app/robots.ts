/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const disallowPaths = ['/api/', '/invites/*/essential', '/invites/*/optional', '/invites/*/advanced', '/invite/*/essential', '/invite/*/optional', '/invite/*/advanced'];

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: disallowPaths,
			},
			{
				userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'],
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: disallowPaths,
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
