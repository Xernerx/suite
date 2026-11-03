/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			disallow: ['/api/'],
		},
		sitemap: 'https://blog.xernerx.com/sitemap.xml',
	};
}
