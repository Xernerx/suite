/** @format */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: ['/'],
			disallow: ['/secure/', '/v1/', '/core/', '/info/', '/webhooks/', '/api/'],
		},
		sitemap: 'https://api.xernerx.com/sitemap.xml',
	};
}
