/** @format */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			disallow: ['/api/', '/documents/'],
		},
		sitemap: 'https://haste.xernerx.com/sitemap.xml',
	};
}
