/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://account.xernerx.com';
	const now = new Date();

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
	];
}
