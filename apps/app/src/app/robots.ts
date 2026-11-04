/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: ['/', '/bots', '/servers', '/leaderboard', '/users', '/organization', '/llms.txt'],
				disallow: ['/api/', '/portal', '/overlay', '/dashboard'],
			},
			{
				userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'],
				allow: ['/', '/bots', '/servers', '/leaderboard', '/users', '/organization', '/llms.txt'],
				disallow: ['/api/', '/portal', '/overlay', '/dashboard'],
			},
		],
		sitemap: 'https://app.xernerx.com/sitemap.xml',
	};
}
