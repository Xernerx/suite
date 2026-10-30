/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://app.xernerx.com';
	const now = new Date();

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
		{ url: `${baseUrl}/bots`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/servers`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
	];
}
