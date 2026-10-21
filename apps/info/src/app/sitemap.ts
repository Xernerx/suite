/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://info.xernerx.com';
	const now = new Date();

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
		{ url: `${baseUrl}/status`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
		{ url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/roadmap`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/issues`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/suggestions`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];
}
