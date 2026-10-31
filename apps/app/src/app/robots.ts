/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/', '/bots', '/servers', '/leaderboard', '/dashboard', '/users', '/organization'],
			disallow: ['/api/', '/portal', '/overlay'],
		},
		sitemap: 'https://app.xernerx.com/sitemap.xml',
	};
}
