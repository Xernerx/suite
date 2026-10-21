/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/', '/login'],
			disallow: ['/api/', '/login/qr', '/login/approve', '/logout'],
		},
		sitemap: 'https://account.xernerx.com/sitemap.xml',
	};
}
