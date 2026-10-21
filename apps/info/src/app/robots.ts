/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: ['/api/', '/bugs'],
		},
		sitemap: 'https://info.xernerx.com/sitemap.xml',
	};
}
