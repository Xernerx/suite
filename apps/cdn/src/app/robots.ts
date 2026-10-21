/** @format */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/'],
			disallow: ['/upload', '/media', '/raw/', '/api/'],
		},
		sitemap: 'https://cdn.xernerx.com/sitemap.xml',
	};
}
