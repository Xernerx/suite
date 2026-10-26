/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			disallow: ['/api/', '/bots/'],
		},
		sitemap: 'https://portal.xernerx.com/sitemap.xml',
	};
}
