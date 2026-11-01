/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://info.xernerx.com';
	const now = new Date();

	let latestChangelogDate = now;
	let latestRoadmapDate = now;
	let latestIssuesDate = now;
	let latestSuggestionsDate = now;

	try {
		const db = await database('xernerx');
		const coreModels = db.models.core as any;

		const [latestChangelog, latestRoadmap, latestIssue, latestSuggestion] = await Promise.all([
			coreModels?.Changelog?.findOne()
				.sort({ updatedAt: -1, createdAt: -1 })
				.select('updatedAt createdAt')
				.lean()
				.catch(() => null),
			coreModels?.Roadmap?.findOne()
				.sort({ updatedAt: -1, createdAt: -1 })
				.select('updatedAt createdAt')
				.lean()
				.catch(() => null),
			coreModels?.Issue?.findOne()
				.sort({ updatedAt: -1, createdAt: -1 })
				.select('updatedAt createdAt')
				.lean()
				.catch(() => null),
			coreModels?.Suggestion?.findOne()
				.sort({ updatedAt: -1, createdAt: -1 })
				.select('updatedAt createdAt')
				.lean()
				.catch(() => null),
		]);

		if (latestChangelog?.updatedAt || latestChangelog?.createdAt) {
			latestChangelogDate = new Date(latestChangelog.updatedAt || latestChangelog.createdAt);
		}
		if (latestRoadmap?.updatedAt || latestRoadmap?.createdAt) {
			latestRoadmapDate = new Date(latestRoadmap.updatedAt || latestRoadmap.createdAt);
		}
		if (latestIssue?.updatedAt || latestIssue?.createdAt) {
			latestIssuesDate = new Date(latestIssue.updatedAt || latestIssue.createdAt);
		}
		if (latestSuggestion?.updatedAt || latestSuggestion?.createdAt) {
			latestSuggestionsDate = new Date(latestSuggestion.updatedAt || latestSuggestion.createdAt);
		}
	} catch {
		// Fall back to current timestamp if database is unreachable during build
	}

	return [
		{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
		{ url: `${baseUrl}/status`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
		{ url: `${baseUrl}/changelog`, lastModified: latestChangelogDate, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/roadmap`, lastModified: latestRoadmapDate, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/issues`, lastModified: latestIssuesDate, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/suggestions`, lastModified: latestSuggestionsDate, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];
}
