/** @format */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://admin.xernerx.com';
	const now = new Date();

	return [{ url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 }];
}
