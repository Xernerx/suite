/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://docs.xernerx.com';
	const now = new Date();

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: `${baseUrl}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: `${baseUrl}/api/v1`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: `${baseUrl}/websocket`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/cdn`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
	];
}
