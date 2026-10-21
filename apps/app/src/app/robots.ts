/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/', '/bots', '/servers', '/leaderboard', '/users', '/organization'],
			disallow: ['/api/', '/portal', '/dashboard', '/overlay'],
		},
		sitemap: 'https://app.xernerx.com/sitemap.xml',
	};
}
