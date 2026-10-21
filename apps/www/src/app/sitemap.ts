/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://www.xernerx.com';
	const now = new Date();

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: `${baseUrl}/download`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: `${baseUrl}/invites`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/applications`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
		{ url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
	];
}
