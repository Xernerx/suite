/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/', '/bots', '/servers'],
			disallow: ['/api/', '/portal'],
		},
		sitemap: 'https://app.xernerx.com/sitemap.xml',
	};
}
